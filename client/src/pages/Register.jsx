// src/pages/Register.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await register(form.email, form.password, form.name);
    navigate('/profile');
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="p-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-4">Register</h1>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="block w-full mb-2 p-2 border rounded"
          required
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="block w-full mb-2 p-2 border rounded"
          required
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="block w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          Register
        </button>
      </form>
    </Layout>
  );
}
