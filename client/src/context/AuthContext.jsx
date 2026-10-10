import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bloodconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('bloodconnect_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bloodconnect_token'));
  const [loading, setLoading] = useState(true);

  // Sync current user profile from server on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('bloodconnect_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            localStorage.setItem('bloodconnect_user', JSON.stringify(res.data.user));
            if (res.data.profile) {
              localStorage.setItem('bloodconnect_profile', JSON.stringify(res.data.profile));
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session invalid or expired.');
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser, profile: newProfile } = res.data;
      setToken(newToken);
      setUser(newUser);
      setProfile(newProfile);
      localStorage.setItem('bloodconnect_token', newToken);
      localStorage.setItem('bloodconnect_user', JSON.stringify(newUser));
      if (newProfile) {
        localStorage.setItem('bloodconnect_profile', JSON.stringify(newProfile));
      }
      return res.data;
    }
  };

  const registerHospital = async (formData) => {
    const res = await api.post('/auth/register/hospital', formData);
    if (res.data.success) {
      const { token: newToken, user: newUser, hospital: newHospital } = res.data;
      setToken(newToken);
      setUser(newUser);
      setProfile(newHospital);
      localStorage.setItem('bloodconnect_token', newToken);
      localStorage.setItem('bloodconnect_user', JSON.stringify(newUser));
      localStorage.setItem('bloodconnect_profile', JSON.stringify(newHospital));
      return res.data;
    }
  };

  const registerDonor = async (formData) => {
    const res = await api.post('/auth/register/donor', formData);
    if (res.data.success) {
      const { token: newToken, user: newUser, donor: newDonor } = res.data;
      setToken(newToken);
      setUser(newUser);
      setProfile(newDonor);
      localStorage.setItem('bloodconnect_token', newToken);
      localStorage.setItem('bloodconnect_user', JSON.stringify(newUser));
      localStorage.setItem('bloodconnect_profile', JSON.stringify(newDonor));
      return res.data;
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('bloodconnect_token');
    localStorage.removeItem('bloodconnect_user');
    localStorage.removeItem('bloodconnect_profile');
  };

  const refreshMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        localStorage.setItem('bloodconnect_user', JSON.stringify(res.data.user));
        if (res.data.profile) {
          localStorage.setItem('bloodconnect_profile', JSON.stringify(res.data.profile));
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        registerHospital,
        registerDonor,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
