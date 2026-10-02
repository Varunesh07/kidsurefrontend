import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Layers, 
  Activity, 
  Play, 
  BarChart3
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import { useLocationInfo } from '../context/LocationContext';

// Marker icon fix
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
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38],
});

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function SpatialLabPage() {
  const { location } = useLocationInfo();
  const [activeTab, setActiveTab] = useState('within'); // 'within' | 'distances' | 'comparison'
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [boundaries, setBoundaries] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
  const [withinResult, setWithinResult] = useState(null);
  const [distanceResult, setDistanceResult] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeRadiusCircle, setActiveRadiusCircle] = useState(null); // in meters
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Map center coordinates
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]);
  const [mapZoom, setMapZoom] = useState(12);

  const userLng = location?.lng || 76.9629;
  const userLat = location?.lat || 11.0183;

  // 1. Fetch available boundary list
  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const res = await api.get('/api/spatial/boundaries');
        setBoundaries(res.data.boundaries || []);
      } catch (err) {
        console.error('Failed to fetch boundaries', err);
      }
    };
    fetchBoundaries();
  }, []);

  // 2. Select a hospital and fly to it on the map
  const handleSelectHospital = (h) => {
    if (!h?.location?.coordinates) return;
    const [lng, lat] = h.location.coordinates;
    setSelectedHospital(h);
    setMapCenter([lat, lng]);
    setMapZoom(16);
  };

  // 3. Run $geoWithin containment query
  const runGeoWithin = async (districtName = selectedDistrict) => {
    setLoading(true);
    setActiveRadiusCircle(null);
    setSelectedHospital(null);
    try {
      const res = await api.get(`/api/spatial/within-boundary?district=${districtName}`);
      setWithinResult(res.data);
      
      // Auto-center map on the first coordinate of the boundary
      if (res.data.boundary?.coordinates?.[0]?.[0]) {
        const [lng, lat] = res.data.boundary.coordinates[0][0];
        setMapCenter([lat, lng]);
        setMapZoom(11);
      }
    } catch (err) {
      console.error(err);
      alert('Error running $geoWithin query');
    } finally {
      setLoading(false);
    }
  };

  // 4. Run $geoNear Geodetic Distance Pipeline (loads all nearby hospitals across state)
  const runGeoNear = async () => {
    setLoading(true);
    setActiveRadiusCircle(null);
    setSelectedHospital(null);
    try {
      const res = await api.get(`/api/spatial/distances?lng=${userLng}&lat=${userLat}&limit=60`);
      setDistanceResult(res.data.hospitals || []);
      setMapCenter([userLat, userLng]);
      setMapZoom(11);
    } catch (err) {
      console.error(err);
      alert('Error calculating distances');
    } finally {
      setLoading(false);
    }
  };

  // 5. Run Multi-Radius Comparison ($facet)
  const runRadiusComparison = async () => {
    setLoading(true);
    setSelectedHospital(null);
    try {
      const res = await api.get(`/api/spatial/radius-comparison?lng=${userLng}&lat=${userLat}`);
      setComparisonResult(res.data.comparison);
      setActiveRadiusCircle(5000); // 5km circle
      setMapCenter([userLat, userLng]);
      setMapZoom(12);
    } catch (err) {
      console.error(err);
      alert('Error comparing radius buckets');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    runGeoWithin('Coimbatore');
  }, []);

  // Convert GeoJSON [lng, lat] polygon coordinates to Leaflet [lat, lng] format
  const getLeafletPolygonCoords = () => {
    if (!withinResult?.boundary?.coordinates?.[0]) return [];
    return withinResult.boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-l1 pb-16">
      {/* Top Header */}
      <div className="bg-ink text-white px-5 md:px-8 py-6 shadow-md border-b border-l3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/20 text-teal border border-teal/40 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2">
              <Compass size={14} /> Big Data Spatial Lab v2
            </div>
            <h1 className="font-serif text-[24px] md:text-[28px] font-bold leading-tight">
              MongoDB Geospatial Analytics Dashboard
            </h1>
            <p className="text-[13px] text-l3 mt-1">
              Demonstrating GeoJSON Points (Hospitals), Polygons (Boundaries), and 2dsphere indexing.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap gap-2 text-[12px]">
            <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl">
              <span className="text-faint block text-[10px] uppercase font-semibold">Indexed Points</span>
              <strong className="text-white text-[15px]">1,021 Hospitals</strong>
            </div>
            <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl">
              <span className="text-faint block text-[10px] uppercase font-semibold">Boundaries</span>
              <strong className="text-white text-[15px]">{boundaries.length || 38} District Polygons</strong>
            </div>
            <div className="bg-teal/20 border border-teal/40 px-3 py-1.5 rounded-xl text-teal">
              <span className="text-teal/80 block text-[10px] uppercase font-semibold">Atlas Index</span>
              <strong className="text-white text-[15px]">2dsphere</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Controls & Feature Panes (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Navigation Tabs for Lab Features */}
          <div className="flex bg-white p-1 rounded-2xl border border-l3 shadow-sm overflow-x-auto no-scrollbar gap-1">
            {[
              { id: 'within', label: '$geoWithin (Polygon)', icon: Layers },
              { id: 'distances', label: '$geoNear (Distances)', icon: Activity },
              { id: 'comparison', label: 'Radius Density', icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  if (id === 'within' && !withinResult) runGeoWithin();
                  if (id === 'distances') runGeoNear();
                  if (id === 'comparison') runRadiusComparison();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap
                  ${activeTab === id 
                    ? 'bg-teal text-white shadow-sm' 
                    : 'text-mid hover:text-ink hover:bg-l1'}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* TAB 1: $geoWithin Containment Query */}
          {activeTab === 'within' && (
            <div className="bg-white border border-l3 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-l3 pb-4">
                <div>
                  <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                    <Layers size={18} className="text-teal" /> Feature 4: Boundary Containment ($geoWithin)
                  </h3>
                  <p className="text-[12px] text-mid mt-0.5">
                    Query hospital points strictly enclosed inside the administrative Polygon.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      runGeoWithin(e.target.value);
                    }}
                    className="bg-l2 border border-l3 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-ink outline-none focus:border-teal max-w-[220px]"
                  >
                    {boundaries.length > 0 ? (
                      boundaries.map(b => (
                        <option key={b._id} value={b.district}>{b.name}</option>
                      ))
                    ) : (
                      <option value="Coimbatore">Coimbatore Corporation</option>
                    )}
                  </select>

                  <button
                    onClick={() => runGeoWithin(selectedDistrict)}
                    disabled={loading}
                    className="bg-teal hover:bg-teal-dark text-white px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Play size={12} /> Run
                  </button>
                </div>
              </div>

              {withinResult && (
                <div className="space-y-4">
                  {/* Results summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-bg border border-green-bdr p-3 rounded-xl text-center">
                      <span className="text-[11px] font-semibold text-green-dark block">Enclosed Hospitals</span>
                      <strong className="text-[20px] font-bold text-green-dark">{withinResult.totalInside}</strong>
                    </div>
                    <div className="bg-blue-bg border border-blue-bdr p-3 rounded-xl text-center">
                      <span className="text-[11px] font-semibold text-blue-c block">Target Boundary</span>
                      <strong className="text-[13px] font-bold text-ink leading-tight block mt-1">{withinResult.district}</strong>
                    </div>
                    <div className="bg-amber-bg border border-amber-bdr p-3 rounded-xl text-center">
                      <span className="text-[11px] font-semibold text-amber-dark block">Query Type</span>
                      <strong className="text-[13px] font-bold text-amber-dark leading-tight block mt-1">$geoWithin</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-teal font-semibold flex items-center gap-1">
                    <MapPin size={12} /> Click any hospital below to fly near it on the map
                  </p>

                  {/* Hospital List preview */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {withinResult.hospitals.map((h, i) => {
                      const isSelected = selectedHospital?._id === h._id;
                      return (
                        <div 
                          key={h._id || i} 
                          onClick={() => handleSelectHospital(h)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-3
                            ${isSelected 
                              ? 'border-teal bg-green-bg shadow-sm ring-2 ring-teal/30' 
                              : 'border-l3 bg-l1 hover:border-teal hover:bg-white'}`}
                        >
                          <div>
                            <strong className="text-[13px] text-ink block">{h.name}</strong>
                            <span className="text-[11px] text-mid truncate block max-w-sm">{h.address}</span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {h.isEmergency && <span className="bg-red-bg text-red-dark text-[9px] font-bold px-1.5 py-0.5 rounded">Emergency</span>}
                            {h.is24x7 && <span className="bg-amber-bg text-amber-dark text-[9px] font-bold px-1.5 py-0.5 rounded">24/7</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: $geoNear Geodetic Distances */}
          {activeTab === 'distances' && (
            <div className="bg-white border border-l3 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-l3 pb-4">
                <div>
                  <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                    <Activity size={18} className="text-teal" /> Feature 3: Geodetic Distances ($geoNear)
                  </h3>
                  <p className="text-[12px] text-mid mt-0.5">
                    MongoDB Aggregation Pipeline calculating exact distance in kilometers from your coordinates.
                  </p>
                </div>
                <button
                  onClick={runGeoNear}
                  disabled={loading}
                  className="bg-teal hover:bg-teal-dark text-white px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Play size={12} /> Recalculate
                </button>
              </div>

              <p className="text-[11px] text-teal font-semibold flex items-center gap-1">
                <MapPin size={12} /> Plotted {distanceResult.length} nearest hospitals. Click any hospital to fly near it on the map.
              </p>

              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {distanceResult.map((h, i) => {
                  const isSelected = selectedHospital?._id === h._id;
                  return (
                    <div 
                      key={h._id} 
                      onClick={() => handleSelectHospital(h)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center
                        ${isSelected 
                          ? 'border-teal bg-green-bg shadow-sm ring-2 ring-teal/30' 
                          : 'border-l3 bg-l1 hover:border-teal hover:bg-white'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-amber-c text-ink' : 'bg-teal text-white'}`}>{i + 1}</span>
                          <strong className="text-[13px] text-ink">{h.name}</strong>
                        </div>
                        <p className="text-[11px] text-mid ml-7 mt-0.5">{h.address} &bull; <span className="font-semibold text-teal">{h.district}</span></p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[14px] font-bold text-teal block">{h.distanceKm} km</span>
                        <span className="text-[10px] text-faint">{h.distanceMeters} m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Radius Comparison ($facet) */}
          {activeTab === 'comparison' && (
            <div className="bg-white border border-l3 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-l3 pb-4">
                <div>
                  <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                    <BarChart3 size={18} className="text-teal" /> Feature 6: Comparative Radius Scaling
                  </h3>
                  <p className="text-[12px] text-mid mt-0.5">
                    Evaluates hospital density across 2 km, 5 km, and 10 km using single-pipeline $facet.
                  </p>
                </div>
                <button
                  onClick={runRadiusComparison}
                  disabled={loading}
                  className="bg-teal hover:bg-teal-dark text-white px-3.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Play size={12} /> Compare
                </button>
              </div>

              {comparisonResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      onClick={() => setActiveRadiusCircle(2000)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${activeRadiusCircle === 2000 ? 'border-teal bg-green-bg' : 'border-l3 bg-white'}`}
                    >
                      <span className="text-[11px] font-bold text-mid block uppercase tracking-wide">&le; 2 Kilometers</span>
                      <strong className="text-[26px] font-serif font-bold text-teal">{comparisonResult.twoKm.count}</strong>
                      <span className="text-[11px] text-faint block mt-1">Hospitals nearby</span>
                    </div>

                    <div 
                      onClick={() => setActiveRadiusCircle(5000)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${activeRadiusCircle === 5000 ? 'border-teal bg-green-bg' : 'border-l3 bg-white'}`}
                    >
                      <span className="text-[11px] font-bold text-mid block uppercase tracking-wide">&le; 5 Kilometers</span>
                      <strong className="text-[26px] font-serif font-bold text-teal">{comparisonResult.fiveKm.count}</strong>
                      <span className="text-[11px] text-faint block mt-1">City core range</span>
                    </div>

                    <div 
                      onClick={() => setActiveRadiusCircle(10000)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${activeRadiusCircle === 10000 ? 'border-teal bg-green-bg' : 'border-l3 bg-white'}`}
                    >
                      <span className="text-[11px] font-bold text-mid block uppercase tracking-wide">&le; 10 Kilometers</span>
                      <strong className="text-[26px] font-serif font-bold text-teal">{comparisonResult.tenKm.count}</strong>
                      <span className="text-[11px] text-faint block mt-1">Metropolitan range</span>
                    </div>
                  </div>

                  <div className="bg-l1 p-3 rounded-xl border border-l3 text-[12px] text-mid flex items-center justify-between">
                    <span>Active Circle on Map: <strong>{activeRadiusCircle ? `${activeRadiusCircle / 1000} km buffer` : 'None'}</strong></span>
                    <span className="text-teal font-semibold">Click any card to render radius circle on Leaflet</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Interactive Leaflet Map (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-l3 shadow-sm flex items-center justify-between text-[12px] font-semibold text-ink">
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-teal" /> Live Spatial Canvas (Leaflet)</span>
            <span className="text-[11px] text-faint">OpenStreetMap TileLayer</span>
          </div>

          <div className="flex-1 w-full min-h-[460px] rounded-2xl overflow-hidden border border-l3 shadow-sm relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', minHeight: '460px' }}
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User Position */}
              <Marker position={[userLat, userLng]} icon={userIcon}>
                <Popup>
                  <strong>User Location</strong>
                  <br />[{userLat.toFixed(4)}, {userLng.toFixed(4)}]
                </Popup>
              </Marker>

              {/* District Boundary Polygon */}
              {getLeafletPolygonCoords().length > 0 && (
                <Polygon
                  positions={getLeafletPolygonCoords()}
                  pathOptions={{
                    color: '#1FB29C',
                    fillColor: '#1FB29C',
                    fillOpacity: 0.18,
                    weight: 2.5,
                    dashArray: '4, 4'
                  }}
                >
                  <Popup>
                    <strong>{withinResult.boundaryName}</strong>
                    <br />Total Enclosed Hospitals: {withinResult.totalInside}
                  </Popup>
                </Polygon>
              )}

              {/* Radius Circle if testing comparison */}
              {activeRadiusCircle && (
                <Circle
                  center={[userLat, userLng]}
                  radius={activeRadiusCircle}
                  pathOptions={{
                    color: '#3a82c4',
                    fillColor: '#3a82c4',
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                />
              )}

              {/* Hospital Markers for $geoWithin */}
              {activeTab === 'within' && withinResult?.hospitals?.map(h => {
                if (!h.location?.coordinates) return null;
                const [lng, lat] = h.location.coordinates;
                const isSelected = selectedHospital?._id === h._id;
                return (
                  <Marker 
                    key={h._id} 
                    position={[lat, lng]}
                    icon={isSelected ? selectedIcon : DefaultIcon}
                    eventHandlers={{
                      click: () => handleSelectHospital(h),
                    }}
                  >
                    <Popup>
                      <strong>{h.name}</strong>
                      <br />{h.address}
                      <br /><span className="text-teal font-bold">{h.district}</span>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Hospital Markers for $geoNear Distances */}
              {activeTab === 'distances' && distanceResult.map(h => {
                if (!h.location?.coordinates) return null;
                const [lng, lat] = h.location.coordinates;
                const isSelected = selectedHospital?._id === h._id;
                return (
                  <Marker 
                    key={h._id} 
                    position={[lat, lng]}
                    icon={isSelected ? selectedIcon : DefaultIcon}
                    eventHandlers={{
                      click: () => handleSelectHospital(h),
                    }}
                  >
                    <Popup>
                      <strong>{h.name}</strong>
                      <br />{h.address}
                      <br /><span className="text-teal font-bold">{h.district}</span>
                      <br />Distance: <strong className="text-teal">{h.distanceKm} km</strong> ({h.distanceMeters} m)
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
