import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  if (!data) return <Layout><p className="p-4">Loading dashboard...</p></Layout>

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <h1 className="text-2xl font-bold">Officer Dashboard</h1>
          <div className="text-right">
            <p className="text-lg">👥 Members: {data.totalMembers}</p>
            <p className="text-lg">🕒 Total Hours: {data.totalHours}</p>
          </div>
        </div>

        <div className="flex gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <h2 className="text-xl mb-2 font-semibold">📋 Recent Duties</h2>
            <ul className="border rounded p-3 space-y-2">
              {data.duties.map(d => (
                <li key={d.id} className="border-b pb-1 text-sm">
                  <p><strong>{d.user.name}</strong> — {d.description}</p>
                  <p className="text-gray-600">
                    Due: {new Date(d.dueDate).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 min-w-[280px]">
            <h2 className="text-xl mb-2 font-semibold">🤝 Recent Logs</h2>
            <ul className="border rounded p-3 space-y-2">
              {data.logs.map(l => (
                <li key={l.id} className="border-b pb-1 text-sm">
                  <p><strong>{l.user.name}</strong> — {l.organization}</p>
                  <p className="text-gray-600">
                    {l.hours} hours on {new Date(l.date).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h2 className="text-xl mb-2 font-semibold">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/events/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              + Create Event
            </button>
            <button
              onClick={() => navigate('/duties/new')}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              + Assign Duty
            </button>
            <button
              onClick={() => navigate('/philanthropy/new')}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              + Log Hours
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
