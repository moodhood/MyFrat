// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  // — Password reset state —
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetStatus, setResetStatus] = useState({
    loading: false,
    success: false,
  });

  // — Resend link state —
  const [emailForResend, setEmailForResend] = useState('');
  const [resendStatus, setResendStatus] = useState({
    loading: false,
  });
  const [cooldown, setCooldown] = useState(0);

  // Countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Submit new password
  const handleReset = async (e) => {
    e.preventDefault();
    setResetStatus({ loading: true, success: false });

    if (password !== confirm) {
      toast.error('Passwords do not match.');
      setResetStatus({ loading: false, success: false });
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Password reset failed');
      }

      toast.success('Password reset! Redirecting to login…');
      setResetStatus({ loading: false, success: true });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Password reset failed.');
      setResetStatus({ loading: false, success: false });
    }
  };

  // Resend reset link
  const handleResend = async () => {
    if (!emailForResend) {
      toast.error('Email is required');
      return;
    }

    setResendStatus({ loading: true });
    try {
      const res = await fetch('http://localhost:3000/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForResend.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Unable to resend link');
      }

      toast.success('✅ Reset link sent. Please check your email.');
      setResendStatus({ loading: false });
      setCooldown(60);
    } catch (err) {
      toast.error(err.message || 'Unable to resend link');
      setResendStatus({ loading: false });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* — Password Reset Form — */}
        <form
          onSubmit={handleReset}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">
            Reset Password
          </h1>

          {resetStatus.success ? (
            <p className="text-green-600 text-center">
              Password reset! Redirecting to login…
            </p>
          ) : (
            <>
              <div className="relative mb-4">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full p-2 border rounded"
                  required
                  disabled={resetStatus.loading}
                />
                <div
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              <div className="relative mb-4">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full p-2 border rounded"
                  required
                  disabled={resetStatus.loading}
                />
                <div
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              <button
                type="submit"
                disabled={resetStatus.loading}
                className={`w-full py-2 rounded text-white font-semibold ${
                  resetStatus.loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {resetStatus.loading
                  ? 'Submitting…'
                  : 'Set New Password'}
              </button>
            </>
          )}
        </form>

        {/* — Resend Reset Link — */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 text-center">
            Need a new link?
          </h2>
          <p className="text-gray-600 text-center mb-4">
            Enter your email to get another reset link.
          </p>

          <input
            type="email"
            value={emailForResend}
            onChange={(e) => setEmailForResend(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-2 border rounded mb-3"
            disabled={resendStatus.loading || cooldown > 0}
          />

          <button
            type="button"
            onClick={handleResend}
            disabled={resendStatus.loading || cooldown > 0}
            className={`w-full py-2 rounded text-white font-semibold ${
              resendStatus.loading || cooldown > 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {resendStatus.loading
              ? 'Sending…'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend Reset Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
