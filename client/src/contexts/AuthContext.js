import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true); // 🆕 wait for restore

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');

    if (!token || !stored) {
      setLoading(false);
      return;
    }

    fetch('http://localhost:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setUser({
          ...data,
          permissions: data.role?.permissions || []
        });
        setStatus(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setStatus(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser({
        ...data.user,
        permissions: data.user.permissions || []
      });
      setStatus(true);
    } else {
      throw new Error(data.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setStatus(false);
  };

  const setAuthState = (newState) => {
    if (!newState) {
      logout();
    } else {
      localStorage.setItem('user', JSON.stringify(newState));
      setUser({
        ...newState,
        permissions: newState.permissions || []
      });
      setStatus(true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout, setAuthState, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
