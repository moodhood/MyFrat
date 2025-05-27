// src/pages/NewMotion.jsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function NewMotion() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title || !form.deadline) {
      return setError('Title and deadline are required.')
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/motions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create motion')
      }

      navigate('/motions')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
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
        <input
          type="datetime-local"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          Create Motion
        </button>
      </form>
    </Layout>
  )
}
