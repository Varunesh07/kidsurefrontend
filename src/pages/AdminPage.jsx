import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Crosshair, ClipboardList, CheckCircle, XCircle, Users, MapPin, Phone, Clock, X, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import LocationPicker from '../components/LocationPicker';
import MapView from '../components/MapView';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (!user || (user.role !== 'superadmin' && user.role !== 'hospital_admin')) {
    return <div className="p-10 text-center font-bold text-red-dark">Access Denied</div>;
  }

  // Common Layout Wrap
  return (
    <div className="flex flex-col h-full bg-l1 min-h-screen">
      <div className="bg-ink py-[20px] px-5 md:px-7 sticky top-0 md:top-0 z-20 shadow-md mt-[60px] md:mt-0 flex items-center gap-3">
        <ShieldCheck className="text-teal" size={26} />
        <div>
          <h1 className="font-serif text-[20px] font-bold text-white leading-tight">Admin Dashboard</h1>
          <p className="text-[12px] text-l3">Logged in as {user.role}</p>
        </div>
      </div>
      
      <div className="flex-1 p-5 md:p-7">
         {user.role === 'superadmin' ? <SuperAdminView /> : <HospitalAdminView />}
      </div>
    </div>
  );
}

// ----- SuperAdmin Component -----
function SuperAdminView() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/admin/pending');
      setPending(res.data.hospitals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/admin/approve/${id}`);
      fetchPending();
    } catch(err) {
      alert("Failed to approve");
    }
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectError('');
  };

  const closeRejectModal = () => {
    setRejectingId(null);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection.');
      return;
    }
    setRejectLoading(true);
    try {
      await api.put(`/api/admin/reject/${rejectingId}`, { reason: rejectReason.trim() });
      closeRejectModal();
      fetchPending();
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-[18px] font-bold text-ink flex items-center gap-2"><ClipboardList size={20} className="text-teal"/> Pending Approvals</h2>
      
      {loading ? (
        <p className="text-mid">Loading...</p>
      ) : pending.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-l3 text-center text-mid border-dashed">
          All caught up! No hospitals pending review.
        </div>
      ) : (
        <div className="space-y-6">
          {pending.map(h => (
            <div key={h._id} className="bg-white border border-l3 rounded-2xl shadow-sm overflow-hidden">
              
              {/* Cover Image */}
              {h.coverImage && (
                <div className="w-full h-[180px] bg-ink overflow-hidden">
                  <img src={h.coverImage} alt={h.name} className="w-full h-full object-cover opacity-90" />
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-[18px] text-ink">{h.name}</h3>
                    <p className="text-[13px] text-mid mt-0.5 flex items-center gap-1">
                      <MapPin size={12} /> {h.address}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-orange/10 text-orange border border-orange/20 px-2 py-1 rounded-md uppercase tracking-wide flex-shrink-0">Pending</span>
                </div>

                {/* Submitted By */}
                {h.submittedBy && (
                  <div className="bg-l1 border border-l3 rounded-xl px-4 py-3 text-[13px]">
                    <span className="text-mid">Submitted by </span>
                    <span className="font-bold text-ink">{h.submittedBy.name}</span>
                    <span className="text-mid"> · {h.submittedBy.email}</span>
                  </div>
                )}

                {/* Phone + Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  {h.phone && (
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      <Phone size={14} className="text-teal" /> {h.phone}
                    </div>
                  )}
                  {h.is24x7 && <span className="px-2 py-0.5 text-[11px] font-bold bg-orange/10 text-orange border border-orange/20 rounded-full">24/7</span>}
                  {h.isEmergency && <span className="px-2 py-0.5 text-[11px] font-bold bg-red-bg text-red-dark border border-red-bdr rounded-full">Emergency</span>}
                </div>

                {/* Categories */}
                {h.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {h.categories.map(cat => (
                      <span key={cat} className="px-3 py-1 text-[12px] font-bold bg-teal/10 text-teal border border-teal/20 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}

                {/* Operating Hours */}
                {!h.is24x7 && h.operatingHours?.length > 0 && (
                  <div>
                    <p className="text-[12px] font-bold text-ink flex items-center gap-1 mb-2"><Clock size={13} className="text-teal"/> Operating Hours</p>
                    <div className="border border-l3 rounded-xl overflow-hidden divide-y divide-l3 text-[12px]">
                      {h.operatingHours.map((oh, idx) => (
                        <div key={idx} className="flex justify-between px-4 py-2">
                          <span className="text-mid w-20">{oh.day?.slice(0,3)}</span>
                          <span className={oh.isOpen ? 'text-ink font-semibold' : 'text-red-dark'}>
                            {oh.isOpen ? `${oh.openTime} – ${oh.closeTime}` : 'Closed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map */}
                {h.location?.coordinates && (
                  <div>
                    <p className="text-[12px] font-bold text-ink flex items-center gap-1 mb-2"><MapPin size={13} className="text-teal"/> Location</p>
                    <MapView
                      hospitals={[h]}
                      centerLat={h.location.coordinates[1]}
                      centerLng={h.location.coordinates[0]}
                      zoom={14}
                      height="220px"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(h._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#EAF7F4] hover:bg-teal text-teal hover:text-white py-3 rounded-xl text-[13px] font-bold transition-colors border border-teal"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => openRejectModal(h._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-bg hover:bg-red-dark text-red-dark hover:text-white py-3 rounded-xl text-[13px] font-bold transition-colors border border-red-bdr"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={closeRejectModal} />
          
          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 mb-4 md:mb-0 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-bg border border-red-bdr flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-dark" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-ink">Reject Hospital</h3>
                <p className="text-[12px] text-mid">The hospital admin will be notified with your reason.</p>
              </div>
              <button onClick={closeRejectModal} className="ml-auto p-2 rounded-full hover:bg-l1 text-mid transition-colors">
                <X size={18} />
              </button>
            </div>

            <label className="text-[13px] font-bold text-ink block mb-2">Reason for Rejection</label>
            <textarea
              className="w-full border border-l3 rounded-xl p-4 text-[14px] text-ink outline-none focus:border-red-dark min-h-[120px] resize-none transition-colors bg-l1"
              placeholder="e.g. The clinic address is incomplete. Please provide a valid street address and PIN code."
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectError(''); }}
            />

            {rejectError && (
              <p className="text-[12px] text-red-dark font-semibold mt-2">{rejectError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={closeRejectModal}
                className="flex-1 py-3 rounded-xl border border-l3 text-mid text-[13px] font-bold hover:bg-l1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectLoading}
                className="flex-1 py-3 rounded-xl bg-red-dark text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----- HospitalAdmin Component -----
const AVAILABLE_CATEGORIES = ['Paediatric', 'General', 'Emergency', 'Surgery', 'ENT', 'Dermatology', 'Orthopaedic', 'Neurology'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function HospitalAdminView() {
  const { user, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', is24x7: false, isEmergency: false
  });
  const [categories, setCategories] = useState([]);
  const [operatingHours, setOperatingHours] = useState(
    WEEKDAYS.map(day => ({ day, openTime: '09:00', closeTime: '20:00', isOpen: true }))
  );
  const [location, setLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(!!user.managedHospital);
  
  const [hospitalStatus, setHospitalStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  useEffect(() => {
    // If user already owns a hospital, fetch its data for EDIT mode
    if (user.managedHospital) {
      const fetchExisting = async () => {
        try {
          const res = await api.get(`/api/hospitals/${user.managedHospital}`);
          const h = res.data;
          
          setHospitalStatus(h.status);
          if (h.rejectionReason) setRejectionReason(h.rejectionReason);

          setFormData({
            name: h.name, address: h.address, phone: h.phone, 
            is24x7: h.is24x7, isEmergency: h.isEmergency
          });
          setCategories(h.categories || []);
          if (h.operatingHours && h.operatingHours.length > 0) {
            setOperatingHours(h.operatingHours);
          }
          if (h.location?.coordinates) {
            setLocation({ lng: h.location.coordinates[0], lat: h.location.coordinates[1] });
          }
        } catch (err) {
          console.error("Failed to load existing hospital");
        } finally {
          setLoadingExisting(false);
        }
      };
      fetchExisting();
    }
  }, [user.managedHospital]);

  const toggleCategory = (cat) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return alert("Please pin the location on the map!");
    
    setUploading(true);
    try {
      let finalImageUrl = "";
      
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('coverImage', imageFile);
        const uploadRes = await api.post('/api/hospitals/upload-image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' } // axios often auto-sets this but explicitly stating is fine
        });
        finalImageUrl = uploadRes.data.url;
        // Re-attach existing coverImage conditionally? The backend handles it.
      }

      const payload = {
        ...formData,
        categories: categories,
        ...(finalImageUrl && { coverImage: finalImageUrl }),
        operatingHours: operatingHours, 
        coordinates: [location.lng, location.lat]
      };

      if (user.managedHospital) {
        // Edit mode
        await api.put(`/api/hospitals/${user.managedHospital}/edit`, payload);
        alert("Hospital profile successfully updated!");
        navigate('/home');
      } else {
        // Submit mode
        await api.post('/api/hospitals/submit', payload);
        alert("Successfully submitted for review!");
        await fetchMe(); // Refresh context so App knows they now manage a hospital
        // Set local state status so UI visibly updates since we are not navigating
        setHospitalStatus('pending');
        navigate('/home');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error submitting hospital");
    } finally {
      setUploading(false);
    }
  };

  if (loadingExisting) return <div className="text-center p-10 font-bold text-teal">Loading your clinic profile...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-l3 rounded-[20px] p-6 shadow-sm mb-6">
        <h2 className="text-[18px] font-bold text-ink mb-1">{user.managedHospital ? 'Edit Clinic Profile' : 'New Clinic Profile'}</h2>
        <p className="text-[13px] text-mid mb-6">Update your clinic details so parents can find you.</p>

        {hospitalStatus === 'rejected' && (
          <div className="bg-red-bg border border-red-bdr p-4 rounded-xl text-red-dark text-[13px] mb-6 flex gap-3">
             <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
             <div>
               <strong className="block mb-0.5">Your profile was rejected.</strong>
               <span>{rejectionReason}</span>
             </div>
          </div>
        )}

        {hospitalStatus === 'pending' && (
          <div className="bg-orange/10 border border-orange/20 p-4 rounded-xl text-orange text-[13px] mb-6 flex items-center gap-3">
             <ClipboardList size={18} className="flex-shrink-0" />
             <div>
               <strong>Pending Review:</strong> Your listing is currently under review by our admin team before it goes public.
             </div>
          </div>
        )}

        {hospitalStatus === 'approved' && (
          <div className="bg-green-bg border border-green-bdr p-4 rounded-xl text-green-dark text-[13px] mb-6 flex items-center gap-3">
             <CheckCircle size={18} className="flex-shrink-0" />
             <div>
               <strong>Approved!</strong> Your clinic is actively live and visible to all parents. Modifying the form will put it back into pending status.
             </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-[13px] font-bold text-ink block mb-1">Clinic Name</label>
            <input type="text" className="w-full border border-l3 rounded-xl p-3 text-[14px]" placeholder="e.g. Apollo Kids Clinic" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div>
            <label className="text-[13px] font-bold text-ink block mb-1">Contact Phone</label>
            <input type="text" className="w-full border border-l3 rounded-xl p-3 text-[14px]" placeholder="+91 ..." 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div>
            <label className="text-[13px] font-bold text-ink block mb-1">Full Address</label>
            <textarea className="w-full border border-l3 rounded-xl p-3 text-[14px] min-h-[80px]" placeholder="Street address..."
              value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
          </div>

          <div>
            <label className="text-[13px] font-bold text-ink block mb-2">Select Categories / Departments</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full border text-[13px] font-semibold transition-colors ${
                    categories.includes(cat) 
                      ? 'bg-teal/10 border-teal text-teal' 
                      : 'bg-white border-l3 text-mid hover:border-mid hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-bold text-ink block mb-1">Upload Cover Photo</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              className="w-full border border-l3 rounded-xl p-2 text-[13px] text-mid file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-bold file:bg-teal/10 file:text-teal hover:file:bg-teal/20"
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-ink block mb-2">Facility Offerings</label>
            <div className="flex gap-4 p-4 border border-l3 rounded-xl bg-l1">
              <label className="flex items-center gap-2 text-[13px] font-bold text-ink cursor-pointer">
                <input type="checkbox" checked={formData.is24x7} onChange={e => setFormData({...formData, is24x7: e.target.checked})} className="w-4 h-4 text-teal accent-teal" />
                Open 24/7
              </label>
              <label className="flex items-center gap-2 text-[13px] font-bold text-ink cursor-pointer">
                <input type="checkbox" checked={formData.isEmergency} onChange={e => setFormData({...formData, isEmergency: e.target.checked})} className="w-4 h-4 text-teal accent-teal" />
                Emergency Services
              </label>
            </div>
          </div>

          {!formData.is24x7 && (
            <div>
              <label className="text-[13px] font-bold text-ink block mb-2">Operating Hours</label>
              <div className="border border-l3 rounded-xl overflow-hidden divide-y divide-l3">
                {operatingHours.map((oh, idx) => (
                  <div key={oh.day} className="flex items-center px-4 py-3 bg-white gap-3">
                    <label className="w-24 text-[13px] font-bold flex items-center gap-2">
                       <input type="checkbox" className="accent-teal" checked={oh.isOpen} onChange={e => {
                         const n = [...operatingHours];
                         n[idx].isOpen = e.target.checked;
                         setOperatingHours(n);
                       }}/>
                       {oh.day.slice(0,3)}
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <input type="time" disabled={!oh.isOpen} value={oh.openTime} className="w-[100px] border border-l3 rounded-md px-2 py-1 text-[12px] disabled:opacity-50" onChange={e => {
                        const n = [...operatingHours]; n[idx].openTime = e.target.value; setOperatingHours(n);
                      }} />
                      <span className="text-mid text-[12px]">to</span>
                      <input type="time" disabled={!oh.isOpen} value={oh.closeTime} className="w-[100px] border border-l3 rounded-md px-2 py-1 text-[12px] disabled:opacity-50" onChange={e => {
                        const n = [...operatingHours]; n[idx].closeTime = e.target.value; setOperatingHours(n);
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[13px] font-bold text-ink block mb-2 flex items-center gap-1 max-w-full overflow-hidden">
               <Crosshair size={14} className="text-teal" /> Pin Location
            </label>
            {/* Added key so it safely re-mounts when location is asynchronously fetched */}
            <LocationPicker key={location ? 'hasLoc' : 'noLoc'} defaultPosition={location} onChange={setLocation} />
          </div>

          <button type="submit" disabled={uploading} className="w-full bg-teal text-white font-bold text-[15px] py-4 rounded-xl hover:bg-teal-dark transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
            {uploading ? 'Submitting...' : (user.managedHospital ? 'Update Profile' : 'Submit for Review')}
          </button>
        </form>
      </div>
    </div>
  )
}
