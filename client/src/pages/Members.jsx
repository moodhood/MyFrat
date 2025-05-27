import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Members() {
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error)
  }, [])

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fraternity Members</h1>
      <ul className="space-y-3">
        {users.map(u => (
          <li
            key={u.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{u.name}</p>
              <p className="text-sm text-gray-600">{u.role.name}</p>
            </div>
            <button
              onClick={() => navigate(`/members/${u.id}`)}
              className="text-blue-600 font-medium"
            >
              View Profile →
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
