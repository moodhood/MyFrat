import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function MotionDetail() {
  const { id } = useParams()
  const [motion, setMotion] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`http://localhost:3000/api/motions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMotion(data.motion)
        setHasVoted(data.hasVoted)
      })
      .catch(console.error)
  }, [id])

  const vote = async choice => {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3000/api/motions/${id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ choice })
    })

    if (res.ok) {
      setHasVoted(true)
      alert('Your vote has been recorded!')
      navigate('/votes')
    } else {
      const data = await res.json()
      alert(data.error || 'Vote failed')
    }
  }

  if (!motion) return <Layout><p className="p-4">Loading motion...</p></Layout>

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">{motion.title}</h1>
        <p>{motion.description}</p>
        <p className="text-sm text-gray-500">
          Created: {new Date(motion.createdAt).toLocaleString()}
        </p>
        <p className="text-sm">
          Status: {motion.open ? '🟢 Open' : '🔒 Closed'}
        </p>

        {motion.open && !hasVoted && (
          <div className="space-x-4 pt-4">
            <button
              onClick={() => vote(true)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              ✅ Yes
            </button>
            <button
              onClick={() => vote(false)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              ❌ No
            </button>
          </div>
        )}

        {hasVoted && (
          <p className="pt-4 text-green-700 font-medium">You have already voted on this motion.</p>
        )}
      </div>
    </Layout>
  )
}
