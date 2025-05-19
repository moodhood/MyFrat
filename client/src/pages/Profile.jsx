import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-2">Welcome, {user.name}</h1>
      <p className="mb-4">Email: {user.email}</p>
      <button onClick={logout} className="p-2 bg-red-500 text-white rounded">
        Logout
      </button>
    </div>
  );
}
