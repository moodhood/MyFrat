import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4 text-xl font-bold border-b">MyFrat</div>
        <nav className="p-4 space-y-2">
          <Link className="block text-gray-700 hover:text-blue-600" to="/dashboard">Dashboard</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/profile">Profile</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/events">Events</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/duties">Duties</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/philanthropy">Philanthropy</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/members">Members</Link>
          <Link className="block text-gray-700 hover:text-blue-600" to="/motions">Voting</Link>
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{user?.name || 'Member'}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
