// src/pages/Philanthropy.jsx
import React, { useEffect, useState } from 'react';
import { listLogs, deleteLog } from '../services/api';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';

export default function Philanthropy() {
  const [logs, setLogs] = useState([]);
  // Track which log is pending deletion
  const [confirmingLogId, setConfirmingLogId] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await listLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load philanthropy logs.');
      }
    };
    fetchLogs();
  }, []);

  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  const beginRemove = (id) => {
    setConfirmingLogId(id);
  };

  const handleConfirmRemove = async () => {
    const id = confirmingLogId;
    setConfirmingLogId(null);

    try {
      await deleteLog(id);
      setLogs((ls) => ls.filter((l) => l.id !== id));
      toast.success('Log deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete log.');
    }
  };

  const handleCancelRemove = () => {
    setConfirmingLogId(null);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-baseline">
          <h1 className="text-2xl font-bold">Philanthropy Logs</h1>
          <span className="text-lg font-medium">
            Total: {totalHours} hrs
          </span>
        </div>

        <Link
          to="/philanthropy/new"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Log Hours
        </Link>

        {logs.length === 0 ? (
          <p className="text-gray-600">No logs yet.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border p-4 rounded shadow-sm space-y-2"
              >
                <p className="font-medium">{log.organization}</p>
                <p className="text-sm text-gray-700">
                  {new Date(log.date).toLocaleDateString()} — {log.hours} hrs
                </p>
                {log.notes && <p className="text-sm">{log.notes}</p>}
                <button
                  onClick={() => beginRemove(log.id)}
                  className="text-red-600 hover:underline text-sm mt-2"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Confirmation Modal for deleting a log */}
        {confirmingLogId !== null && (
          <ConfirmModal
            title="Delete Log"
            message="Are you sure you want to permanently delete this log?"
            onConfirm={handleConfirmRemove}
            onCancel={handleCancelRemove}
          />
        )}
      </div>
    </Layout>
  );
}
