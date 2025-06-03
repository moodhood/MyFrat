// src/components/Layout.jsx

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { ROLE_PRIORITY, ROLE_COLORS } from '../constants/roles';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all users for sidebar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }
    async function fetchUsers() {
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
    }
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6 bg-white shadow rounded">
          <h2 className="text-xl font-bold mb-2">You are not logged in</h2>
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

  // Determine online vs offline
  const now = new Date();
  const cutoff = new Date(now.getTime() - 2 * 60 * 1000);
  const onlineUsers = allUsers.filter(
    (u) => u.lastSeen && new Date(u.lastSeen) >= cutoff
  );
  const offlineUsers = allUsers
    .filter((u) => !u.lastSeen || new Date(u.lastSeen) < cutoff)
    .sort(
      (a, b) =>
        new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime()
    );

  function getHighestRole(roles = []) {
    if (!Array.isArray(roles) || roles.length === 0) return 'Member';
    const sorted = [...roles].sort((a, b) => {
      return ROLE_PRIORITY.indexOf(a.name) - ROLE_PRIORITY.indexOf(b.name);
    });
    return sorted[0]?.name || 'Member';
  }

  // Group online by highest role
  const onlineByRole = {};
  onlineUsers.forEach((u) => {
    const highest = getHighestRole(u.roles || []);
    if (!onlineByRole[highest]) onlineByRole[highest] = [];
    onlineByRole[highest].push(u);
  });
  const memberOnline = onlineByRole['Member'] || [];
  delete onlineByRole['Member'];

  // Sort offline by role priority
  const sortedOffline = [...offlineUsers].sort((a, b) => {
    const ra = ROLE_PRIORITY.indexOf(getHighestRole(a.roles || []));
    const rb = ROLE_PRIORITY.indexOf(getHighestRole(b.roles || []));
    return ra - rb;
  });

  const canAssign = user.permissions?.includes('assign_duties');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-4 text-xl font-bold h-16 flex items-center shadow-sm">
          MyFrat
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {canAssign && (
            <Link
              to="/dashboard/officer"
              className="block text-gray-700 hover:text-blue-600"
            >
              Officer Dashboard
            </Link>
          )}
          <Link
            to="/dashboard/member"
            className="block text-gray-700 hover:text-blue-600"
          >
            My Dashboard
          </Link>
          <Link to="/profile" className="block text-gray-700 hover:text-blue-600">
            Profile
          </Link>
          <Link to="/events" className="block text-gray-700 hover:text-blue-600">
            Events
          </Link>
          {canAssign && (
            <Link to="/duties" className="block text-gray-700 hover:text-blue-600">
              Duties
            </Link>
          )}
          <Link
            to="/philanthropy"
            className="block text-gray-700 hover:text-blue-600"
          >
            Philanthropy
          </Link>
          <Link to="/members" className="block text-gray-700 hover:text-blue-600">
            Members
          </Link>
          <Link to="/motions" className="block text-gray-700 hover:text-blue-600">
            Voting
          </Link>
          <Link to="/documents" className="block text-gray-700 hover:text-blue-600">
            Documents
          </Link>
          {user.permissions?.includes('manage_roles') && (
            <Link to="/roles" className="block text-gray-700 hover:text-blue-600">
              Roles & Permissions
            </Link>
          )}
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
        <header className="bg-white shadow px-4 h-16 flex items-center">
          <h1 className="text-xl font-semibold">{user.name}</h1>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>

          {/* Right Sidebar */}
          <aside className="w-64 bg-white border-l border-t border-gray-200 overflow-y-auto hidden md:flex flex-col">
            <div className="px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
              {/* ONLINE USERS (unchanged) */}
              {ROLE_PRIORITY.map((roleName) => {
                if (roleName === 'Member') return null;
                const usersForRole = onlineByRole[roleName] || [];
                if (usersForRole.length === 0) return null;
                return (
                  <div key={roleName}>
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      {roleName} — {usersForRole.length}
                    </div>
                    <ul className="space-y-1">
                      {usersForRole.map((u) => {
                        const userColor = ROLE_COLORS[roleName] || 'text-gray-800';
                        return (
                          <li key={u.id} className="flex items-center gap-2">
                            <img
                              src={
                                u.profilePicture
                                  ? `http://localhost:3000/uploads/${u.profilePicture}`
                                  : '/default-avatar.png'
                              }
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border"
                            />
                            <Link
                              to={`/members/${u.id}`}
                              className={`truncate text-sm font-medium ${userColor}`}
                            >
                              {u.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              {memberOnline.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">
                    Member — {memberOnline.length}
                  </div>
                  <ul className="space-y-1">
                    {memberOnline.map((u) => {
                      const userColor = ROLE_COLORS['Member'] || 'text-gray-800';
                      return (
                        <li key={u.id} className="flex items-center gap-2">
                          <img
                            src={
                              u.profilePicture
                                ? `http://localhost:3000/uploads/${u.profilePicture}`
                                : '/default-avatar.png'
                            }
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <Link
                            to={`/members/${u.id}`}
                            className={`truncate text-sm font-medium ${userColor}`}
                          >
                            {u.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {onlineUsers.length === 0 && (
                <p className="text-xs text-gray-400">No users online</p>
              )}
            </div>

            {/* OFFLINE SECTION (grayed out) */}
            <div className="px-4 py-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
              <span className="text-sm font-medium text-gray-600">
                Offline — {offlineUsers.length}
              </span>
              {sortedOffline.length === 0 ? (
                <p className="text-xs text-gray-400">No offline users</p>
              ) : (
                <ul className="space-y-2 mt-2">
                  {sortedOffline.map((u) => (
                    <li key={u.id}>
                      <div className="flex items-start gap-2">
                        <img
                          src={
                            u.profilePicture
                              ? `http://localhost:3000/uploads/${u.profilePicture}`
                              : '/default-avatar.png'
                          }
                          alt={u.name}
                          className="mt-0.5 w-8 h-8 rounded-full object-cover border opacity-50"
                        />
                        <div className="flex flex-col flex-1">
                          <Link
                            to={`/members/${u.id}`}
                            className="truncate text-sm font-medium text-gray-400"
                          >
                            {u.name}
                          </Link>
                          {u.lastSeen && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              Last seen{' '}
                              {formatDistanceToNow(new Date(u.lastSeen), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
