// src/pages/Duties.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';

export default function Duties() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allMembers, setAllMembers] = useState([]);

  // For filtering members in create/edit forms
  const [createMemberSearch, setCreateMemberSearch] = useState('');
  const [editMemberSearch, setEditMemberSearch] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDayOfWeek, setNewDayOfWeek] = useState('1');
  const [newEndDate, setNewEndDate] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [assignedMembers, setAssignedMembers] = useState([]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDuty, setEditDuty] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDayOfWeek, setEditDayOfWeek] = useState('1');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editMembers, setEditMembers] = useState([]);

  // Delete confirmation
  const [confirmDeleteDuty, setConfirmDeleteDuty] = useState(null);

  // Refs to close suggestion list when clicking outside
  const createSuggestionRef = useRef(null);
  const editSuggestionRef = useRef(null);

  useEffect(() => {
    if (!user.permissions.includes('assign_duties')) {
      navigate('/dashboard/member');
      return;
    }
    fetchMembers();
    fetchDuties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
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
  };

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/duties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load duties.');
      }
      const data = await res.json();
      data.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.name.localeCompare(b.name));
      setDuties(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
      setLoading(false);
    }
  };

  // ---------- Create Modal Handlers ----------

  const openCreateModal = () => {
    setNewName('');
    setNewDayOfWeek('1');
    setNewEndDate('');
    setNewEndTime('');
    setAssignedMembers([]);
    setCreateMemberSearch('');
    setShowCreateModal(true);
  };

  const handleAddNewMember = (member) => {
    if (assignedMembers.some((m) => m.userId === member.id)) {
      toast.warn(`${member.name} is already in rotation.`);
      return;
    }
    setAssignedMembers((prev) => [...prev, { userId: member.id, name: member.name }]);
    setCreateMemberSearch('');
  };

  const handleRemoveNewMember = (userId) => {
    setAssignedMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const moveNewMember = (index, direction) => {
    setAssignedMembers((prev) => {
      const arr = [...prev];
      const target = arr[index];
      const swapWith = arr[index + direction];
      if (!swapWith) return arr;
      arr[index] = swapWith;
      arr[index + direction] = target;
      return arr;
    });
  };

  const submitNewDuty = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Duty name required.');
      return;
    }
    if (assignedMembers.length === 0) {
      toast.error('Assign at least one member.');
      return;
    }
    let endDateTimeISO = null;
    if (newEndDate) {
      const dt = new Date(newEndDate);
      if (newEndTime) {
        const [hours, minutes] = newEndTime.split(':').map(Number);
        dt.setHours(hours, minutes, 0, 0);
      } else {
        dt.setHours(0, 0, 0, 0);
      }
      endDateTimeISO = dt.toISOString();
    }

    const payload = {
      name: newName.trim(),
      dayOfWeek: Number(newDayOfWeek),
      memberIds: assignedMembers.map((m) => m.userId),
      endDate: endDateTimeISO,
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
      toast.success('Duty created.');
      setShowCreateModal(false);
      fetchDuties();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ---------- Edit Modal Handlers ----------

  const openEditModal = (duty) => {
    setEditDuty(duty);
    setEditName(duty.name);
    setEditDayOfWeek(String(duty.dayOfWeek));
    if (duty.endDate) {
      const dt = new Date(duty.endDate);
      setEditEndDate(format(dt, 'yyyy-MM-dd'));
      const hours = dt.getHours().toString().padStart(2, '0');
      const minutes = dt.getMinutes().toString().padStart(2, '0');
      if (hours === '00' && minutes === '00') {
        setEditEndTime('');
      } else {
        setEditEndTime(`${hours}:${minutes}`);
      }
    } else {
      setEditEndDate('');
      setEditEndTime('');
    }
    const sorted = [...duty.members].sort((a, b) => a.order - b.order);
    const mapped = sorted.map((m) => ({ userId: m.userId, name: m.name }));
    setEditMembers(mapped);
    setEditMemberSearch('');
    setShowEditModal(true);
  };

  const closeEditModal = () => setShowEditModal(false);

  const handleAddEditMember = (member) => {
    if (editMembers.some((m) => m.userId === member.id)) {
      toast.warn(`${member.name} is already in rotation.`);
      return;
    }
    setEditMembers((prev) => [...prev, { userId: member.id, name: member.name }]);
    setEditMemberSearch('');
  };

  const handleRemoveEditMember = (userId) => {
    setEditMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const moveEditMember = (index, direction) => {
    setEditMembers((prev) => {
      const arr = [...prev];
      const target = arr[index];
      const swapWith = arr[index + direction];
      if (!swapWith) return arr;
      arr[index] = swapWith;
      arr[index + direction] = target;
      return arr;
    });
  };

  const submitEditDuty = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Duty name required.');
      return;
    }
    if (editMembers.length === 0) {
      toast.error('Assign at least one member.');
      return;
    }

    let endDateTimeISO = null;
    if (editEndDate) {
      const dt = new Date(editEndDate);
      if (editEndTime) {
        const [hours, minutes] = editEndTime.split(':').map(Number);
        dt.setHours(hours, minutes, 0, 0);
      } else {
        dt.setHours(0, 0, 0, 0);
      }
      endDateTimeISO = dt.toISOString();
    }

    const payload = {
      name: editName.trim(),
      dayOfWeek: Number(editDayOfWeek),
      memberIds: editMembers.map((m) => m.userId),
      endDate: endDateTimeISO,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/duties/${editDuty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update duty.');
      }
      toast.success('Duty updated.');
      setShowEditModal(false);
      fetchDuties();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ---------- Delete Handlers ----------

  const confirmDelete = (duty) => setConfirmDeleteDuty(duty);
  const cancelDelete = () => setConfirmDeleteDuty(null);

  const handleDelete = async () => {
    if (!confirmDeleteDuty) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/duties/${confirmDeleteDuty.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete duty.');
      }
      toast.success('Duty deleted.');
      setConfirmDeleteDuty(null);
      if (editDuty && editDuty.id === confirmDeleteDuty.id) {
        setShowEditModal(false);
      }
      fetchDuties();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // ---------- Suggestion List Logic ----------

  // Filter out already assigned
  const filteredCreateMembers = allMembers
    .filter(
      (u) =>
        (u.name.toLowerCase().includes(createMemberSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(createMemberSearch.toLowerCase())) &&
        !assignedMembers.some((m) => m.userId === u.id)
    )
    .slice(0, 5);

  const filteredEditMembers = allMembers
    .filter(
      (u) =>
        (u.name.toLowerCase().includes(editMemberSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(editMemberSearch.toLowerCase())) &&
        !editMembers.some((m) => m.userId === u.id)
    )
    .slice(0, 5);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        createSuggestionRef.current &&
        !createSuggestionRef.current.contains(e.target)
      ) {
        setCreateMemberSearch('');
      }
      if (
        editSuggestionRef.current &&
        !editSuggestionRef.current.contains(e.target)
      ) {
        setEditMemberSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- Rendering ----------

  if (loading) {
    return (
      <Layout>
        <p className="p-4">Loading duties...</p>
      </Layout>
    );
  }

  // Group duties by dayOfWeek
  const dutiesByDay = duties.reduce((acc, duty) => {
    if (!acc[duty.dayOfWeek]) acc[duty.dayOfWeek] = [];
    acc[duty.dayOfWeek].push(duty);
    return acc;
  }, {});
  const daysWithDuties = Object.keys(dutiesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
        <h1 className="text-3xl font-bold">Duty Assignments</h1>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
        >
          + Create New Duty
        </button>

        {daysWithDuties.length === 0 && (
          <p className="text-gray-500 text-sm">No duties scheduled.</p>
        )}

        {daysWithDuties.map((dow) => {
          const dayDuties = dutiesByDay[dow];
          return (
            <div key={dow} className="space-y-6">
              <h2 className="text-2xl font-semibold">
                {{
                  1: 'Monday',
                  2: 'Tuesday',
                  3: 'Wednesday',
                  4: 'Thursday',
                  5: 'Friday',
                  6: 'Saturday',
                  7: 'Sunday',
                }[dow]}
              </h2>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {dayDuties.map((duty) => {
                  const now = new Date();
                  const assignment = duty.thisWeekAssignment;
                  let assigneeName = '—';
                  let dueDateText = 'No upcoming assignment';
                  let isLate = false;
                  if (assignment) {
                    assigneeName = assignment.name;
                    const due = new Date(assignment.dueDate);
                    dueDateText = format(due, 'MMM d, yyyy p');
                    if (now > due && !assignment.done) {
                      isLate = true;
                    }
                  }

                  return (
                    <div
                      key={duty.id}
                      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => openEditModal(duty)}
                    >
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">{duty.name}</h3>
                        {isLate && <span className="text-red-600 font-semibold">Late</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">This Week:</span> {assigneeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Due:</span> {dueDateText}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {duty.members.length} member
                        {duty.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Create New Duty Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-4">Create New Duty</h3>
              <form onSubmit={submitNewDuty} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duty Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Kitchen Cleaning"
                    required
                  />
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={newDayOfWeek}
                    onChange={(e) => setNewDayOfWeek(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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

                {/* End Date + Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="mt-1 block w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="mt-1 block w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Search + Assign Members */}
                <div ref={createSuggestionRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add Member to Rotation
                  </label>
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={createMemberSearch}
                    onChange={(e) => setCreateMemberSearch(e.target.value)}
                    className="mb-2 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {createMemberSearch && filteredCreateMembers.length > 0 && (
                    <ul className="border border-gray-200 rounded bg-white max-h-40 overflow-y-auto">
                      {filteredCreateMembers.map((u) => (
                        <li
                          key={u.id}
                          onClick={() => handleAddNewMember(u)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                        >
                          {u.name} ({u.email})
                        </li>
                      ))}
                    </ul>
                  )}
                  {assignedMembers.length > 0 && (
                    <ul className="space-y-2 max-h-48 overflow-y-auto mt-2">
                      {assignedMembers.map((m, idx) => (
                        <li
                          key={m.userId}
                          className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-gray-50"
                        >
                          <span className="text-gray-800">{m.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveNewMember(idx, -1)}
                              disabled={idx === 0}
                              className={`px-2 py-1 border rounded-lg ${
                                idx === 0
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveNewMember(idx, +1)}
                              disabled={idx === assignedMembers.length - 1}
                              className={`px-2 py-1 border rounded-lg ${
                                idx === assignedMembers.length - 1
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMember(m.userId)}
                              className="px-2 py-1 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Duty Modal */}
        {showEditModal && editDuty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Edit Duty</h3>
              <form onSubmit={submitEditDuty} className="space-y-4">
                {/* Name (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duty Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    disabled
                  />
                </div>
                {/* Day of Week (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={editDayOfWeek}
                    onChange={(e) => setEditDayOfWeek(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    disabled
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

                {/* End Date + Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="mt-1 block w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="mt-1 block w-1/2 border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Search + Edit Members */}
                <div ref={editSuggestionRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edit Rotation Members
                  </label>
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={editMemberSearch}
                    onChange={(e) => setEditMemberSearch(e.target.value)}
                    className="mb-2 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {editMemberSearch && filteredEditMembers.length > 0 && (
                    <ul className="border border-gray-200 rounded bg-white max-h-40 overflow-y-auto">
                      {filteredEditMembers.map((u) => (
                        <li
                          key={u.id}
                          onClick={() => handleAddEditMember(u)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer whitespace-nowrap"
                        >
                          {u.name} ({u.email})
                        </li>
                      ))}
                    </ul>
                  )}
                  {editMembers.length > 0 && (
                    <ul className="space-y-2 max-h-48 overflow-y-auto mt-2">
                      {editMembers.map((m, idx) => (
                        <li
                          key={m.userId}
                          className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-gray-50"
                        >
                          <span className="text-gray-800">{m.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveEditMember(idx, -1)}
                              disabled={idx === 0}
                              className={`px-2 py-1 border rounded-lg ${
                                idx === 0
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEditMember(idx, +1)}
                              disabled={idx === editMembers.length - 1}
                              className={`px-2 py-1 border rounded-lg ${
                                idx === editMembers.length - 1
                                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditMember(m.userId)}
                              className="px-2 py-1 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => confirmDelete(editDuty)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow"
                  >
                    Delete Duty
                  </button>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDeleteDuty && (
          <ConfirmModal
            title="Delete Duty"
            message={`Are you sure you want to delete "${confirmDeleteDuty.name}"?`}
            onConfirm={handleDelete}
            onCancel={cancelDelete}
          />
        )}
      </div>
    </Layout>
  );
}
