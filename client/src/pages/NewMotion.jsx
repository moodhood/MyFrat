// src/pages/NewMotion.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function NewMotion() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    options: [''],
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e, index = null) => {
    if (e.target.name === 'options') {
      const updated = [...form.options];
      updated[index] = e.target.value;
      setForm({ ...form, options: updated });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] });
  };

  const removeOption = (index) => {
    const updated = [...form.options];
    updated.splice(index, 1);
    setForm({ ...form, options: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = form.options.filter((opt) => opt.trim());
    if (!form.title || options.length < 2) {
      setError(
        'Title and at least two valid options are required.'
      );
      toast.error(
        'Title and at least two valid options are required.'
      );
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/motions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          options,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create motion');
      }

      toast.success('Motion created.');
      navigate('/motions');
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message || 'Error creating motion.');
    }
  };

  return (
    <Layout>
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto space-y-4 p-4"
      >
        <h1 className="text-2xl font-bold">Create New Motion</h1>
        {error && <div className="text-red-600">{error}</div>}

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Motion title"
          className="w-full p-2 border rounded"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Optional description"
          className="w-full p-2 border rounded"
        />

        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                name="options"
                value={opt}
                onChange={(e) => handleChange(e, i)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 p-2 border rounded"
                required
              />
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-red-500"
                >
                  ✖
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-blue-600 hover:underline text-sm"
          >
            + Add Option
          </button>
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          Create Motion
        </button>
      </form>
    </Layout>
  );
}
