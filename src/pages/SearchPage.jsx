import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useLocationInfo } from '../context/LocationContext';
import api from '../api/axios';
import HospitalCard from '../components/HospitalCard';

export default function SearchPage() {
  const { location, locationError, isLoadingLocation, fetchLocation } = useLocationInfo();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeRadius, setActiveRadius] = useState(10000); // Default 10km

  const categories = [
    'Emergency', 'Paediatric', 'General', 'Surgery', 'Neonatal', 'Orthopaedic', 'Neurology'
  ];

  const distances = [
    { label: '< 2km', value: 2000 },
    { label: '< 5km', value: 5000 },
    { label: '< 10km', value: 10000 },
    { label: 'Any', value: 50000 },
  ];

  useEffect(() => {
    if (!location && !locationError && !isLoadingLocation) {
      fetchLocation();
    }
  }, [location, locationError, isLoadingLocation, fetchLocation]);

  useEffect(() => {
    if (location) {
      const fetchHospitals = async () => {
        setLoading(true);
        setError(null);
        try {
          const url = `/api/hospitals/search?lat=${location.lat}&lng=${location.lng}&radius=${activeRadius}${activeCategory ? `&category=${activeCategory}` : ''}`;
          const res = await api.get(url);
          setHospitals(res.data);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch hospitals. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchHospitals();
    }
  }, [location, activeCategory, activeRadius]);

  // filter locally for name
  const displayedHospitals = hospitals.filter(h => h.name.toLowerCase().includes(searchText.toLowerCase()));

  const handleCategoryToggle = (cat) => {
    setActiveCategory(prev => prev === cat ? null : cat);
  };

  const goToDetail = (hospital) => navigate(`/hospital/${hospital._id}`);

  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen">
      <div className="bg-white border-b border-l3 pt-[20px] pb-3 px-5 md:px-7 sticky top-0 md:top-0 z-20 shadow-sm mt-[60px] md:mt-0">
        <h1 className="font-serif text-[22px] font-bold text-ink mb-3">Find Care</h1>
        <div className="relative mb-[14px]">
          <Search size={16} className="absolute left-3 top-1/2 -mt-2 text-faint" />
          <input
            type="text"
            placeholder="Search hospitals by name..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full bg-l1 border border-l3 rounded-[12px] py-[10px] pl-[34px] pr-[14px] text-[13px] font-medium text-ink outline-none transition-all focus:border-teal focus:bg-white"
          />
        </div>

        <div className="flex gap-[6px] overflow-x-auto no-scrollbar pb-[6px]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`flex-shrink-0 px-3 py-[6px] rounded-full text-[12px] font-semibold transition-colors border
                ${activeCategory === cat 
                  ? 'bg-ink border-ink text-white' 
                  : 'bg-white border-l3 text-mid hover:bg-l1'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-[6px] overflow-x-auto no-scrollbar pb-1">
          {distances.map(dist => (
            <button
              key={dist.label}
              onClick={() => setActiveRadius(dist.value)}
              className={`flex-shrink-0 px-3 py-[6px] rounded-full text-[12px] font-semibold transition-colors border
                ${activeRadius === dist.value 
                  ? 'bg-teal border-teal text-white' 
                  : 'bg-white border-l3 text-faint hover:bg-l1 hover:text-mid'}`}
            >
              {dist.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 md:p-7">
        {(isLoadingLocation || loading) && (
          <div className="flex flex-col items-center justify-center py-10 text-mid gap-3">
            <Loader2 className="animate-spin text-teal" size={24} />
            <p className="text-[13px]">Searching...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px]">
            {error}
          </div>
        )}

        {!loading && !error && displayedHospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px] pb-24 md:pb-0">
            {displayedHospitals.map(h => (
              <HospitalCard key={h._id} hospital={h} matchedCats={activeCategory ? [activeCategory] : []} onPress={goToDetail} />
            ))}
          </div>
        )}

        {!loading && !error && displayedHospitals.length === 0 && location && (
          <div className="flex flex-col items-center justify-center py-16 text-faint">
             <div className="w-[60px] h-[60px] rounded-[18px] bg-white border border-l3 shadow-sm flex items-center justify-center mb-4">
               <Search size={28} className="text-mid" />
             </div>
             <p className="text-[15px] font-semibold text-mid mb-1">No results matching</p>
             <p className="text-[13px] max-w-[200px] text-center">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
