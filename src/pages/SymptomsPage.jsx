import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function SymptomsPage() {
  const navigate = useNavigate();
  const [groupedSymptoms, setGroupedSymptoms] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchSymptoms = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/symptoms');
        // Backend already returns an object grouped by category
        setGroupedSymptoms(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch symptoms. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSymptoms();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) return;
    navigate(`/symptoms/results?ids=${selectedIds.join(',')}`);
  };

  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen">
      <div className="px-5 md:px-7 pt-[35px] pb-4 mt-[60px] md:mt-0">
        <h1 className="font-serif text-[26px] font-bold text-ink mb-1">What's your child feeling?</h1>
        <p className="text-[14px] text-mid">Select symptoms to match with the right specialist.</p>
      </div>

      <div className="flex-1 px-5 md:px-7 pb-24">
        {loading && (
          <div className="flex justify-center py-10">
             <Loader2 className="animate-spin text-teal" size={24} />
          </div>
        )}
        
        {error && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px] mb-4">
            {error}
          </div>
        )}

        {!loading && !error && Object.keys(groupedSymptoms).map(category => {
          const catName = category.charAt(0).toUpperCase() + category.slice(1);

          return (
            <div key={category} className="mb-5 border border-l3 rounded-[16px] p-5 bg-white shadow-sm">
              <h2 className="text-[15px] font-bold text-ink mb-[12px]">{catName}</h2>
              <div className="flex flex-wrap gap-[10px]">
                {groupedSymptoms[category].map((symp) => {
                  const isSelected = selectedIds.includes(symp._id);
                  return (
                    <button
                      key={symp._id}
                      onClick={() => toggleSelect(symp._id)}
                      className={`px-[14px] py-[6px] rounded-full text-[13px] font-semibold transition-all border
                        ${isSelected 
                          ? 'bg-[#EAF7F4] border-teal text-teal shadow-[0_1px_8px_rgba(29,184,150,0.15)] ring-1 ring-teal' 
                          : 'bg-white border-l3 text-mid hover:border-mid hover:text-ink hover:bg-l1'
                        }`}
                    >
                      {symp.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-[70px] md:bottom-0 left-0 md:left-[230px] right-0 p-4 z-30 pointer-events-none">
           <div className="max-w-[400px] mx-auto pointer-events-auto">
             <button
               onClick={handleContinue}
               className="w-full flex items-center justify-between bg-ink text-white rounded-xl p-[14px] shadow-lg hover:bg-ink2 transition-all"
             >
               <span className="text-[13px] font-bold">Find specialists ({selectedIds.length})</span>
               <ChevronRight size={16} />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
