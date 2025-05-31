// src/layouts/Layout.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch list of users to show online/offline status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllUsers(data);
        } else {
          throw new Error('Invalid user data format');
        }
      } catch (err) {
        console.error(err);
        setAllUsers([]);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If not logged in, show a full‐screen “Please log in” message
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6 bg-white shadow rounded">
          <h2 className="text-xl font-bold mb-2">You're not logged in</h2>
          <p className="mb-4 text-gray-600">
            {error || 'Please log in to continue.'}
          </p>
          <Link to="/login" className="text-blue-600 underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Compute online/offline based on lastSeen timestamp
  const now = new Date();
  const onlineCutoff = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
  const online = Array.isArray(allUsers)
    ? allUsers.filter((u) => new Date(u.lastSeen) >= onlineCutoff)
    : [];
  const offline = Array.isArray(allUsers)
    ? allUsers
        .filter((u) => !u.lastSeen || new Date(u.lastSeen) < onlineCutoff)
        .sort(
          (a, b) =>
            new Date(b.lastSeen || 0).getTime() -
            new Date(a.lastSeen || 0).getTime()
        )
    : [];

  const renderUser = (u, isOnline) => (
    <Link
      to={`/members/${u.id}`}
      key={u.id}
      className="flex items-center gap-2 text-sm text-gray-800 relative group hover:bg-gray-100 rounded px-2 py-1"
    >
      {isOnline && (
        <span
          title="Online"
          className="absolute top-0 left-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white translate-x-[-5px] translate-y-[5px]"
        />
      )}
      <img
        src={
          u.profilePicture
            ? `http://localhost:3000/uploads/${u.profilePicture}`
            : '/default-avatar.png'
        }
        alt={u.name}
        className="w-6 h-6 rounded-full object-cover border"
      />
      <div className="truncate leading-tight">
        <div>{u.name}</div>
        {!isOnline && u.lastSeen && (
          <div className="text-xs text-gray-500 group-hover:visible">
            Last seen {formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true })}
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Left */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-4 text-xl font-bold border-b h-[60px] flex items-center">
          MyFrat
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {user.permissions?.includes('assign_duties') && (
            <Link
              className="block text-gray-700 hover:text-blue-600"
              to="/dashboard/officer"
            >
              Officer Dashboard
            </Link>
          )}
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/dashboard/member"
          >
            My Dashboard
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/profile"
          >
            Profile
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/events"
          >
            Events
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/duties"
          >
            Duties
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/philanthropy"
          >
            Philanthropy
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/members"
          >
            Members
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/motions"
          >
            Voting
          </Link>
          <Link
            className="block text-gray-700 hover:text-blue-600"
            to="/documents"
          >
            Documents
          </Link>
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

      {/* Main Content + Right Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow px-4 h-[60px] flex items-center">
          <h1 className="text-xl font-semibold">{user?.name || 'Member'}</h1>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>

          {/* Right Sidebar */}
          <aside className="w-64 bg-white border-l overflow-y-auto hidden md:flex flex-col">
            <div className="border-b p-4 text-sm font-medium text-gray-600">
              Online
            </div>
            <div className="px-4 py-2 space-y-2">
              {online.length === 0 ? (
                <p className="text-xs text-gray-400">No one online</p>
              ) : (
                online.map((u) => renderUser(u, true))
              )}
            </div>

            <div className="border-t p-4 text-sm font-medium text-gray-600">
              Offline
            </div>
            <div className="px-4 py-2 space-y-2">
              {offline.length === 0 ? (
                <p className="text-xs text-gray-400">No offline users</p>
              ) : (
                offline.map((u) => renderUser(u, false))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
