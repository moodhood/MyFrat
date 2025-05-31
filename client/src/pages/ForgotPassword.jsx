// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer effect for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Common send-link logic for initial request and resends
  const sendLink = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.status === 429) {
        toast.error('A reset link was already sent — please check your email.');
      } else if (!res.ok) {
        throw new Error('Something went wrong. Please try again later.');
      } else {
        toast.success('✅ Reset link sent. Please check your email.');
        setSent(true);
        setCooldown(60); // 60s cooldown
      }
    } catch (err) {
      console.error('❌ Forgot password error:', err);
      toast.error(err.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    sendLink();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-2 border rounded"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded text-white font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {sent && (
          <div className="space-y-3">
            <p className="text-center text-gray-600">
              Didn’t receive it? You can resend.
            </p>
            <button
              type="button"
              onClick={sendLink}
              disabled={cooldown > 0}
              className={`w-full py-2 rounded text-white font-semibold ${
                cooldown > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Reset Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
