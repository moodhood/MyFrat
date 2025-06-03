// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  status: false,
  loading: true,
  login: async (email, password) => {},
  logout: () => {},
  register: async (email, password, name) => {},
  setAuthState: (newState) => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch /api/auth/me to restore full user + permissions
  const fetchCurrentUser = async (jwt) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await res.json();
      // data.roles is an array of { id, name, displayName, permissions }
      // data.permissions is an array of strings
      const restoredUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthday: data.birthday,
        address: data.address,
        profilePicture: data.profilePicture,
        createdAt: data.createdAt,
        roles: data.roles,
        permissions: data.permissions,
      };
      localStorage.setItem('authUser', JSON.stringify(restoredUser));
      setUser(restoredUser);
      setStatus(true);
    } catch (err) {
      console.error('Failed to restore user from token:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('authUser');
      setUser(null);
      setToken(null);
      setStatus(false);
    }
  };

  // On mount: check for token → fetch /me
  useEffect(() => {
    (async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
      }
      setLoading(false);
    })();
  }, []);

  // login(email, password)
  const login = async (email, password) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Login failed');
      err.status = res.status;
      throw err;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);

    // Immediately fetch the full user from /me
    await fetchCurrentUser(data.token);
  };

  // register(email, password, name)
  const register = async (email, password, name) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Registration failed');
      err.status = res.status;
      throw err;
    }
    return data;
  };

  // logout()
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    setUser(null);
    setToken(null);
    setStatus(false);
  };

  // setAuthState(newState) — override user and localStorage manually
  const setAuthState = (newState) => {
    if (!newState) {
      logout();
    } else {
      const patched = {
        ...newState,
        permissions: newState.permissions || [],
      };
      localStorage.setItem('authUser', JSON.stringify(patched));
      setUser(patched);
      setStatus(true);
    }
  };

  // While checking for token → /me
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p className="text-gray-700">Checking authentication…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        status,
        login,
        logout,
        register,
        setAuthState,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
