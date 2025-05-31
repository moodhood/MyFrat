// src/components/PreviewModal.jsx

import React from 'react';

export default function PreviewModal({ fileUrl, fileName, onClose }) {
  // Determine file extension (e.g., "pdf", "docx", "png", etc.)
  const ext = fileName.split('.').pop().toLowerCase();

  // Flag checks for different file types
  const isPDF = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
  const isOffice = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext);

  // Choose what to render based on extension
  let viewerElement;
  if (isPDF) {
    // Directly embed PDF in an iframe
    viewerElement = (
      <iframe
        src={fileUrl}
        title="PDF Preview"
        className="w-full h-full"
        frameBorder="0"
      />
    );
  } else if (isImage) {
    // Render images with an <img> tag
    viewerElement = (
      <img
        src={fileUrl}
        alt="Preview"
        className="max-w-full max-h-full object-contain"
      />
    );
  } else if (isVideo) {
    // Render videos with a <video> tag
    viewerElement = (
      <video controls className="max-w-full max-h-full">
        <source src={fileUrl} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
    );
  } else if (isOffice) {
    // For Office docs, attempt to embed via Office Online (only works if URL is public HTTPS)
    if (fileUrl.startsWith('https://')) {
      const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        fileUrl
      )}`;
      viewerElement = (
        <iframe
          src={embedUrl}
          title="Office Preview"
          className="w-full h-full"
          frameBorder="0"
        />
      );
    } else {
      // If not publicly hosted (e.g. localhost), fall back to a download link
      viewerElement = (
        <div className="p-4 text-center">
          <p className="mb-2">Cannot preview Office document locally.</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download {fileName}
          </a>
        </div>
      );
    }
  } else {
    // Fallback for other file types (text, CSV, unknown)
    viewerElement = (
      <div className="p-4 text-center">
        <p className="mb-2">Preview not supported for this file type.</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
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
        className="bg-white rounded-lg overflow-hidden shadow-lg w-[90vw] h-[90vh] max-w-4xl max-h-[80vh] relative p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl text-gray-600 hover:text-gray-900"
          title="Close preview"
        >
          &times;
        </button>
        <div className="w-full h-full flex items-center justify-center">
          {viewerElement}
        </div>
      </div>
    </div>
  );
}
