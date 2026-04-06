import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, AlertCircle, Bookmark, Share2, Star } from 'lucide-react';
import api from '../api/axios';
import { useLocationInfo } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { calculateDistance } from '../utils/distance';
import { getHospitalStatus } from '../utils/getStatus';
import MapView from '../components/MapView';

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location, locationError, isLoadingLocation, fetchLocation } = useLocationInfo();
  const { user, toggleBookmark } = useAuth();
  
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Rating state
  const [myRating, setMyRating] = useState(null);     // stars user already gave
  const [hovered, setHovered] = useState(0);           // star currently hovered
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await api.get(`/api/hospitals/${id}`);
        setHospital(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch hospital details.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  // Fetch user's existing rating for this hospital
  useEffect(() => {
    const fetchMyRating = async () => {
      try {
        const res = await api.get(`/api/ratings/${id}/mine`);
        if (res.data.hasRated) setMyRating(res.data.stars);
      } catch (err) {
        // silently ignore — user just hasn't rated yet
      }
    };
    if (id) fetchMyRating();
  }, [id]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/hospital/${id}`;
    const shareData = {
      title: `${hospital?.name} — KidSure`,
      text: `Find ${hospital?.name} on KidSure — the paediatric hospital finder.`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled — no action needed
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      } catch {
        // Clipboard also failed — last resort
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      }
    }
  };

  const handleRate = async (stars) => {
    if (myRating || ratingLoading) return; // already rated
    setRatingLoading(true);
    setRatingError(null);
    try {
      const res = await api.post(`/api/ratings/${id}`, { stars });
      setMyRating(stars);
      setRatingSuccess(true);
      // update the live avgRating badge without a full reload
      setHospital(prev => ({
        ...prev,
        avgRating: res.data.avgRating,
        ratingCount: res.data.ratingCount,
      }));
    } catch (err) {
      setRatingError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    // If the page was hard-loaded directly from URL, location might be missing
    if (!location && !locationError && !isLoadingLocation) {
      fetchLocation();
    }
  }, [location, locationError, isLoadingLocation, fetchLocation]);

  if (loading) {
    return <div className="flex min-h-screen bg-l1 items-center justify-center font-bold text-teal">Loading hospital...</div>;
  }

  if (error || !hospital) {
    return (
      <div className="flex flex-col min-h-screen bg-l1">
         <div className="p-5">
           <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-ink" /></button>
         </div>
         <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={30} className="text-red-dark mb-3" />
            <p className="font-semibold text-ink">{error || "Hospital not found"}</p>
         </div>
      </div>
    );
  }

  // Calculate distance
  let distStr = '? km';
  if (location && hospital.location?.coordinates) {
    const [lng, lat] = hospital.location.coordinates;
    const computed = calculateDistance(location.lat, location.lng, lat, lng);
    if (computed !== null) distStr = `${computed.toFixed(1)} km`;
  }

  // Operating status
  const statusInfo = getHospitalStatus(hospital.operatingHours, hospital.is24x7);

  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen pb-[80px]">
      {/* Top Banner & Image */}
      <div className="relative w-full h-[240px] md:h-[300px] mt-[60px] md:mt-0 bg-ink">
        {hospital.coverImage ? (
          <img 
            src={hospital.coverImage} 
            alt={hospital.name} 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-teal to-blue opacity-50"></div>
        )}
        
        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition">
              <Share2 size={16} />
            </button>
            <button onClick={() => toggleBookmark(hospital._id)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition">
              <Bookmark size={18} fill={user?.savedHospitals?.includes(hospital._id) ? "white" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-[13px] font-semibold px-5 py-3 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          🔗 Link copied to clipboard!
        </div>
      )}

      {/* Main Info */}
      <div className="px-5 md:px-7 pt-5 pb-6 bg-white border-b border-l3 -mt-6 rounded-t-[24px] relative z-20">
        <div className="flex justify-between items-start mb-2">
          <h1 className="font-serif text-[22px] font-bold text-ink pr-4 leading-tight">
            {hospital.name}
          </h1>
          <span className="flex items-center gap-[2px] text-[13px] font-bold text-teal flex-shrink-0 mt-1 bg-teal/10 px-2 py-1 rounded-md">
            <MapPin size={13} /> {distStr}
          </span>
        </div>
        <p className="text-[13px] text-mid mb-3 leading-snug max-w-[90%]">
          {hospital.address}
        </p>

        <div className="flex flex-wrap items-center gap-[6px] mb-4">
          <span className={`px-2 py-[2px] rounded-sm text-[11px] font-semibold border ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
          {hospital.is24x7 && (
            <span className="px-2 py-[2px] rounded-sm text-[11px] font-semibold text-orange bg-orange/10 border border-orange/20">
              24/7
            </span>
          )}
          {hospital.isEmergency && (
            <span className="px-2 py-[2px] rounded-sm text-[11px] font-semibold text-red-dark bg-red-bg border border-red-bdr">
              Emergency
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-[6px]">
          {hospital.categories?.map(cat => (
            <span key={cat} className="px-3 py-[4px] rounded-full text-[11px] font-bold tracking-wide bg-l1 text-mid border border-l3">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-[60px] md:top-0 z-20 border-b border-l3 px-5 md:px-7 flex gap-6 overflow-x-auto no-scrollbar">
        {['overview', 'reviews', 'location'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`py-3 text-[14px] font-bold capitalize whitespace-nowrap border-b-2 transition-colors ${
               activeTab === tab ? 'border-teal text-teal' : 'border-transparent text-mid hover:text-ink'
             }`}
           >
             {tab}
           </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 md:p-7">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
             
             <div className="bg-white border border-l3 p-4 rounded-2xl flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-3 text-ink">
                 <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center text-blue">
                   <Phone size={18} />
                 </div>
                 <div>
                   <p className="text-[12px] text-mid font-medium">Contact Number</p>
                   <p className="text-[15px] font-bold">{hospital.phone}</p>
                 </div>
               </div>
               <a href={`tel:${hospital.phone}`} className="px-4 py-2 bg-ink text-white text-[13px] font-semibold rounded-xl hover:bg-ink2 transition-colors">
                 Call Now
               </a>
             </div>

             <div>
               <h3 className="font-serif text-[18px] font-bold text-ink mb-3 flex items-center gap-2">
                 <Clock size={18} className="text-teal" /> Operating Hours
               </h3>
               <div className="bg-white border border-l3 rounded-2xl overflow-hidden shadow-sm">
                 {hospital.is24x7 ? (
                   <div className="p-4 text-[14px] font-medium text-ink">Open 24 hours a day, 7 days a week</div>
                 ) : hospital.operatingHours && hospital.operatingHours.length > 0 ? (
                   hospital.operatingHours.map((oh, idx) => (
                     <div key={oh._id || idx} className={`flex justify-between p-4 text-[13px] font-medium ${idx !== hospital.operatingHours.length - 1 ? 'border-b border-l3' : ''}`}>
                       <span className="text-mid w-24">{oh.day}</span>
                       <span className={!oh.isOpen ? 'text-red-dark' : 'text-ink'}>
                         {!oh.isOpen ? 'Closed' : `${oh.openTime} - ${oh.closeTime}`}
                       </span>
                     </div>
                   ))
                 ) : (
                   <div className="p-4 text-[13px] text-mid">Hours not provided.</div>
                 )}
               </div>
             </div>

          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 space-y-5">
            {/* Average Rating Banner */}
            <div className="bg-white border border-l3 rounded-2xl p-5 shadow-sm flex items-center gap-5">
              <div className="flex flex-col items-center">
                <span className="text-[48px] font-bold text-ink leading-none">
                  {hospital.avgRating ? hospital.avgRating.toFixed(1) : '—'}
                </span>
                <div className="flex gap-[3px] mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14}
                      fill={hospital.avgRating >= s ? '#1DB895' : 'none'}
                      stroke={hospital.avgRating >= s ? '#1DB895' : '#cbd5e1'}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-mid mt-1">{hospital.ratingCount || 0} reviews</span>
              </div>
              <div className="w-px h-16 bg-l3" />
              <p className="text-[13px] text-mid leading-relaxed flex-1">
                {hospital.ratingCount > 0
                  ? `Based on ${hospital.ratingCount} parent ${hospital.ratingCount === 1 ? 'review' : 'reviews'}.`
                  : 'No reviews yet. Be the first to rate this clinic!'}
              </p>
            </div>

            {/* Star Widget */}
            <div className="bg-white border border-l3 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[15px] font-bold text-ink mb-1">Rate this clinic</h3>
              <p className="text-[13px] text-mid mb-4">
                {myRating ? `You rated this clinic ${myRating} star${myRating > 1 ? 's' : ''}. Thank you!` : 'Tap a star to leave your rating.'}
              </p>

              <div className="flex gap-3 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    disabled={!!myRating || ratingLoading}
                    onMouseEnter={() => !myRating && setHovered(s)}
                    onMouseLeave={() => !myRating && setHovered(0)}
                    onClick={() => handleRate(s)}
                    className="transition-transform hover:scale-110 disabled:cursor-default"
                  >
                    <Star
                      size={36}
                      fill={(hovered || myRating || 0) >= s ? '#1DB895' : 'none'}
                      stroke={(hovered || myRating || 0) >= s ? '#1DB895' : '#cbd5e1'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              {ratingSuccess && (
                <div className="text-[13px] font-semibold text-teal bg-teal/10 border border-teal/20 rounded-xl px-4 py-3">
                  ✓ Rating submitted successfully!
                </div>
              )}
              {ratingError && (
                <div className="text-[13px] font-semibold text-red-dark bg-red-bg border border-red-bdr rounded-xl px-4 py-3">
                  {ratingError}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
             <h3 className="font-serif text-[18px] font-bold text-ink mb-3">Map & Directions</h3>
             <div className="mb-4 text-[13px] text-mid leading-relaxed bg-white border border-l3 p-4 rounded-xl shadow-sm">
               {hospital.address}
             </div>
             
             {hospital.location?.coordinates ? (
               <MapView 
                 hospitals={[hospital]} 
                 centerLat={hospital.location.coordinates[1]} 
                 centerLng={hospital.location.coordinates[0]} 
                 zoom={15}
                 height="350px"
               />
             ) : (
               <div className="h-[350px] bg-white border border-l3 rounded-[16px] flex flex-col items-center justify-center text-mid shadow-sm">
                 <MapPin size={32} className="text-l3 mb-2" />
                 <p className="text-[14px]">Map coordinates unavailable</p>
               </div>
             )}
          </div>
        )}
      </div>

    </div>
  );
}
