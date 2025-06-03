// src/pages/MemberDashboard.jsx

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, isAfter } from 'date-fns';

export default function MemberDashboard() {
  const [profileData, setProfileData] = useState(null);
  const [duties, setDuties] = useState([]);
  const navigate = useNavigate();

  // Fetch profile/philanthropy info
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/dashboard/member', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load dashboard.');
      const result = await res.json();
      setProfileData(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error loading dashboard.');
    }
  };

  // Fetch current duty assignments
  const fetchMyDuties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/duties/assignments/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your duties.');
      const result = await res.json();
      setDuties(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error loading duties.');
    }
  };

  // Mark assignment as done
  const markDutyDone = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/duties/assignments/${assignmentId}/done`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark duty done.');
      }
      toast.success('Duty marked complete.');
      fetchMyDuties();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error marking duty done.');
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchMyDuties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profileData) {
    return (
      <Layout>
        <p className="p-4">Loading dashboard...</p>
      </Layout>
    );
  }

  const { name, profilePicture, totalHours, latestLog, chartData } = profileData;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        {/* Greeting */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border bg-gray-100">
            <img
              src={
                profilePicture
                  ? `http://localhost:3000/uploads/${profilePicture}`
                  : '/default-avatar.png'
              }
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
          </div>
          <h1 className="text-2xl font-semibold">Welcome, {name}</h1>
        </div>

        {/* Philanthropy Summary */}
        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-lg font-semibold">Philanthropy Summary</h2>
          <p className="text-sm">
            Total hours logged: <strong>{totalHours}</strong>
          </p>
          {latestLog ? (
            <p className="text-sm text-gray-600">
              Most recent: {latestLog.hours}h @ {latestLog.organization} on{' '}
              {new Date(latestLog.date).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-gray-500">No logs yet.</p>
          )}
          <button
            onClick={() => navigate('/philanthropy/new')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            + Log Hours
          </button>
        </div>

        {/* Assigned Duties */}
        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold">Assigned Duties</h2>
          {!duties || duties.length === 0 ? (
            <p className="text-sm text-gray-500">No current assignments.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {duties.map((duty) => {
                const due = new Date(duty.dueDate);
                const now = new Date();
                const isLate = isAfter(now, due) && !duty.done;

                return (
                  <li
                    key={duty.assignmentId}
                    className="border-b pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                  >
                    <div>
                      <p className="font-medium">{duty.dutyName}</p>
                      <p className="text-xs text-gray-500">
                        Due: {format(due, 'MM/dd/yyyy p')}{' '}
                        {isLate && <span className="text-red-600 font-semibold">(Late)</span>}
                      </p>
                    </div>
                    {!duty.done ? (
                      <button
                        onClick={() => markDutyDone(duty.assignmentId)}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Mark as Done
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">Completed</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Chart (if needed) */}
        {chartData && chartData.length > 0 && (
          <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
            <h2 className="text-lg font-semibold">Hours by Organization</h2>
            {/* Insert chart component here */}
          </div>
        )}
      </div>
    </Layout>
  );
}
