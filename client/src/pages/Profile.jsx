import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile() {
  const { user, setAuthState } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
    profilePicture: null
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [imgKey, setImgKey] = useState(Date.now());

  useEffect(() => {
    if (!user) return;

    setForm(prev => ({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      birthday: user.birthday ? user.birthday.split('T')[0] : '',
      address: user.address || '',
      profilePicture: prev.profilePicture
    }));

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
      setForm(f => ({ ...f, profilePicture: files[0] }));
    } else if (name === 'phone') {
      setForm(f => ({ ...f, phone: formatPhone(value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
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
        body
      });

      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }));

      if (!res.ok) {
        console.error('❌ Server responded with:', data);
        setMessage(data.error || 'Update failed');
      } else {
        const updatedUser = {
          ...data,
          role: data.role?.name || data.role,
          permissions: data.role?.permissions || data.permissions || []
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setAuthState(updatedUser);
        setMessage('Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setImgKey(Date.now());

        setTimeout(() => {
          setEdit(false);
        }, 50);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err);
      setMessage('Server error occurred.');
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
        profilePicture: null
      });
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEdit(false);
    setMessage('');
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    officer: 'bg-green-100 text-green-800',
    member: 'bg-blue-100 text-blue-800',
    guest: 'bg-gray-100 text-gray-800'
  };

  const roleName = user?.role?.name || user?.role || 'member';
  const roleClass = roleColors[roleName.toLowerCase()] || 'bg-gray-100 text-gray-800';

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.profilePicture
                ? `http://localhost:3000/uploads/${user.profilePicture}?v=${imgKey}`
                : '/default-avatar.png'
            }
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
            onError={(e) => (e.target.src = '/default-avatar.png')}
          />
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <span className={`inline-block ${roleClass} text-xs font-semibold px-2.5 py-0.5 rounded`}>
              {roleName}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleChange} className="p-2 border rounded" disabled={!edit} placeholder="Name" />
            <input name="email" value={form.email} onChange={handleChange} className="p-2 border rounded" disabled={!edit} placeholder="Email" />
            <input name="phone" value={form.phone} onChange={handleChange} className="p-2 border rounded" disabled={!edit} placeholder="(555) 123-4567" />
            <input name="birthday" type="date" value={form.birthday} onChange={handleChange} className="p-2 border rounded" disabled={!edit} />
            <input name="address" value={form.address} onChange={handleChange} className="p-2 border rounded col-span-full" disabled={!edit} placeholder="Address" />

            {edit && (
              <div className="col-span-full">
                <label className="block mb-1 text-sm font-medium text-gray-700">Change Profile Picture</label>
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
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="Enter current password"
                required={!!newPassword}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="New password (optional)"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="Confirm new password"
              />
            </>
          )}

          {edit ? (
            <div className="flex gap-4">
              <button disabled={saving} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel} className="text-gray-600">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEdit(true)} className="bg-gray-800 text-white px-4 py-2 rounded">
              Edit Profile
            </button>
          )}

          {message && (
            <p className={`text-sm ${message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </Layout>
  );
}
