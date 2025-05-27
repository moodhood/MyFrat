// src/pages/Philanthropy.jsx

import React, { useEffect, useState, useContext } from 'react'
import { listLogs, deleteLog } from '../services/api'
import { AuthContext } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function Philanthropy() {
  const [logs, setLogs] = useState([])
  useContext(AuthContext)

  useEffect(() => {
    listLogs().then(setLogs)
  }, [])

  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0)

  const remove = async id => {
    await deleteLog(id)
    setLogs(ls => ls.filter(l => l.id !== id))
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex justify-between items-baseline mb-4">
          <h1 className="text-xl font-bold">Your Philanthropy Logs</h1>
          <span className="text-lg font-semibold">
            Total hours: {totalHours}
          </span>
        </div>

        <a
          href="/philanthropy/new"
          className="mb-4 inline-block bg-blue-500 text-white p-2 rounded"
        >
          + Log Hours
        </a>

        <ul>
          {logs.map(l => (
            <li key={l.id} className="mb-2 border-b pb-2">
              <p>Date: {new Date(l.date).toLocaleDateString()}</p>
              <p>Org: {l.organization}</p>
              <p>Hours: {l.hours}</p>
              {l.notes && <p>Notes: {l.notes}</p>}
              <button
                onClick={() => remove(l.id)}
                className="text-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
