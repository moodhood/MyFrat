// src/pages/Profile.jsx

import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { AuthContext } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ROLE_PRIORITY } from '../constants/roles';

export default function Profile() {
  const { user, setAuthState, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
    profilePicture: null,
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [imgKey, setImgKey] = useState(Date.now());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      birthday: user.birthday ? user.birthday.split('T')[0] : '',
      address: user.address || '',
      profilePicture: null,
    });

    setImgKey(Date.now());
  }, [user]);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profilePicture') {
      setForm((f) => ({ ...f, profilePicture: files[0] }));
    } else if (name === 'phone') {
      setForm((f) => ({ ...f, phone: formatPhone(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (newPassword && newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      setSaving(false);
      return;
    }

    const token = localStorage.getItem('token');
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });
    if (currentPassword) body.append('currentPassword', currentPassword);
    if (newPassword) body.append('newPassword', newPassword);
    if (confirmPassword) body.append('confirmPassword', confirmPassword);

    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));

      if (!res.ok) {
        console.error('❌ Server responded with:', data);
        setMessage(data.error || 'Update failed');
        toast.error(data.error || 'Update failed');
      } else {
        // Backend returns user with roles array
        const updatedRoles = data.roles || [];
        const sorted = [...updatedRoles].sort((a, b) => {
          return ROLE_PRIORITY.indexOf(a.name) - ROLE_PRIORITY.indexOf(b.name);
        });

        const updatedUser = {
          ...data,
          roles: sorted,
          permissions: sorted.reduce((acc, r) => {
            (r.permissions || []).forEach((p) => acc.add(p));
            return acc;
          }, new Set()),
        };
        updatedUser.permissions = Array.from(updatedUser.permissions);

        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        setAuthState(updatedUser);
        setMessage('Profile updated successfully!');
        toast.success('Profile updated successfully!');

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setImgKey(Date.now());

        setTimeout(() => setEdit(false), 50);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err);
      setMessage('Server error occurred.');
      toast.error('Server error occurred.');
    }

    setSaving(false);
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        address: user.address || '',
        profilePicture: null,
      });
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEdit(false);
    setMessage('');
  };

  const openDeleteModal = () => {
    setConfirmingDelete(true);
  };

  const confirmDeleteAccount = async () => {
    setConfirmingDelete(false);
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        toast.success('Account deleted successfully.');
        logout();
        navigate('/login');
      } else {
        const payload = await res.json();
        throw new Error(payload.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('❌ Error deleting account:', err);
      toast.error(err.message || 'Could not delete account.');
    } finally {
      setSaving(false);
    }
  };

  const cancelDeleteAccount = () => {
    setConfirmingDelete(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  // Sort user’s roles by priority
  const sortedRoles = [...(user.roles || [])].sort((a, b) => {
    return ROLE_PRIORITY.indexOf(a.name) - ROLE_PRIORITY.indexOf(b.name);
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header: avatar, name, and role badges */}
        <div className="flex items-center gap-4">
          <img
            src={
              user.profilePicture
                ? `http://localhost:3000/uploads/${user.profilePicture}?v=${imgKey}`
                : '/default-avatar.png'
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
            onError={(e) => (e.target.src = '/default-avatar.png')}
          />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1">
              {sortedRoles.map((r) => (
                <span
                  key={r.id}
                  className={`inline-block ${
                    ({
                      'High Alpha':    'bg-red-100 text-red-800',
                      'High Nerd':     'bg-purple-100 text-purple-800',
                      'High Beta':     'bg-orange-100 text-orange-800',
                      'High Theta':    'bg-yellow-100 text-yellow-800',
                      'High Gamma':    'bg-green-100 text-green-800',
                      'High Tau':      'bg-teal-100 text-teal-800',
                      'High Iota':     'bg-indigo-100 text-indigo-800',
                      'High Rho':      'bg-pink-100 text-pink-800',
                      'High Kappa':    'bg-lime-100 text-lime-800',
                      'High Delta':    'bg-amber-100 text-amber-800',
                      'High Phi':      'bg-emerald-100 text-emerald-800',
                      'High Sigma':    'bg-cyan-100 text-cyan-800',
                      'High Epsilon':  'bg-sky-100 text-sky-800',
                      'High Pi':       'bg-fuchsia-100 text-fuchsia-800',
                      'House Manager':'bg-gray-100 text-gray-800',
                      'High Jock':     'bg-blue-100 text-blue-800',
                      'Member':        'bg-blue-200 text-blue-900',
                    })[r.name] || 'bg-gray-100 text-gray-800'
                  } text-xs font-semibold px-2.5 py-0.5 rounded`}
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal info inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={!edit}
              placeholder="Name"
            />
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={!edit}
              placeholder="Email"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={!edit}
              placeholder="(555) 123-4567"
            />
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
              className="p-2 border rounded"
              disabled={!edit}
            />
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="p-2 border rounded col-span-full"
              disabled={!edit}
              placeholder="Address"
            />

            {edit && (
              <div className="col-span-full">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Change Profile Picture
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded border border-gray-300">
                    Choose File
                    <input
                      type="file"
                      name="profilePicture"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-600">
                    {form.profilePicture ? form.profilePicture.name : 'No file chosen'}
                  </span>
                </div>
                {form.profilePicture && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Preview:</p>
                    <img
                      src={URL.createObjectURL(form.profilePicture)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-full border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {edit && (
            <>
              {/* Current Password */}
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="p-2 border rounded w-full"
                  placeholder="Enter current password"
                  required={!!newPassword}
                />
                <div
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, current: !prev.current }))
                  }
                  className="absolute top-2 right-2 cursor-pointer"
                >
                  {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              {/* New Password */}
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="p-2 border rounded w-full"
                  placeholder="New password (optional)"
                />
                <div
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute top-2 right-2 cursor-pointer"
                >
                  {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-2 border rounded w-full"
                  placeholder="Confirm new password"
                />
                <div
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                  className="absolute top-2 right-2 cursor-pointer" 
                >
                  {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </>
          )}

          {edit ? (
            <div className="flex gap-4">
              <button
                disabled={saving}
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEdit(true)}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}

          {message && (
            <p
              className={`text-sm ${
                message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}
        </form>

        {/* Delete Account Section */}
        <div className="pt-6 border-t">
          <button
            onClick={openDeleteModal}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? 'Processing…' : 'Delete My Account'}
          </button>
        </div>
      </div>

      {/* ConfirmModal for Deleting Account */}
      {confirmingDelete && (
        <ConfirmModal
          title="Delete Your Account?"
          message="This will permanently remove all your data, including your profile, logs, and votes. Are you absolutely sure?"
          onConfirm={confirmDeleteAccount}
          onCancel={cancelDeleteAccount}
        />
      )}
    </Layout>
  );
}
