// src/pages/Roles.jsx

import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ALL_PERMISSIONS } from '../config/permissions';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function Roles() {
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [formState, setFormState] = useState({
    displayName: '',
    permissions: [],
  });
  const [saving, setSaving] = useState(false);

  // Fetch all roles on mount
  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/roles', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch roles');
        }
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Error loading roles');
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // When you click “Edit” on a role, populate formState
  const startEditing = (role) => {
    setEditingRoleId(role.id);
    setFormState({
      displayName: role.displayName,
      permissions: [...role.permissions],
    });
  };

  const cancelEditing = () => {
    setEditingRoleId(null);
    setFormState({ displayName: '', permissions: [] });
  };

  const handleDisplayNameChange = (e) => {
    setFormState((prev) => ({ ...prev, displayName: e.target.value }));
  };

  const togglePermission = (perm) => {
    setFormState((prev) => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const saveRole = async () => {
    if (formState.displayName.trim() === '') {
      toast.error('displayName cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/roles/${editingRoleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: formState.displayName.trim(),
          permissions: formState.permissions,
        }),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || 'Failed to update role');
      }
      const updated = await res.json();
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      toast.success('Role updated');
      cancelEditing();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="p-4">Loading roles…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>

        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white border rounded-lg shadow-sm p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{role.displayName}</span>
              <button
                onClick={() => startEditing(role)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="text-sm text-gray-700">
              Permissions:{' '}
              {role.permissions.length > 0
                ? role.permissions.join(', ')
                : '— no permissions —'}
            </div>
          </div>
        ))}

        {editingRoleId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">
                Edit Role (ID: {editingRoleId})
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formState.displayName}
                  onChange={handleDisplayNameChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4 max-h-64 overflow-y-auto border rounded p-2">
                <p className="text-sm font-medium mb-2">Permissions</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formState.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="mr-2"
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
