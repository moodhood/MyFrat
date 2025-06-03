// src/pages/ManageRoles.jsx

import React, { useEffect, useState, useContext } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../contexts/AuthContext";
import { ALL_PERMISSIONS } from "../config/permissions";
import { toast } from "react-toastify";

/*
  This page lists every role (with its current permissions array). 
  If the logged‐in user has "assign_high_roles", we show an "Edit Permissions" button.
  Clicking "Edit" pops up a modal with checkboxes for ALL_PERMISSIONS.
*/

export default function ManageRoles() {
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);       // [ { name, displayName, permissions: [...] }, … ]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [draftPermissions, setDraftPermissions] = useState([]); // array of keys

  // 1) Fetch all roles on mount:
  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error || "Failed to fetch roles");
        }
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // 2) Handler to open “Edit Permissions” modal for a given role:
  const openEditModal = (role) => {
    setEditingRole(role);
    // Initialize draftPermissions to a copy of role.permissions
    setDraftPermissions([...(role.permissions || [])]);
  };

  // 3) Toggle a single permission key in the draft list:
  const togglePermission = (key) => {
    setDraftPermissions((prev) => {
      if (prev.includes(key)) {
        return prev.filter((p) => p !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // 4) Submit updated permissions to the server:
  const savePermissions = async () => {
    if (!editingRole) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/roles/${editingRole.name}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPermissions: draftPermissions }),
        }
      );
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Failed to update permissions");
      }
      const updated = await res.json(); // { name, displayName, permissions: [...] }

      // 5) Update local state so UI refreshes immediately:
      setRoles((prev) =>
        prev.map((r) =>
          r.name === updated.name ? updated : r
        )
      );
      toast.success(`Permissions for ${updated.displayName} saved!`);
      setEditingRole(null);
      setDraftPermissions([]);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  // 6) Cancel editing:
  const cancelEdit = () => {
    setEditingRole(null);
    setDraftPermissions([]);
  };

  // 7) If the current user does NOT have assign_high_roles, we refuse to even show “Edit Permissions.”
  const canAssignHighRoles = user?.permissions?.includes("assign_high_roles");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Roles & Permissions</h1>

        {error && (
          <p className="text-red-600 mb-4">Error: {error}</p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading roles…</p>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className="bg-white border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{role.displayName}</p>
                  <p className="text-sm text-gray-600">
                    Permissions:{" "}
                    {role.permissions && role.permissions.length > 0
                      ? role.permissions.join(", ")
                      : "—"}
                  </p>
                </div>

                {canAssignHighRoles && (
                  <button
                    onClick={() => openEditModal(role)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Edit Permissions
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ————— Edit Permissions Modal ————— */}
        {editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Editing: {editingRole.displayName}
                </h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-600 text-2xl hover:text-gray-900"
                  title="Close"
                >
                  &times;
                </button>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                Check or uncheck any permissions below, then click “Save.”
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-64 overflow-y-auto border p-3 rounded mb-6">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={draftPermissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-800">{perm.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
