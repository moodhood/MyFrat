// src/components/PreviewModal.jsx

import React from 'react';

export default function PreviewModal({ originalUrl, pdfUrl, fileName, onClose }) {
  // Extract file extension (e.g. "pdf", "docx", "png", etc.)
  const ext = fileName.split('.').pop().toLowerCase();
  const isPDF   = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

  let viewerElement;

  if (pdfUrl) {
    // If a server-generated PDF exists, embed that
    viewerElement = (
      <iframe
        src={pdfUrl}
        title="PDF Preview"
        className="w-full h-full"
        frameBorder="0"
      />
    );
  } else if (isPDF) {
    // Directly embed the file if it’s already a PDF
    viewerElement = (
      <iframe
        src={originalUrl}
        title="PDF Preview"
        className="w-full h-full"
        frameBorder="0"
      />
    );
  } else if (isImage) {
    // Images can be displayed inline
    viewerElement = (
      <img
        src={originalUrl}
        alt="Preview"
        className="max-w-full max-h-full object-contain"
      />
    );
  } else if (isVideo) {
    // Videos can use an HTML5 video tag
    viewerElement = (
      <video controls className="max-w-full max-h-full">
        <source src={originalUrl} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
    );
  } else {
    // Fallback for unsupported previews (e.g. .docx without a PDF)
    viewerElement = (
      <div className="p-6 text-center">
        <p className="mb-4 text-lg font-medium">
          Preview not supported for “{fileName}”
        </p>
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download {fileName}
        </a>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg overflow-hidden shadow-lg w-[90vw] h-[90vh] max-w-4xl max-h-[80vh] relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* — Header with Close Button — */}
        <div className="flex justify-end bg-gray-100 p-2">
          <button
            onClick={onClose}
            className="text-2xl text-gray-600 hover:text-gray-900"
            title="Close preview"
          >
            &times;
          </button>
        </div>

        {/* — Main Content Area — */}
        <div className="flex-1 overflow-auto">{viewerElement}</div>
      </div>
    </div>
  );
}
