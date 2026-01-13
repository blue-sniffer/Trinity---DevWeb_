import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Optionally decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.username || 'admin' });
      } catch (e) {
        setUser({ username: 'User' });
      }
    }
  }, [token]);

  const login = async (username, password) => {
    const response = await apiLogin(username, password);
    const { access, refresh } = response.data;
    localStorage.setItem('token', access);
    localStorage.setItem('refresh', refresh);
    setToken(access);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
