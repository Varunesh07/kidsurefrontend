import React, { useState } from 'react';
import { MapPin, Check, Bookmark, AlertCircle, Building2 } from 'lucide-react';
import { getHospitalStatus } from '../utils/getStatus';
import { useLocationInfo } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { calculateDistance } from '../utils/distance';

const CoverImage = ({ src, alt }) => {
  const [error, setError] = useState(false);
  if (error || !src) return (
    <div className="w-full h-[140px] bg-gradient-to-br from-teal-darker via-teal to-accent flex items-center justify-center">
      <Building2 size={32} color="white" opacity={0.6} />
    </div>
  );
  return (
    <img
      src={src} 
      alt={alt}
      className="w-full h-[140px] object-cover"
      onError={() => setError(true)}
    />
  );
};

const StatusBadge = ({ hospital }) => {
  const open = getHospitalStatus(hospital) === 'open';
  return (
    <span className={`inline-flex items-center gap-[5px] text-[11px] font-semibold px-[10px] py-1 rounded-full
      ${open ? 'bg-green-bg border border-green-bdr text-green-dark' : 'bg-red-bg border border-red-bdr text-red-dark'}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${open ? 'bg-green-dark' : 'bg-red-dark'}`} />
      {open ? 'Open now' : 'Closed'}
    </span>
  );
};

const StarsRow = ({ rating, count }) => (
  <div className="flex items-center gap-[2px]">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`text-[12px] ${i <= Math.round(rating || 0) ? 'text-amber-c' : 'text-l3'}`}>★</span>
    ))}
    {count !== undefined && <span className="text-[11px] text-faint ml-[3px]">({count})</span>}
  </div>
);

export default function HospitalCard({ hospital, rank, matchedCats = [], onPress }) {
  const { location } = useLocationInfo();
  const { user, toggleBookmark } = useAuth();
  
  if (!hospital) return null;

  // Calculate distance if coordinates exist
  let displayDist = '?';
  if (location && hospital.location?.coordinates) {
    // MongoDB stores coordinates as [longitude, latitude]
    const [hLng, hLat] = hospital.location.coordinates;
    const computed = calculateDistance(location.lat, location.lng, hLat, hLng);
    if (computed !== null) {
      displayDist = computed.toFixed(1);
    }
  } else if (hospital.dist) {
    displayDist = hospital.dist.toFixed(1);
  }

  return (
    <div
      onClick={() => onPress && onPress(hospital)}
      className={`bg-white border rounded-[16px] overflow-hidden cursor-pointer transition-all
        hover:border-teal hover:shadow-[0_6px_20px_rgba(31,178,156,0.12)]
        ${rank === 1 ? 'border-[1.5px] border-teal' : 'border-l3'}`}
    >
      <div className="relative">
        <CoverImage src={hospital.coverImage} alt={hospital.name} />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(hospital._id);
          }} 
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition z-10"
        >
          <Bookmark size={15} fill={user?.savedHospitals?.includes(hospital._id) ? "white" : "none"} />
        </button>
      </div>

      <div className="px-[15px] pt-[13px] pb-[15px]">
        {rank === 1 && (
          <div className="inline-flex items-center gap-1 text-[10px] font-bold px-[10px] py-[2px] rounded-full bg-teal text-white mb-[7px]">
            <Check size={10} /> Best match
          </div>
        )}
        {rank && rank > 1 && (
          <span className="block text-[11px] font-semibold text-faint mb-1">#{rank}</span>
        )}

        <div className="flex justify-between items-start mb-1">
          <p className="text-[14px] font-semibold text-ink leading-snug pr-2">{hospital.name}</p>
          <span className="flex items-center gap-[2px] text-[11px] font-bold text-teal flex-shrink-0">
            <MapPin size={11} />{displayDist} km
          </span>
        </div>

        <p className="flex items-center gap-[3px] text-[11px] text-faint mb-[9px] truncate">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{hospital.address}</span>
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <StarsRow rating={hospital.avgRating} count={hospital.ratingCount} />
            <StatusBadge hospital={hospital} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-[9px]">
          {hospital.isEmergency && (
            <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold px-2 py-[3px] rounded-full bg-red-bg border border-red-bdr text-red-dark">
              <AlertCircle size={9} /> Emergency
            </span>
          )}
          {hospital.is24x7 && (
            <span className="text-[9px] font-semibold px-2 py-[3px] rounded-full bg-amber-bg border border-amber-bdr text-amber-dark">
              24/7
            </span>
          )}
          {hospital.categories?.map(c => (
            <span key={c}
              className={`text-[10px] font-semibold px-2 py-[3px] rounded-full border
                ${matchedCats.includes(c)
                  ? 'bg-green-bg border-green-bdr text-green-dark'
                  : 'bg-l2 border-l3 text-ink2'}`}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
