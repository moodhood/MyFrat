import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

export default function EditProfile() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', birthday: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        birthday: data.birthday?.slice(0, 10) || ''
      }))
      .catch(console.error)
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handlePassChange = e => setPasswords({ ...passwords, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, ...passwords })
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Update failed.')
        return
      }
      navigate('/profile')
    } catch {
      setError('Something went wrong.')
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input className="w-full p-2 border rounded" name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input className="w-full p-2 border rounded" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input className="w-full p-2 border rounded" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <input className="w-full p-2 border rounded" type="date" name="birthday" value={form.birthday} onChange={handleChange} />

        <hr className="my-4" />

        <input className="w-full p-2 border rounded" type="password" name="current" placeholder="Current password" value={passwords.current} onChange={handlePassChange} />
        <input className="w-full p-2 border rounded" type="password" name="new" placeholder="New password" value={passwords.new} onChange={handlePassChange} />
        <input className="w-full p-2 border rounded" type="password" name="confirm" placeholder="Confirm new password" value={passwords.confirm} onChange={handlePassChange} />

        <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Save Changes</button>
      </form>
    </Layout>
  )
}
