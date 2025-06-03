// src/pages/NewDuty.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function NewDuty() {
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assignedMembers, setAssignedMembers] = useState([]); // [{ userId, name }]
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // default Monday
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  // Fetch all users for the dropdown
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in.');
      navigate('/login');
      return;
    }
    async function fetchUsers() {
      try {
        const res = await fetch('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch members');
        const data = await res.json();
        setAllMembers(data);
      } catch (err) {
        console.error(err);
        toast.error('Could not load members.');
      }
    }
    fetchUsers();
  }, [navigate]);

  // Add selected member to rotation (if not already in list)
  const handleAddMember = () => {
    if (!selectedMemberId) return;
    const user = allMembers.find((u) => u.id === Number(selectedMemberId));
    if (!user) return;

    // Prevent duplicates
    if (assignedMembers.some((m) => m.userId === user.id)) {
      toast.warn(`${user.name} is already in the rotation.`);
      return;
    }

    setAssignedMembers((prev) => [
      ...prev,
      { userId: user.id, name: user.name },
    ]);
    setSelectedMemberId('');
  };

  // Remove a member from the rotation
  const handleRemoveMember = (userId) => {
    setAssignedMembers((prev) =>
      prev.filter((m) => m.userId !== userId)
    );
  };

  // Move a member up or down in the rotation order
  const moveMember = (index, direction) => {
    setAssignedMembers((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const swapWith = copy[index + direction];
      if (!swapWith) return prev;
      copy[index] = swapWith;
      copy[index + direction] = target;
      return copy;
    });
  };

  // Submit form: create the duty
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Duty name is required.');
      return;
    }
    if (assignedMembers.length === 0) {
      toast.error('You must assign at least one member.');
      return;
    }

    const payload = {
      name: name.trim(),
      dayOfWeek: Number(dayOfWeek),
      memberIds: assignedMembers.map((m) => m.userId),
      endDate: endDate || null,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/duties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create duty.');
      }
      toast.success('Duty created successfully.');
      navigate('/duties');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Create New Duty</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duty Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duty Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. Bathroom Downstairs Cleaning"
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="7">Sunday</option>
            </select>
          </div>

          {/* End Date (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Assign Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Member to Rotation
            </label>
            <div className="flex gap-2 items-center mb-2">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- Select Member --</option>
                {allMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddMember}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add
              </button>
            </div>

            {/* Show assigned members with reorder controls */}
            {assignedMembers.length > 0 && (
              <ul className="space-y-2">
                {assignedMembers.map((m, idx) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between border rounded px-3 py-2 bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <span>{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveMember(idx, -1)}
                        disabled={idx === 0}
                        className={`px-2 py-1 border rounded ${
                          idx === 0
                            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMember(idx, +1)}
                        disabled={idx === assignedMembers.length - 1}
                        className={`px-2 py-1 border rounded ${
                          idx === assignedMembers.length - 1
                            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        className="px-2 py-1 text-red-600 hover:bg-red-100 border border-red-200 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Create Duty
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
