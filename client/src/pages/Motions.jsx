import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Motions() {
  const [motions, setMotions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/motions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setMotions)
      .catch(console.error)
  }, [])

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Voting Motions</h1>
          <button
            onClick={() => navigate('/motions/new')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            + New Motion
          </button>
        </div>

        <ul className="space-y-3">
          {motions.map(m => (
            <li key={m.id} className="border p-3 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-sm text-gray-600">
                    {m.open ? '🟢 Open' : '🔒 Closed'} — {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  to={`/motions/${m.id}`}
                  className="text-blue-600 text-sm"
                >
                  View →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}