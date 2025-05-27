// src/pages/Events.jsx
import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { listEvents } from '../services/api'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Events() {
  const { user } = useContext(AuthContext)
  const [events, setEvents] = useState([])

  useEffect(() => {
    listEvents().then(setEvents)
  }, [])

  return (
    <Layout>
      <div className="p-4 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Events</h1>
          {(user?.permissions || []).includes('manage_events') && (
            <Link to="/events/new" className="bg-blue-600 text-white px-4 py-2 rounded">
              + New Event
            </Link>
          )}
        </div>

        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="border p-3 rounded">
              <h2 className="font-semibold">{event.title}</h2>
              <p>{new Date(event.start).toLocaleString()} – {new Date(event.end).toLocaleString()}</p>
              <p className="text-sm text-gray-600">{event.category}</p>
              {event.description && <p>{event.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
