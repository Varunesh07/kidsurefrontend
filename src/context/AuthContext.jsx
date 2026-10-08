import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    let token = localStorage.getItem('token');

    // If no access token in localStorage, attempt silent refresh using the HttpOnly cookie
    if (!token) {
      try {
        const refreshRes = await api.post('/api/auth/refresh');
        const newToken = refreshRes.data?.accessToken || refreshRes.data?.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          token = newToken;
        }
      } catch (err) {
        // No active refresh session — user is a guest / not logged in
        setUser(null);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.warn('Auth verification failed:', err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.code === 'ERR_NETWORK') {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Invalidate refresh token in database & clear HttpOnly cookie
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Error during logout request:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/';
    }
  };

  const toggleBookmark = async (hospitalId) => {
    try {
      const res = await api.post(`/api/user/saved/${hospitalId}`);
      setUser((prev) => ({
        ...prev,
        savedHospitals: res.data.savedHospitals,
      }));
      return res.data.saved;
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, loading, fetchMe, toggleBookmark }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
