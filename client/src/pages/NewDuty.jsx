// src/pages/Motions.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function Motions() {
  const [activeMotions, setActiveMotions] = useState([]);
  const [archivedMotions, setArchivedMotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [activeRes, archivedRes] = await Promise.all([
          fetch('http://localhost:3000/api/motions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/api/motions?archived=true', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!activeRes.ok || !archivedRes.ok) {
          throw new Error('Failed to fetch motions');
        }

        const activeData = await activeRes.json();
        const archivedData = await archivedRes.json();

        setActiveMotions(Array.isArray(activeData) ? activeData : []);
        setArchivedMotions(
          Array.isArray(archivedData) ? archivedData : []
        );
      } catch (err) {
        console.error('❌ Error fetching motions:', err);
        toast.error(err.message || 'Error loading motions.');
        setActiveMotions([]);
        setArchivedMotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Voting Motions</h1>
          <button
            onClick={() => navigate('/motions/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            + New Motion
          </button>
        </div>

        {/* Active Motions */}
        <div>
          <h2 className="text-xl font-semibold mb-2">🟢 Active & Open</h2>
          {loading ? (
            <p className="text-gray-500">Loading motions...</p>
          ) : activeMotions.length === 0 ? (
            <p className="text-gray-500">
              No active motions available.
            </p>
          ) : (
            <ul className="space-y-4">
              {activeMotions.map((m) => (
                <li
                  key={m.id}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-sm text-gray-600">
                        {m.stopped ? '🔒 Closed' : '🟢 Open'} —{' '}
                        {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/motions/${m.id}`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Archived Motions */}
        <div>
          <h2 className="text-xl font-semibold mb-2">
            📦 Archived Results
          </h2>
          {loading ? (
            <p className="text-gray-500">
              Loading archived motions...
            </p>
          ) : archivedMotions.length === 0 ? (
            <p className="text-gray-500">
              No motions have been archived yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {archivedMotions.map((m) => (
                <li
                  key={m.id}
                  onClick={() => navigate(`/motions/${m.id}`)}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-sm text-gray-600">
                        Archived:{' '}
                        {new Date(
                          m.updatedAt || m.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-gray-400 text-sm">View →</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
