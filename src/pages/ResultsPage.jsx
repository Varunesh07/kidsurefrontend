import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLocationInfo } from '../context/LocationContext';
import { Loader2, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import api from '../api/axios';
import HospitalCard from '../components/HospitalCard';
import MapView from '../components/MapView';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { location, locationError, isLoadingLocation } = useLocationInfo();
  
  const [hospitals, setHospitals] = useState([]);
  const [matchedSpecialisations, setMatchedSpecialisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ids = searchParams.get('ids');

  useEffect(() => {
    const fetchResults = async () => {
      if (!ids) {
        setError("No symptoms selected.");
        setLoading(false);
        return;
      }
      
      if (isLoadingLocation) return;
      
      if (!location) {
        setError("Location is strictly required to match hospitals. Please allow location access.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const idArray = ids.split(',');
        const res = await api.post('/api/symptoms/match', {
          symptomIds: idArray,
          lat: location.lat,
          lng: location.lng
          // radius defaults to 10000 in backend
        });
        
        setHospitals(res.data.hospitals);
        setMatchedSpecialisations(res.data.matchedSpecialisations);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to match hospitals.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [ids, location, isLoadingLocation]);

  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen">
      <div className="bg-white border-b border-l3 py-[18px] px-5 md:px-7 sticky top-0 z-20 shadow-sm mt-[60px] md:mt-0 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-l1 text-ink transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-[18px] font-bold text-ink leading-tight">Recommended Hospitals</h1>
          <p className="text-[12px] text-mid">Based on your symptoms</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-7">
        {(loading || isLoadingLocation) && (
          <div className="flex flex-col items-center justify-center py-20 text-mid gap-3">
             <Loader2 className="animate-spin text-teal" size={26} />
             <p className="text-[14px]">Running matching algorithm...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
             <div className="w-[50px] h-[50px] rounded-[16px] bg-red-bg border border-red-bdr mb-4 flex items-center justify-center">
               <AlertCircle size={24} className="text-red-dark" />
             </div>
             <p className="text-[14px] font-semibold text-ink mb-1">We couldn't find a match</p>
             <p className="text-[13px] text-mid max-w-[250px]">{error}</p>
          </div>
        )}

        {!loading && !error && hospitals.length > 0 && (
          <>
            <div className="mb-5 bg-gradient-to-r from-[#EAF7F4] to-white border border-teal/20 rounded-[14px] p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-ink mb-1">Top Matching Departments</h3>
                <div className="flex flex-wrap gap-2">
                  {matchedSpecialisations.map(spec => (
                    <span key={spec} className="px-[10px] py-[3px] bg-white border border-teal text-teal text-[11px] font-bold rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <MapView hospitals={hospitals} height="280px" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px] pb-24 md:pb-0">
              {hospitals.map(h => (
                <HospitalCard key={h._id} hospital={h} matchedCats={matchedSpecialisations} onPress={(hospital) => navigate(`/hospital/${hospital._id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
