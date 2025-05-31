// src/pages/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function EditProfile() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [matchError, setMatchError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          birthday: data.birthday?.slice(0, 10) || '',
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile.');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    const updated = {
      ...passwords,
      [e.target.name]: e.target.value,
    };
    setPasswords(updated);

    if (
      updated.new &&
      updated.confirm &&
      updated.new !== updated.confirm
    ) {
      setMatchError('New passwords do not match');
    } else {
      setMatchError('');
    }
  };

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      passwords.new &&
      passwords.confirm &&
      passwords.new !== passwords.confirm
    ) {
      setMatchError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, ...passwords }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed.');
      }

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong.');
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      {matchError && (
        <p className="text-red-600 mb-2">{matchError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input
          className="w-full p-2 border rounded"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          type="date"
          name="birthday"
          value={form.birthday}
          onChange={handleChange}
        />

        <hr className="my-4" />

        {/* Current Password */}
        <div className="relative">
          <input
            type={show.current ? 'text' : 'password'}
            name="current"
            placeholder="Current password"
            className="w-full p-2 border rounded"
            value={passwords.current}
            onChange={handlePassChange}
          />
          <div
            onClick={() => toggleShow('current')}
            className="absolute top-2 right-2 cursor-pointer"
          >
            {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {/* New Password */}
        <div className="relative">
          <input
            type={show.new ? 'text' : 'password'}
            name="new"
            placeholder="New password"
            className="w-full p-2 border rounded"
            value={passwords.new}
            onChange={handlePassChange}
          />
          <div
            onClick={() => toggleShow('new')}
            className="absolute top-2 right-2 cursor-pointer"
          >
            {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="relative">
          <input
            type={show.confirm ? 'text' : 'password'}
            name="confirm"
            placeholder="Confirm new password"
            className="w-full p-2 border rounded"
            value={passwords.confirm}
            onChange={handlePassChange}
          />
          <div
            onClick={() => toggleShow('confirm')}
            className="absolute top-2 right-2 cursor-pointer"
          >
            {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </Layout>
  );
}
