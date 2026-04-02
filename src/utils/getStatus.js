export const getHospitalStatus = (hospital) => {
  if (!hospital) return 'closed';
  if (hospital.is24x7) return 'open';
  
  if (!hospital.operatingHours || !Array.isArray(hospital.operatingHours)) {
    return 'closed';
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const today = hospital.operatingHours.find(d => d.day === todayName);
  
  if (!today || !today.isOpen) return 'closed';
  
  try {
    const [openH, openM] = today.openTime.split(':').map(Number);
    const [closeH, closeM] = today.closeTime.split(':').map(Number);
    
    if (isNaN(openH) || isNaN(closeH)) return 'open'; // fallback if formatting wrong
    
    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;
    
    return currentMinutes >= openMins && currentMinutes <= closeMins ? 'open' : 'closed';
  } catch (e) {
    return 'open';
  }
};
