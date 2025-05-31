// src/components/ConfirmModal.jsx
import React from 'react';

export default function ConfirmModal({ 
  title = 'Confirm', 
  message = 'Are you sure?', 
  onConfirm, 
  onCancel 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
