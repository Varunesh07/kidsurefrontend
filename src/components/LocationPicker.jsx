import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper component that catches clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}></Marker>
  );
}

// Auto-pan helper based on search or init
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onChange, defaultPosition }) {
  const [position, setPosition] = useState(defaultPosition || null);
  
  // Default to a central coordinate if no position is picked yet
  const center = position ? [position.lat, position.lng] : [11.0168, 76.9558]; // Coimbatore default

  // Notify parent form whenever position changes
  useEffect(() => {
    if (position) {
      onChange(position);
    }
  }, [position, onChange]);

  return (
    <div className="w-full h-[300px] border border-l3 rounded-[12px] overflow-hidden shadow-inner relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      
      {/* Overlay instruction */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-ink text-white text-[12px] px-4 py-1.5 rounded-full shadow-md pointer-events-none z-[1000] opacity-90">
        Tap map to drop pin
      </div>
    </div>
  );
}
