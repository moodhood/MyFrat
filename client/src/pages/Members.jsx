// src/pages/Members.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function Members() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch users');
        }
        if (!Array.isArray(data)) {
          throw new Error('Invalid user data');
        }
        setUsers(data);
      } catch (err) {
        console.error('❌ Failed to load users:', err);
        setError(err.message);
        toast.error(err.message || 'Error loading members.');
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Fraternity Members</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="border px-3 py-2 rounded-md w-full sm:w-64"
          />
        </div>

        {error && <p className="text-red-600 text-sm">⚠️ {error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white border rounded-xl shadow-sm p-4 flex gap-4 items-center"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100 flex-shrink-0">
                <img
                  src={
                    u.profilePicture
                      ? `http://localhost:3000/uploads/${u.profilePicture}`
                      : '/default-avatar.png'
                  }
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold">{u.name}</h2>
                <p className="text-sm text-gray-600">{u.email}</p>
                <p className="text-sm text-gray-500">{u.role?.name || 'Member'}</p>
                <button
                  onClick={() => navigate(`/members/${u.id}`)}
                  className="mt-2 text-sm text-blue-600 font-medium hover:underline"
                >
                  View Profile →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
