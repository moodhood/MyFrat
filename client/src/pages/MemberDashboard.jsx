// src/pages/MemberDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { toast } from 'react-toastify';

export default function MemberDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        'http://localhost:3000/api/dashboard/member',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to load dashboard.');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error loading dashboard.');
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const markDutyDone = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/duties/${id}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboard(); // Refresh after marking done
      toast.success('Duty marked complete.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark duty done.');
    }
  };

  if (!data) {
    return (
      <Layout>
        <p className="p-4">Loading dashboard...</p>
      </Layout>
    );
  }

  const { totalHours, latestLog, duties, chartData } = data;
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50'];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
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

          {chartData?.length > 0 && (
            <div className="flex justify-center">
              <PieChart width={300} height={220}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={60}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
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
            <p className="text-sm text-gray-500">
              No current assignments.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {duties.map((duty) => (
                <li
                  key={duty.id}
                  className="border-b pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
                  <div>
                    <p className="font-medium">{duty.description}</p>
                    <p className="text-xs text-gray-500">
                      Due:{' '}
                      {new Date(duty.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => markDutyDone(duty.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Mark as Done
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
