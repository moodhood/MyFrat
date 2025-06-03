// src/pages/MemberProfile.jsx

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ROLE_COLORS, ROLE_PRIORITY } from '../constants/roles';

export default function MemberProfile() {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch the member’s profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:3000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
        setSelectedRoleIds(data.roles.map((r) => r.id));
      } catch (err) {
        console.error(err);
        toast.error('Could not load profile.');
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [id]);

  // Fetch all available roles (if current user can assign roles)
  useEffect(() => {
    async function fetchRoles() {
      if (!currentUser?.permissions?.includes('assign_roles')) return;
      setLoadingRoles(true);
      try {
        const res = await fetch('http://localhost:3000/api/roles', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setAllRoles(data);
      } catch (err) {
        console.error(err);
        toast.error('Could not load roles.');
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchRoles();
  }, [currentUser]);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Toggle a role in the selection array
  const toggleRoleInSelection = (roleId) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Submit updated roles to the server
  const submitRoleChanges = async () => {
    if (!profile) return;
    setUpdatingRoles(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/users/${profile.id}/roles`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ roleIds: selectedRoleIds }),
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Update failed');
      }
      const updatedUser = await res.json();
      setProfile((prev) => ({
        ...prev,
        roles: updatedUser.roles,
      }));
      toast.success('Roles successfully updated');
      setDropdownOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Could not update roles: ${err.message}`);
    } finally {
      setUpdatingRoles(false);
    }
  };

  if (loadingProfile) {
    return (
      <Layout>
        <p className="p-6 text-center">Loading…</p>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <p className="p-6 text-center text-red-600">Profile not found.</p>
      </Layout>
    );
  }

  // Sort roles by priority (highest first)
  const sortedRoles = [...profile.roles].sort((a, b) => {
    return ROLE_PRIORITY.indexOf(a.name) - ROLE_PRIORITY.indexOf(b.name);
  });

  // Given a role name, derive its badge classes (background + text)
  const getBadgeClasses = (roleName) => {
    const textClass = ROLE_COLORS[roleName] || 'text-gray-800';
    const [, colorKey, shade] = textClass.split('-');
    // Convert text shade 600 → bg shade 100; 800 → 200; otherwise default to 100
    const bgShade = shade === '600' ? '100' : shade === '800' ? '200' : '100';
    const bgClass = `bg-${colorKey}-${bgShade}`;
    return `${bgClass} ${textClass}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header: Avatar + Basic Info + Sorted Role Badges */}
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border bg-gray-100 flex-shrink-0">
            <img
              src={
                profile.profilePicture
                  ? `http://localhost:3000/uploads/${profile.profilePicture}`
                  : '/default-avatar.png'
              }
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="mt-1 text-gray-700">{profile.email}</p>

            {/* Role Badges in Priority Order */}
            <div className="mt-2 flex flex-wrap justify-center md:justify-start">
              {sortedRoles.length > 0 ? (
                sortedRoles.map((role) => (
                  <span
                    key={role.id}
                    className={`${getBadgeClasses(role.name)} text-xs font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded-full`}
                  >
                    {role.displayName}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm mb-2">No roles</span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Joined: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Main Content: Philanthropy & Duties Timelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Philanthropy Timeline */}
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Philanthropy</h2>
            <p className="text-sm text-gray-700 font-medium mb-4">
              Total hours: {profile.totalHours}
            </p>
            {profile.philanthropy.length === 0 ? (
              <p className="text-sm text-gray-500">No logs found.</p>
            ) : (
              <div className="relative border-l-2 border-gray-200 pl-6">
                {profile.philanthropy
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((log) => (
                    <div key={log.id} className="mb-6 relative">
                      <div className="absolute -left-3 top-0">
                        <span className="w-3 h-3 bg-blue-600 rounded-full block"></span>
                      </div>
                      <div className="mb-1">
                        <p className="text-sm text-gray-700 font-medium">
                          {log.hours}h @ {log.organization}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-gray-500 ml-4">
                          Notes: {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Duties Timeline */}
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Duties</h2>
            {profile.duties.length === 0 ? (
              <p className="text-sm text-gray-500">No duties assigned.</p>
            ) : (
              <div className="relative border-l-2 border-gray-200 pl-6">
                {profile.duties
                  .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                  .map((duty, index) => (
                    <div key={index} className="mb-6 relative">
                      <div className="absolute -left-3 top-0">
                        <span
                          className={`w-3 h-3 rounded-full block ${
                            duty.completed ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                        ></span>
                      </div>
                      <div className="mb-1">
                        <p className="text-sm text-gray-700 font-medium">
                          {duty.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due {new Date(duty.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          duty.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {duty.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Manage Roles Section (visible only to users with assign_roles permission) */}
        {currentUser?.permissions?.includes('assign_roles') && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold mb-2">Manage Roles</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click “Select Roles” to open the dropdown. Click each checkbox to
              add/remove roles.
            </p>

            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="inline-flex justify-between items-center w-52 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {selectedRoleIds.length
                  ? allRoles
                      .filter((r) => selectedRoleIds.includes(r.id))
                      .map((r) => r.displayName)
                      .join(', ')
                  : 'Select Roles'}
                <svg
                  className="ml-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 011.13.98l-4.25 4.65a.75.75 0 01-1.13 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="origin-top-left absolute mt-2 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="max-h-60 overflow-y-auto py-1">
                    {allRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoleIds.includes(role.id)}
                          onChange={() => toggleRoleInSelection(role.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {role.displayName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={submitRoleChanges}
                disabled={updatingRoles}
                className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              >
                {updatingRoles ? 'Saving…' : 'Save Changes'}
              </button>
            </div>

            {loadingRoles && (
              <p className="mt-2 text-gray-500">Loading available roles…</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
