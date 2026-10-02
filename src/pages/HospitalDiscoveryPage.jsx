import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Phone, 
  Star, 
  Compass, 
  ChevronRight, 
  Filter, 
  Layers, 
  AlertCircle, 
  ExternalLink, 
  List, 
  Map as MapIcon, 
  Building2,
  Bookmark,
  Check,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { useLocationInfo } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { getHospitalStatus } from '../utils/getStatus';

// Leaflet marker assets
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
});

// Map controller component
function ChangeMapView({ center, zoom, bounds, mobileView }) {
  const map = useMap();

  // Instant mobile resize invalidation when toggling list/map
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [mobileView, map]);

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      } catch (e) {
        if (center && center[0] && center[1]) {
          map.setView(center, zoom, { animate: true });
        }
      }
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function HospitalDiscoveryPage() {
  const navigate = useNavigate();
  const { location, locationError, isLoadingLocation, fetchLocation } = useLocationInfo();
  const { user, toggleBookmark } = useAuth();

  // Mode: 'nearby' (Dynamic 10km -> 50km proximity) | 'district' (Polygon boundary explorer)
  const [discoveryMode, setDiscoveryMode] = useState('nearby');
  
  // Mobile view toggle: 'list' | 'map'
  const [mobileView, setMobileView] = useState('list');

  // Query & Data states
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Proximity states
  const [proximityMeta, setProximityMeta] = useState({
    radiusUsedKm: 10,
    autoExpanded: false,
    message: ''
  });

  // District states
  const [districtList, setDistrictList] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
  const [districtBoundary, setDistrictBoundary] = useState(null);

  // Selected hospital for map preview
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Map viewport states
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapBounds, setMapBounds] = useState(null);

  const userLng = location?.lng || 76.9629;
  const userLat = location?.lat || 11.0183;

  const categories = [
    'All',
    'Emergency',
    'Paediatric',
    'General',
    'Surgery',
    'ENT',
    'Neurology',
    'Orthopaedic'
  ];

  // 1. Fetch available district boundaries on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/api/spatial/boundaries');
        if (res.data?.boundaries?.length > 0) {
          const names = Array.from(new Set(res.data.boundaries.map(b => b.district || b.name))).filter(Boolean).sort();
          setDistrictList(names);
        }
      } catch (err) {
        console.error('Failed to load district list', err);
      }
    };
    fetchDistricts();
  }, []);

  // 2. Request user location if not already present
  useEffect(() => {
    if (!location && !locationError && !isLoadingLocation) {
      fetchLocation();
    }
  }, [location, locationError, isLoadingLocation, fetchLocation]);

  // 3. Trigger search when mode or district changes
  useEffect(() => {
    if (discoveryMode === 'nearby') {
      loadNearbyHospitals();
    } else {
      loadDistrictHospitals(selectedDistrict);
    }
  }, [discoveryMode, location]);

  // Dynamic nearby search with auto-expansion (10km -> 50km)
  const loadNearbyHospitals = async () => {
    setLoading(true);
    setSelectedHospital(null);
    setDistrictBoundary(null);
    setMapBounds(null);
    try {
      const res = await api.get(`/api/spatial/smart-nearby?lng=${userLng}&lat=${userLat}&initialRadius=10000&maxRadius=50000`);
      setHospitals(res.data.hospitals || []);
      setProximityMeta({
        radiusUsedKm: res.data.radiusUsedKm || 10,
        autoExpanded: res.data.autoExpanded || false,
        message: res.data.message || ''
      });
      setMapCenter([userLat, userLng]);
      setMapZoom(res.data.autoExpanded ? 10 : 12);
    } catch (err) {
      console.error('Error fetching nearby hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  // District boundary query using polygon containment
  const loadDistrictHospitals = async (districtName) => {
    setLoading(true);
    setSelectedHospital(null);
    try {
      const res = await api.get(`/api/spatial/within-boundary?district=${districtName}`);
      setHospitals(res.data.hospitals || []);
      setDistrictBoundary(res.data.boundary || null);

      // Calculate bounds for the polygon
      if (res.data.boundary?.coordinates?.[0]?.length > 0) {
        const ring = res.data.boundary.coordinates[0];
        const latLngs = ring.map(([lng, lat]) => [lat, lng]);
        setMapBounds(latLngs);
        const centerCoord = latLngs[0];
        setMapCenter(centerCoord);
      }
    } catch (err) {
      console.error('Error fetching district hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    loadDistrictHospitals(newDistrict);
  };

  // Handle hospital selection
  const handleSelectHospital = (h, shouldSwitchToMap = false) => {
    if (!h) return;
    setSelectedHospital(h);
    if (h.location?.coordinates) {
      const [lng, lat] = h.location.coordinates;
      setMapBounds(null);
      setMapCenter([lat, lng]);
      setMapZoom(16);
    }
    if (shouldSwitchToMap) {
      setMobileView('map');
    }
  };

  // Filter hospitals locally by search input and category
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const matchesSearch = !searchQuery || 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (h.address && h.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === 'All' || 
        (activeCategory === 'Emergency' && h.isEmergency) ||
        (h.categories && h.categories.includes(activeCategory));

      return matchesSearch && matchesCategory;
    });
  }, [hospitals, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] min-h-screen">
      
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm mt-[60px] md:mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1FB29C] uppercase tracking-wider mb-1">
                <Compass size={14} /> Hospital & Emergency Discovery
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                Find Healthcare Facilities
              </h1>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start md:self-auto shadow-inner">
              <button
                onClick={() => setDiscoveryMode('nearby')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  discoveryMode === 'nearby'
                    ? 'bg-white text-[#1FB29C] shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Navigation size={15} /> Near Me (Auto-Radius)
              </button>
              <button
                onClick={() => setDiscoveryMode('district')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  discoveryMode === 'district'
                    ? 'bg-white text-[#1FB29C] shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={15} /> Explore by District
              </button>
            </div>
          </div>

          {/* Search bar & District Selector Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
            <div className={`relative ${discoveryMode === 'district' ? 'md:col-span-8' : 'md:col-span-12'}`}>
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospital name, area, or facility..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1FB29C] focus:ring-2 focus:ring-[#1FB29C]/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {discoveryMode === 'district' && (
              <div className="md:col-span-4 relative">
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#1FB29C] focus:ring-2 focus:ring-[#1FB29C]/10 transition-all appearance-none cursor-pointer"
                >
                  {districtList.map(dist => (
                    <option key={dist} value={dist}>
                      📍 {dist} District
                    </option>
                  ))}
                </select>
                <ChevronRight size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Category Pills Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dynamic Auto-Expansion Alert Banner */}
          {discoveryMode === 'nearby' && proximityMeta.autoExpanded && (
            <div className="mt-3 flex items-center gap-2.5 bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-amber-900 text-xs sm:text-sm">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <div className="flex-1 leading-snug">
                <span className="font-bold">Notice:</span> No hospitals were found within 10 km of your location. The search was <strong>automatically expanded to {proximityMeta.radiusUsedKm} km</strong> to locate the closest emergency and pediatric centers.
              </div>
            </div>
          )}

          {/* Status summary */}
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Found <strong className="text-slate-900">{filteredHospitals.length}</strong> facilities
              {discoveryMode === 'district' ? ` in ${selectedDistrict} District` : ` within ${proximityMeta.radiusUsedKm} km`}
            </span>
            {location && discoveryMode === 'nearby' && (
              <span className="flex items-center gap-1 text-[#1FB29C] font-semibold">
                <MapPin size={12} /> Using live GPS
              </span>
            )}
          </div>

        </div>
      </div>

      {/* 2. MOBILE FLOATING VIEW SWITCHER (List vs Map) */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md text-white p-1 rounded-full shadow-xl border border-white/20">
          <button
            onClick={() => setMobileView('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              mobileView === 'list'
                ? 'bg-[#1FB29C] text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <List size={14} /> List ({filteredHospitals.length})
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              mobileView === 'map'
                ? 'bg-[#1FB29C] text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapIcon size={14} /> Map
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT LAYOUT (Split on Desktop, Toggled on Mobile) */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Scrollable Hospital List */}
        <div className={`w-full md:w-[45%] lg:w-[42%] md:border-r border-slate-200 overflow-y-auto ${
          mobileView === 'map' ? 'hidden md:block' : 'block'
        } p-4 sm:p-5 space-y-3.5 pb-24 md:pb-6`}>
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-3 border-[#1FB29C] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold">Finding healthcare facilities...</p>
            </div>
          )}

          {!loading && filteredHospitals.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <AlertCircle size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-800 text-base mb-1">No Hospitals Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                No facilities match your search criteria. Try switching districts or clearing category filters.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!loading && filteredHospitals.map((hospital, idx) => {
            const isSelected = selectedHospital?._id === hospital._id;
            const isOpen = getHospitalStatus(hospital) === 'open';
            const distDisplay = hospital.distanceKm 
              ? `${hospital.distanceKm} km` 
              : hospital.dist 
              ? `${hospital.dist.toFixed(1)} km` 
              : null;

            return (
              <div
                key={hospital._id || idx}
                onClick={() => handleSelectHospital(hospital, false)}
                className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden group ${
                  isSelected
                    ? 'border-[#1FB29C] ring-2 ring-[#1FB29C]/20 shadow-md bg-teal-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  
                  {/* Thumbnail */}
                  <div className="sm:w-36 h-36 sm:h-auto relative bg-slate-100 flex-shrink-0 overflow-hidden">
                    {hospital.coverImage ? (
                      <img 
                        src={hospital.coverImage} 
                        alt={hospital.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center text-white/50">
                        <Building2 size={32} />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(hospital._id);
                      }}
                      className="absolute top-2.5 right-2.5 sm:left-2.5 sm:right-auto w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-700 hover:bg-white shadow-sm"
                    >
                      <Bookmark size={15} fill={user?.savedHospitals?.includes(hospital._id) ? "#1FB29C" : "none"} color={user?.savedHospitals?.includes(hospital._id) ? "#1FB29C" : "currentColor"} />
                    </button>
                  </div>

                  {/* Info Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-serif text-base font-bold text-slate-900 group-hover:text-[#1FB29C] transition-colors leading-tight">
                          {hospital.name}
                        </h2>
                        {distDisplay && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#1FB29C] bg-[#1FB29C]/10 px-2 py-0.5 rounded-md flex-shrink-0">
                            <MapPin size={11} /> {distDisplay}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                        {hospital.address || `${hospital.district}, Tamil Nadu`}
                      </p>

                      {/* Badges: Open/Close, 24/7, Rating */}
                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isOpen 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {isOpen ? 'Open Now' : 'Closed'}
                        </span>

                        {hospital.is24x7 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            24/7
                          </span>
                        )}

                        {hospital.isEmergency && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Emergency
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 ml-auto">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span>{hospital.avgRating ? hospital.avgRating.toFixed(1) : '4.5'}</span>
                          <span className="text-slate-400 text-[11px]">({hospital.ratingCount || 12})</span>
                        </div>
                      </div>

                      {/* Category tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {hospital.categories?.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHospital(hospital, true);
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-[#1FB29C] flex items-center gap-1 py-1"
                      >
                        <MapPin size={13} /> View on Map
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hospital/${hospital._id}`);
                        }}
                        className="text-xs font-bold text-white bg-[#1FB29C] hover:bg-[#199482] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        Full Details & Reviews <ChevronRight size={13} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* RIGHT PANEL: Interactive Leaflet Map */}
        <div className={`w-full md:w-[55%] lg:w-[58%] h-[calc(100vh-180px)] md:h-[calc(100vh-80px)] md:sticky md:top-0 relative z-10 ${
          mobileView === 'list' ? 'hidden md:block' : 'block'
        }`}>
          
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            preferCanvas={true}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={18}
              keepBuffer={2}
              updateWhenZooming={false}
              updateWhenIdle={true}
            />
            
            <ChangeMapView center={mapCenter} zoom={mapZoom} bounds={mapBounds} mobileView={mobileView} />

            {/* User GPS Location Marker */}
            {location && (
              <Marker position={[userLat, userLng]} icon={userIcon}>
                <Popup>
                  <div className="p-1 font-sans">
                    <p className="font-bold text-xs text-red-600">Your Location</p>
                    <p className="text-[11px] text-slate-600">{userLat.toFixed(4)}, {userLng.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Near Me Mode: Visual Radius Circle */}
            {discoveryMode === 'nearby' && (
              <Circle
                center={[userLat, userLng]}
                radius={proximityMeta.radiusUsedKm * 1000}
                pathOptions={{
                  color: '#1FB29C',
                  fillColor: '#1FB29C',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4 4'
                }}
              />
            )}

            {/* District Mode: District Boundary Polygon */}
            {discoveryMode === 'district' && districtBoundary?.coordinates?.[0] && (
              <Polygon
                positions={districtBoundary.coordinates[0].map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: '#0d9488',
                  fillColor: '#14b8a6',
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
            )}

            {/* Hospital Markers — lightweight on mobile (selective popup mounting) */}
            {filteredHospitals.map(h => {
              if (!h.location?.coordinates) return null;
              const [hLng, hLat] = h.location.coordinates;
              const isSelected = selectedHospital?._id === h._id;

              return (
                <Marker
                  key={h._id}
                  position={[hLat, hLng]}
                  icon={isSelected ? selectedIcon : DefaultIcon}
                  eventHandlers={{
                    click: () => setSelectedHospital(h),
                  }}
                >
                  {isSelected && (
                    <Popup>
                      <div className="p-1 font-sans min-w-[190px]">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug mb-1">
                          {h.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mb-2">
                          {h.address || h.district}
                        </p>
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className={`font-bold ${getHospitalStatus(h) === 'open' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {getHospitalStatus(h) === 'open' ? '● Open Now' : '● Closed'}
                          </span>
                          {h.distanceKm && (
                            <span className="font-bold text-[#1FB29C]">{h.distanceKm} km</span>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/hospital/${h._id}`)}
                          className="w-full py-1.5 bg-[#1FB29C] text-white text-xs font-bold rounded-lg text-center hover:bg-[#199482] transition-colors block"
                        >
                          View Full Details & Reviews
                        </button>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}

          </MapContainer>

          {/* DOCKED BOTTOM CARD ON MOBILE (When a hospital is selected on the map) */}
          {selectedHospital && (
            <div className="md:hidden absolute bottom-28 left-4 right-4 z-[999] bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-serif text-sm font-bold text-slate-900 leading-tight">
                    {selectedHospital.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {selectedHospital.address}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHospital(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                  getHospitalStatus(selectedHospital) === 'open'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {getHospitalStatus(selectedHospital) === 'open' ? 'Open Now' : 'Closed'}
                </span>
                {selectedHospital.distanceKm && (
                  <span className="font-bold text-[#1FB29C]">
                    📍 {selectedHospital.distanceKm} km away
                  </span>
                )}
                <div className="flex items-center gap-1 font-semibold text-slate-700 ml-auto">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{selectedHospital.avgRating ? selectedHospital.avgRating.toFixed(1) : '4.5'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedHospital.phone && (
                  <a
                    href={`tel:${selectedHospital.phone}`}
                    className="py-2 px-3 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-200 transition"
                  >
                    <Phone size={13} /> Call
                  </a>
                )}
                <button
                  onClick={() => navigate(`/hospital/${selectedHospital._id}`)}
                  className={`py-2 px-3 bg-[#1FB29C] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#199482] transition ${
                    !selectedHospital.phone ? 'col-span-2' : ''
                  }`}
                >
                  Full Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
