import React, { useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    await login(form.email, form.password)
    navigate('/profile')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Member Login</h1>

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="block w-full mb-3 p-2 border rounded"
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

        <button
          type="submit"
          className="w-full p-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
        >
          Login
        </button>
      </form>
    </div>
  )
}
