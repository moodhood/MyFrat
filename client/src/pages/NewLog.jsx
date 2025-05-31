// src/pages/NewLog.jsx
import React, { useState } from 'react';
import { createLog } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function NewLog() {
  const [form, setForm] = useState({
    date: '',
    organization: '',
    hours: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.date || !form.organization || !form.hours) {
      setError('Please fill out date, organization, and hours.');
      toast.error('Please fill out date, organization, and hours.');
      return;
    }

    try {
      await createLog(form);
      toast.success('Log saved.');
      navigate('/philanthropy');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving.');
      toast.error('Something went wrong while saving.');
    }
  };

  return (
    <Layout>
      <form
        onSubmit={handleSubmit}
        className="p-4 max-w-lg mx-auto space-y-4"
      >
        <h2 className="text-xl mb-4">Log Philanthropy Hours</h2>

        {error && (
          <div className="text-red-600 font-medium mb-2">
            {error}
          </div>
        )}

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          name="organization"
          placeholder="Organization"
          value={form.organization}
          onChange={handleChange}
          required
          className="w-full mb-2 p-2 border rounded"
        />

        <input
          type="number"
          name="hours"
          placeholder="Hours"
          value={form.hours}
          onChange={handleChange}
          required
          className="w-full mb-2 p-2 border rounded"
        />

        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Save
        </button>
      </form>
    </Layout>
  );
}
