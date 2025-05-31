// src/pages/MotionDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-toastify';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed', '#10b981'];

export default function MotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motion, setMotion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  // Track which action is pending confirmation: 'delete'
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const fetchMotion = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/motions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load motion');
        const data = await res.json();
        setMotion(data);
        if (data.yourVote) setSelectedOption(data.yourVote);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Error loading motion.');
      }
    };
    fetchMotion();
  }, [id]);

  if (!motion) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          Loading...
        </div>
      </Layout>
    );
  }

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('authUser'));
    } catch {
      return null;
    }
  })();

  const isCreator = currentUser?.id === motion?.creatorId;
  const isOfficer = currentUser?.permissions?.includes('manage_votes');
  const totalVotes = Object.values(motion?.totals || {}).reduce(
    (sum, v) => sum + v,
    0
  );

  const vote = async (optionText) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/motions/${id}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ choice: optionText }),
        }
      );
      if (!res.ok) {
        throw new Error('Failed to cast vote.');
      }
      setSelectedOption(optionText);
      const updatedRes = await fetch(
        `http://localhost:3000/api/motions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = await updatedRes.json();
      setMotion(updated);
      toast.success('Vote recorded.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error casting vote.');
    }
  };

  const stopVoting = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/motions/${id}/stop`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to stop voting.');
      const updatedRes = await fetch(
        `http://localhost:3000/api/motions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updated = await updatedRes.json();
      setMotion(updated);
      toast.success('Voting stopped.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error stopping voting.');
    }
  };

  const archiveMotion = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/api/motions/${id}/archive`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to archive motion.');
      toast.success('Motion archived.');
      navigate('/motions');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error archiving motion.');
    }
  };

  const handleDeleteMotion = async () => {
    setConfirmingDelete(false); // close the modal
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/motions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete motion.');
      toast.success('Motion deleted.');
      navigate('/motions');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error deleting motion.');
    }
  };

  const chartData = motion.options.map((option, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const votes = motion.totals?.[option] || 0;
    return {
      name: `${letter}. ${option}`,
      votes,
      percent:
        totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0,
      color: COLORS[idx % COLORS.length],
    };
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white border rounded-xl shadow p-6 space-y-4">
          <h1 className="text-2xl font-bold">{motion.title}</h1>
          {motion.description && (
            <p className="text-gray-600">{motion.description}</p>
          )}

          <div className="text-sm text-gray-500 space-y-1">
            <p>
              Created: {new Date(motion.createdAt).toLocaleString()}
            </p>
            {motion.deadline && (
              <p>
                Deadline: {new Date(motion.deadline).toLocaleString()}
              </p>
            )}
            <p>
              Status:{' '}
              {motion.archived
                ? '📦 Archived'
                : motion.stopped
                ? '🔒 Closed'
                : '🟢 Open'}
            </p>
          </div>

          {(isCreator || motion.stopped || isOfficer) && (
            <div>
              <h2 className="text-lg font-semibold mb-2 mt-6">
                Live Results
              </h2>
              <div className="h-[300px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 20,
                    }}
                    barCategoryGap={5}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} votes (${props.payload.percent}%)`,
                        'Votes',
                      ]}
                    />
                    <Bar dataKey="votes" barSize={70}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                      <LabelList
                        dataKey="percent"
                        position="top"
                        formatter={(val) => `${val}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!isCreator &&
            !motion.stopped &&
            !motion.archived &&
            selectedOption === null && (
              <div className="space-y-3 mt-6">
                <h2 className="text-lg font-semibold">Cast Your Vote</h2>
                {motion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => vote(opt)}
                    className="block w-full text-left bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>
            )}

          {!isCreator &&
            selectedOption &&
            !motion.archived && (
              <div className="mt-4 p-4 bg-green-50 border rounded-lg text-green-700">
                You voted: <strong>{selectedOption}</strong>
              </div>
            )}

          {isCreator && !motion.stopped && (
            <button
              onClick={stopVoting}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
            >
              Stop Voting
            </button>
          )}

          {isCreator && motion.stopped && !motion.archived && (
            <button
              onClick={archiveMotion}
              className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-md"
            >
              Archive Motion
            </button>
          )}

          {(isCreator || isOfficer) && motion.archived && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
            >
              Delete Motion
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for deleting a motion */}
      {confirmingDelete && (
        <ConfirmModal
          title="Delete Motion"
          message="Are you sure you want to delete this motion? This cannot be undone."
          onConfirm={handleDeleteMotion}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Layout>
  );
}
