import React, { createContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, fetchProfile } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchProfile(token)
        .then(data => setUser(data))
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    const { token: newToken } = await loginApi({ email, password });
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const register = async (email, password, name) => {
    await registerApi({ email, password, name });
    return login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
