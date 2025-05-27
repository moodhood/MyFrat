import React, { useState, useEffect, useContext } from 'react'
import { listUsers, assignDuty } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function NewDuty() {
  const { user } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ userId: '', description: '', dueDate: '' })
  const navigate = useNavigate()

  useEffect(() => {
    if (user.permissions.includes('assign_duties')) {
      listUsers().then(setUsers)
    }
  }, [user])

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    await assignDuty(form)
    navigate('/duties')
  }

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto">
        <select
          name="userId"
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        >
          <option value="">Assign to…</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Duty description"
          onChange={handleChange}
          className="w-full mb-2 p-2 border rounded"
          required
        />
        <input
          name="dueDate"
          type="date"
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-green-500 text-white rounded">
          Assign Duty
        </button>
      </form>
    </Layout>
  )
}
