// src/pages/OfficerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

export default function OfficerDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load dashboard.');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Error loading dashboard.');
      }
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <Layout>
        <p className="p-4">Loading dashboard...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-3xl font-bold">Officer Dashboard</h1>
          <div className="mt-4 sm:mt-0 text-gray-700 space-y-1 text-sm sm:text-base">
            <p>
              👥 <strong>{data.totalMembers}</strong> Total Members
            </p>
            <p>
              🕒 <strong>{data.totalHours}</strong> Total Hours Logged
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Recently Completed Duties */}
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">
              ✅ Recently Completed Duties
            </h2>
            <div className="max-h-80 overflow-y-auto pr-2">
              {data.completedDuties?.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No duties completed yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.completedDuties.map((duty) => (
                    <Link
                      key={duty.id}
                      to={`/members/${duty.user.id}`}
                      className="block hover:bg-gray-100 transition rounded px-1 py-1"
                    >
                      <p className="font-medium text-gray-800">
                        {duty.user.name}
                      </p>
                      <p className="text-gray-700">{duty.description}</p>
                      <p className="text-gray-400 text-xs italic">
                        {duty.completedAt
                          ? `Completed ${formatDistanceToNow(
                              new Date(duty.completedAt),
                              { addSuffix: true }
                            )}`
                          : 'Completion time unknown'}
                      </p>
                    </Link>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Philanthropy Logs */}
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">
              🤝 Recent Philanthropy Logs
            </h2>
            <div className="max-h-80 overflow-y-auto pr-2">
              {data.logs?.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No logs submitted yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.logs.map((log) => (
                    <Link
                      key={log.id}
                      to={`/members/${log.user.id}`}
                      className="block hover:bg-gray-100 transition rounded px-1 py-1"
                    >
                      <p className="font-medium text-gray-800">
                        {log.user.name}
                      </p>
                      <p className="text-gray-700">{log.organization}</p>
                      <p className="text-gray-500 text-xs">
                        {log.hours} hour(s) on{' '}
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-xs italic">
                        Uploaded{' '}
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">⚡ Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/events/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
            >
              + Create Event
            </button>
            <button
              onClick={() => navigate('/duties/new')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
            >
              + Assign Duty
            </button>
            <button
              onClick={() => navigate('/philanthropy/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition"
            >
              + Log Hours
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
