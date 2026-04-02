import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink } from 'lucide-react';
import { calculateDistance } from '../utils/distance';
import { useLocationInfo } from '../context/LocationContext';

// Fix Leaflet's default icon missing issue in Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom pin for the user's location (distinct color)
const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Helper component to auto-pan to new center if center prop changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ hospitals = [], centerLat, centerLng, zoom = 13, height = "300px" }) {
  const { location } = useLocationInfo();
  const navigate = useNavigate();

  // Determine the map center
  const center = [
    centerLat || location?.lat || 11.0168, // Default to Coimbatore if completely null
    centerLng || location?.lng || 76.9558
  ];

  return (
    <div className="relative w-full overflow-hidden border border-l3 shadow-sm rounded-[16px] z-10" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* User's Location Marker */}
        {location && (
          <Marker position={[location.lat, location.lng]} icon={userIcon}>
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitals.map(hospital => {
          if (!hospital.location?.coordinates) return null;
          const [lng, lat] = hospital.location.coordinates;
          const dist = location ? calculateDistance(location.lat, location.lng, lat, lng) : null;
          
          return (
            <Marker key={hospital._id} position={[lat, lng]}>
              <Popup className="hospital-popup cursor-pointer" autoPan={true}>
                <div 
                  className="font-outfit text-ink min-w-[200px]"
                  onClick={() => navigate(`/hospital/${hospital._id}`)}
                >
                  <strong className="text-[14px] leading-tight block mb-1">{hospital.name}</strong>
                  <p className="text-[12px] text-mid m-0 mb-2 leading-tight truncate">{hospital.address}</p>
                  
                  <div className="flex justify-between items-center mt-2 border-t border-l3 pt-2">
                    <span className="text-[12px] font-bold text-teal">
                       {dist ? `${dist.toFixed(1)} km` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue group-hover:underline">
                      View <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
