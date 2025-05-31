// src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      setPasswordError(
        valid.test(value)
          ? ''
          : 'Password must be at least 8 characters, include uppercase, lowercase, and a number.'
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      setLoading(false);
      return;
    }

    try {
      await register(form.email, form.password, form.name);

      localStorage.setItem('pendingEmail', form.email);
      localStorage.setItem('pendingPassword', form.password);

      navigate('/confirm', { state: { email: form.email } });
    } catch (err) {
      console.error('❌ Register failed:', err);
      const msg =
        err?.response?.data?.error ||
        'Registration failed. Try a different email.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = checkStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-3"
      >
        <h1 className="text-xl font-bold text-center">Register</h1>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="block w-full p-2 border rounded"
          required
        />

        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="block w-full p-2 border rounded"
          required
        />

        {/* Password Field with Toggle */}
        <div className="relative">
          <input
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="block w-full p-2 border rounded"
            required
          />
          <div
            onClick={() => setPasswordVisible((prev) => !prev)}
            className="absolute top-2 right-2 cursor-pointer"
          >
            {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {/* Password Strength Bar */}
        <div className="h-2 rounded bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              strength <= 2
                ? 'bg-red-500 w-1/5'
                : strength === 3
                ? 'bg-yellow-500 w-3/5'
                : strength === 4
                ? 'bg-blue-500 w-4/5'
                : 'bg-green-500 w-full'
            }`}
          />
        </div>

        {passwordError && (
          <p className="text-red-500 text-xs">{passwordError}</p>
        )}

        {/* Confirm Password Field */}
        <div className="relative">
          <input
            name="confirm"
            type={confirmVisible ? 'text' : 'password'}
            value={form.confirm}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="block w-full p-2 border rounded"
            required
          />
          <div
            onClick={() => setConfirmVisible((prev) => !prev)}
            className="absolute top-2 right-2 cursor-pointer"
          >
            {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>

        {form.confirm && form.confirm !== form.password && (
          <p className="text-red-500 text-xs">
            Passwords do not match.
          </p>
        )}

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>

        <p className="text-sm text-center text-gray-600">
          A confirmation code will be sent to your email.
        </p>
      </form>
    </div>
  );
}
