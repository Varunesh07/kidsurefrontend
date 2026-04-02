import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Bookmark } from 'lucide-react';
import api from '../api/axios';
import HospitalCard from '../components/HospitalCard';
import { useNavigate } from 'react-router-dom';

export default function SavedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We rely on the context's savedHospitals array changing to refetch 
  // or we can just fetch once and filter locally?
  // Let's fetch the populated list from the server whenever the page mounts.
  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/user/saved');
        setHospitals(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch your saved hospitals.');
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [user?.savedHospitals?.length]); // Refetch if length changes

  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen">
      <div className="bg-white border-b border-l3 py-[20px] px-5 md:px-7 sticky top-0 md:top-0 z-20 shadow-sm mt-[60px] md:mt-0">
        <h1 className="font-serif text-[22px] font-bold text-ink mb-1">Saved Hospitals</h1>
        <p className="text-[13px] text-mid">Quickly access bookmarks for your child's care.</p>
      </div>

      <div className="flex-1 p-5 md:p-7">
        {loading && (
          <div className="flex justify-center py-10">
             <Loader2 className="animate-spin text-teal" size={24} />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px]">
            {error}
          </div>
        )}

        {!loading && !error && hospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px] pb-24 md:pb-0">
            {hospitals.map(h => (
              <HospitalCard key={h._id} hospital={h} onPress={() => navigate(`/hospital/${h._id}`)} />
            ))}
          </div>
        )}

        {!loading && !error && hospitals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-[60px] h-[60px] rounded-[18px] bg-white border border-l3 shadow-sm flex items-center justify-center mb-4">
               <Bookmark size={28} className="text-mid" />
             </div>
             <p className="text-[15px] font-semibold text-ink mb-1">No saved hospitals yet</p>
             <p className="text-[13px] text-mid max-w-[200px]">Tap the bookmark icon on any hospital to save it here for later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
