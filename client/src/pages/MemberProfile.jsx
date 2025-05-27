import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'

export default function MemberProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`http://localhost:3000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error)
  }, [id])

  if (!profile) return <Layout><p className="p-4">Loading...</p></Layout>
  if (profile.error) return <Layout><p className="p-4 text-red-600">{profile.error}</p></Layout>

  return (
    <Layout>
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-700">{profile.email}</p>
          <p className="text-sm text-gray-500">
            Role: {profile.role.name} — Joined: {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Philanthropy Logs</h2>
          <p className="mb-2 font-medium">Total hours: {profile.totalHours}</p>
          <ul className="space-y-1">
            {profile.philanthropy.map(log => (
              <li key={log.id || log.date + log.organization} className="text-sm border-b pb-1">
                {log.hours}h @ {log.organization} on {new Date(log.date).toLocaleDateString()}
                {log.notes && (
                  <span className="block text-xs text-gray-500">Notes: {log.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Duties</h2>
          <ul className="space-y-1">
            {profile.duties.map((d, i) => (
              <li key={i} className="text-sm border-b pb-1">
                {d.description} — due {new Date(d.dueDate).toLocaleDateString()} —{' '}
                <span className={d.completed ? 'text-green-600' : 'text-yellow-600'}>
                  {d.completed ? 'Completed' : 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  )
}
