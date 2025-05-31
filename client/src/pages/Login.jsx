// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error('Please confirm your email first.');
      } else {
        toast.error('Invalid email or password.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md"
      >
        <h1 className="text-2xl font-bold text-center mb-6">Member Login</h1>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
        >
          Login
        </button>

        <div className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Register
          </Link>
        </div>
        <div className="text-sm text-center text-gray-600 mt-2">
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:underline font-medium"
          >
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  );
}
