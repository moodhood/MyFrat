import React, { useState } from 'react'
import { createEvent } from '../services/api'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function NewEvent() {
  const [form, setForm] = useState({
    title: '', description: '', location: '', start: '', end: '', category: 'OTHER'
  })
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    await createEvent(form)
    navigate('/events')
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-3">
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="location"
          placeholder="Location"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="start"
          type="datetime-local"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="end"
          type="datetime-local"
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option>PHILANTHROPY</option>
          <option>BROTHERHOOD</option>
          <option>ADMIN</option>
          <option>OTHER</option>
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-green-600 text-white rounded"
        >
          Create Event
        </button>
      </form>
    </Layout>
  )
}
