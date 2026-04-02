import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SymptomsPage from './pages/SymptomsPage';
import ResultsPage from './pages/ResultsPage';
import HospitalDetail from './pages/HospitalDetail';
import SavedPage from './pages/SavedPage';
import AdminPage from './pages/AdminPage';
import Sidebar from './components/Sidebar';
import MobileTopBar from './components/MobileTopBar';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { useEffect } from 'react';

const AppShell = ({ children }) => {
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.display = 'block';
    }
    return () => {
      if (root) {
        root.style.display = '';
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-l1">
      <Sidebar />
      <main className="flex-1 md:ml-[230px] min-h-screen pb-[70px] md:pb-0 flex flex-col relative w-full">
        <MobileTopBar />
        <div className="flex-1 w-full overflow-x-hidden">
          {children}
        </div>
        <BottomNav />
      </main>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const { user, loading, fetchMe } = useAuth();

  useEffect(() => {
    if (token && !user && !loading) {
      fetchMe();
    }
  }, [token, user, loading, fetchMe]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading || (token && !user)) return <div className="min-h-screen flex items-center justify-center text-teal font-semibold">Loading KidSure...</div>;
  
  return <AppShell>{children}</AppShell>;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-mid">Loading...</div>;
  
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  if (user && user.role !== 'superadmin' && user.role !== 'hospital_admin') {
    return <Navigate to="/home" replace />;
  }
  
  return <AppShell>{children}</AppShell>;
};

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* If user hits /, redirect to /home if authed, else PrivateRoute sends to /login */}
            <Route path="/" element={
              <PrivateRoute><Navigate to="/home" replace /></PrivateRoute>
            } />
            
            <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
            <Route path="/symptoms" element={<PrivateRoute><SymptomsPage /></PrivateRoute>} />
            <Route path="/symptoms/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
            <Route path="/hospital/:id" element={<PrivateRoute><HospitalDetail /></PrivateRoute>} />
            <Route path="/saved" element={<PrivateRoute><SavedPage /></PrivateRoute>} />
            
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}
