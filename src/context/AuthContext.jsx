import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await api.get('/api/auth/me');
        setUser(res.data);
      }
    } catch (err) {
      console.error('Auth verification failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const toggleBookmark = async (hospitalId) => {
    try {
      const res = await api.post(`/api/user/saved/${hospitalId}`);
      setUser(prev => ({
        ...prev,
        savedHospitals: res.data.savedHospitals
      }));
      return res.data.saved;
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, fetchMe, toggleBookmark }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
