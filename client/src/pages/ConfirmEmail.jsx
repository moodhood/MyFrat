// src/pages/ConfirmEmail.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const passedEmail =
    location.state?.email ||
    localStorage.getItem('pendingEmail') ||
    '';
  const passedPassword =
    localStorage.getItem('pendingPassword') || '';

  const [form, setForm] = useState({
    email: passedEmail,
    code: '',
  });
  const [loading, setLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Invalid confirmation code.');
      }
      toast.success('Email confirmed successfully.');

      // Attempt automatic login shortly after
      setTimeout(async () => {
        try {
          await login(form.email, passedPassword);
          localStorage.removeItem('pendingEmail');
          localStorage.removeItem('pendingPassword');
          navigate('/dashboard');
        } catch {
          toast.error(
            'Email confirmed, but automatic login failed. Please log in manually.'
          );
        }
      }, 600);
    } catch (err) {
      toast.error(err.message || 'Invalid confirmation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await fetch(
        'http://localhost:3000/api/auth/resend-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend code');
      }
      toast.success('Confirmation code resent successfully.');
      setResendCooldown(30); // 30s cooldown
    } catch (err) {
      toast.error(err.message || 'Error resending confirmation code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-sm p-6 rounded shadow space-y-4"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold">Confirm Your Email</h1>
          <p className="text-sm text-gray-600 mt-1">
            A confirmation code was sent to{' '}
            <span className="font-medium">{form.email}</span>.
          </p>
        </div>

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded"
          required
        />
        <input
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Confirmation Code"
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
        >
          {loading ? 'Confirming...' : 'Confirm Email'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`w-full p-2 mt-2 border rounded ${
            resendCooldown > 0
              ? 'text-gray-400 border-gray-300 cursor-not-allowed'
              : 'text-blue-600 border-blue-600 hover:bg-blue-50'
          }`}
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend Code'}
        </button>
      </form>
    </div>
  );
}
