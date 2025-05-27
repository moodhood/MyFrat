import React, { useEffect, useState, useContext } from 'react'
import { listDuties, updateDuty, deleteDuty } from '../services/api'
import { AuthContext } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function Duties() {
  const [duties, setDuties] = useState([])
  const { user } = useContext(AuthContext)

  useEffect(() => {
    listDuties().then(setDuties)
  }, [])

  const toggleComplete = async duty => {
    const updated = await updateDuty(duty.id, { completed: !duty.completed })
    setDuties(d => d.map(x => (x.id === updated.id ? updated : x)))
  }

  const remove = async id => {
    await deleteDuty(id)
    setDuties(d => d.filter(x => x.id !== id))
  }

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Your Duties</h1>

        {user.permissions.includes('assign_duties') && (
          <a
            href="/duties/new"
            className="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Assign Duty
          </a>
        )}

        <ul className="space-y-4">
          {duties.map(d => (
            <li key={d.id} className="border p-4 rounded shadow-sm">
              <p className="font-medium">{d.description}</p>
              <p className="text-sm text-gray-600">
                Due: {new Date(d.dueDate).toLocaleDateString()}
              </p>
              <p className="text-sm">
                Status: {d.completed ? '✅ Done' : '❌ Pending'}
              </p>
              <div className="mt-2 space-x-2">
                {!d.completed && (
                  <button
                    onClick={() => toggleComplete(d)}
                    className="text-green-600 hover:underline"
                  >
                    Mark Complete
                  </button>
                )}
                {user.permissions.includes('assign_duties') && (
                  <button
                    onClick={() => remove(d.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
