import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationInfo } from '../context/LocationContext';
import api from '../api/axios';
import HospitalCard from '../components/HospitalCard';
import { MapPin, Building2, AlertCircle, Clock, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { location, locationError, isLoadingLocation, fetchLocation } = useLocationInfo();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we don't have a location yet, ask for it
    if (!location && !locationError && !isLoadingLocation) {
      fetchLocation();
    }
  }, [location, locationError, isLoadingLocation, fetchLocation]);

  useEffect(() => {
    // When we get a location, fetch nearby hospitals
    if (location) {
      const fetchNearby = async () => {
        setLoadingHospitals(true);
        setError(null);
        try {
          const res = await api.get(`/api/hospitals/nearby?lat=${location.lat}&lng=${location.lng}&radius=15000`);
          setHospitals(res.data);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch nearby hospitals. Please try again.');
        } finally {
          setLoadingHospitals(false);
        }
      };
      fetchNearby();
    }
  }, [location]);

  const emergencyCount = hospitals.filter(h => h.isEmergency).length;
  const open24Count = hospitals.filter(h => h.is24x7).length;

  const stats = [
    { val: hospitals.length,  label: 'Nearby hospitals',  Icon: Building2,    iconBg: 'bg-green-bg', iconColor: '#1FB29C' },
    { val: emergencyCount,    label: 'Emergency ready',   Icon: AlertCircle,  iconBg: 'bg-red-bg',   iconColor: '#e05c5c' },
    { val: open24Count,       label: 'Open 24/7',         Icon: Clock,        iconBg: 'bg-amber-bg', iconColor: '#e89a2a' },
  ];

  const goToDetail = (hospital) => navigate(`/hospital/${hospital._id}`);

  return (
    <div className="pb-10">
      <div
        className="px-7 py-[30px] text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(130deg, #0d7a66 0%, #1FB29C 58%, #ADCFE6 100%)' }}
      >
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/[0.06]" />
        <div className="absolute right-12 -bottom-12 w-32 h-32 rounded-full bg-white/[0.04]" />

        <p className="text-[12px] text-white/80 flex items-center gap-[5px] mb-[6px]">
          <MapPin size={12} /> 
          {location ? 'Location acquired' : isLoadingLocation ? 'Locating you...' : 'Location needed'}
        </p>
        <h1 className="font-serif text-[24px] font-bold mb-1">Hello, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-[13px] text-white/75">Hospitals near you — sorted by distance</p>
      </div>

      <div className="px-5 md:px-7 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {stats.map(({ val, label, Icon, iconBg, iconColor }) => (
            <div key={label} className="bg-white border border-l3 rounded-[14px] p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={20} color={iconColor} />
              </div>
              <div>
                <p className="font-serif text-[24px] font-bold text-ink leading-none">{val}</p>
                <p className="text-[12px] text-mid mt-[2px]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-[6px] text-[11px] font-semibold text-faint uppercase tracking-widest mb-3 mt-8">
          <Building2 size={13} />
          Nearby hospitals
        </div>

        {/* Status Handling */}
        {locationError && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px]">
            Please enable location services in your browser so we can find hospitals near you.
          </div>
        )}
        
        {isLoadingLocation && !locationError && (
          <div className="flex flex-col items-center justify-center py-10 text-mid gap-3">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-[13px]">Acquiring your location...</p>
          </div>
        )}

        {loadingHospitals && (
          <div className="flex flex-col items-center justify-center py-10 text-mid gap-3">
            <Loader2 className="animate-spin text-teal" size={24} />
            <p className="text-[13px]">Searching for hospitals...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px]">
            {error}
          </div>
        )}

        {/* Grid */}
        {!loadingHospitals && !error && hospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
            {hospitals.map(h => (
              <HospitalCard key={h._id} hospital={h} onPress={goToDetail} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingHospitals && !isLoadingLocation && location && hospitals.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-faint">
             <div className="w-[60px] h-[60px] rounded-[18px] bg-l1 flex items-center justify-center mb-4">
               <MapPin size={28} className="text-mid" />
             </div>
             <p className="text-[15px] font-semibold text-mid mb-1">No hospitals found</p>
             <p className="text-[13px]">We couldn't find any paediatric hospitals inside a 15km radius of your location.</p>
          </div>
        )}
      </div>
    </div>
  );
}
