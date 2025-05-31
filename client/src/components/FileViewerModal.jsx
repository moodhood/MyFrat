// src/components/FileViewerModal.jsx

import React from 'react';
import FileViewer from 'react-file-viewer';

export default function FileViewerModal({ fileType, filePath, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg overflow-auto shadow-lg w-[90vw] h-[90vh] max-w-4xl max-h-[80vh] relative p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-gray-900"
          title="Close preview"
        >
          &times;
        </button>

        <div className="w-full h-full">
          <FileViewer
            fileType={fileType}
            filePath={filePath}
            onError={(e) => {
              console.error('Error loading file:', e);
            }}
          />
        </div>
      </div>
    </div>
  );
}
