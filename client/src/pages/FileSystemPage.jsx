// src/pages/FileSystemPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import PreviewModal from '../components/PreviewModal';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function FileSystemPage() {
  const { user } = useContext(AuthContext);
  const isOfficer = user?.permissions?.includes('assign_duties');
  const canManageDocs = user?.permissions?.includes('manage_documents');
  const canManageFolders = user?.permissions?.includes('manage_folders') || isOfficer;

  // IDs awaiting delete confirmation
  const [confirmingFolderId, setConfirmingFolderId] = useState(null);
  const [confirmingDocId, setConfirmingDocId] = useState(null);

  // For preview: { originalUrl, pdfUrl, fileName } or null
  const [previewFile, setPreviewFile] = useState(null);

  // Breadcrumb path: array of { id, name }
  const [path, setPath] = useState([{ id: null, name: 'Home' }]);
  const currentFolder = path[path.length - 1];

  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New Folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderError, setNewFolderError] = useState('');

  // Upload File modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false); // NEW: disable repeated clicks

  // Fetch folders & docs when currentFolder.id changes
  useEffect(() => {
    async function fetchContents() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const folderId = currentFolder.id;
        const url =
          folderId !== null
            ? `http://localhost:3000/api/folders/${folderId}`
            : 'http://localhost:3000/api/folders';

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error || 'Failed to fetch contents');
        }
        const { folders: fetchedFolders, documents: fetchedDocs } = await res.json();
        setFolders(fetchedFolders);
        setDocuments(fetchedDocs);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setFolders([]);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, [currentFolder.id]);

  // Enter a subfolder
  const handleEnterFolder = (folder) => {
    setPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  // Navigate via breadcrumb
  const handleBreadcrumbClick = (index) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  // Create new folder under currentFolder.id
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setNewFolderError('');
    if (!newFolderName.trim()) {
      setNewFolderError('Folder name cannot be empty');
      toast.error('Folder name cannot be empty');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder.id,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to create folder');

      setFolders((prev) => [...prev, payload]);
      setNewFolderName('');
      setShowNewFolderModal(false);
      toast.success('Folder created successfully');
    } catch (err) {
      console.error(err);
      setNewFolderError(err.message);
      toast.error(`Could not create folder: ${err.message}`);
    }
  };

  // Upload a file into currentFolder.id
  const handleUploadFile = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!selectedFile) {
      setUploadError('Please select a file');
      toast.error('Please select a file');
      return;
    }

    setUploading(true); // DISABLE further clicks
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory.trim());
      if (currentFolder.id !== null) {
        formData.append('folderId', currentFolder.id);
      }

      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Upload failed');

      setDocuments((prev) => [payload, ...prev]);
      setSelectedFile(null);
      setUploadCategory('');
      setShowUploadModal(false);
      toast.success('File uploaded successfully');
    } catch (err) {
      console.error(err);
      setUploadError(err.message);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Confirm delete a document
  const handleConfirmDeleteDoc = async () => {
    const docId = confirmingDocId;
    setConfirmingDocId(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success('File deleted successfully');
      } else {
        const payload = await res.json();
        throw new Error(payload.error || 'Failed to delete file');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error deleting file: ${err.message}`);
    }
  };
  const handleCancelDeleteDoc = () => {
    setConfirmingDocId(null);
  };

  // Confirm delete a folder
  const handleConfirmDeleteFolder = async () => {
    const folderId = confirmingFolderId;
    setConfirmingFolderId(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        toast.success('Folder deleted successfully');
      } else {
        const payload = await res.json();
        throw new Error(payload.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error deleting folder: ${err.message}`);
    }
  };
  const handleCancelDeleteFolder = () => {
    setConfirmingFolderId(null);
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-sm text-gray-700 mb-4">
          {path.map((p, idx) => (
            <React.Fragment key={p.id ?? 'root'}>
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className="hover:underline focus:outline-none"
              >
                {p.name}
              </button>
              {idx < path.length - 1 && <span className="mx-2 text-gray-400">{'>'}</span>}
            </React.Fragment>
          ))}
        </nav>

        {/* Header + Actions */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {currentFolder.name === 'Home' ? 'All Files' : currentFolder.name}
          </h1>
          {isOfficer && (
            <div className="space-x-2">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + New Folder
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Upload File
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 mb-4">Error: {error}</p>}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Subfolders */}
            {folders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Folders</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="relative p-4 bg-white rounded shadow hover:bg-gray-50 cursor-pointer"
                    >
                      <div
                        className="text-3xl text-yellow-500 text-center"
                        onClick={() => handleEnterFolder(folder)}
                      >
                        📁
                      </div>
                      <div
                        className="mt-2 text-center truncate"
                        onClick={() => handleEnterFolder(folder)}
                      >
                        {folder.name}
                      </div>
                      {canManageFolders && (
                        <button
                          onClick={() => setConfirmingFolderId(folder.id)}
                          className="absolute top-2 left-2 text-red-600 hover:text-red-800 text-xl"
                          title="Delete folder"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Files</h2>
              {documents.length > 0 ? (
                <div className="bg-white rounded shadow overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Uploaded</th>
                        <th className="p-2">Download</th>
                        <th className="p-2">Preview</th>
                        {canManageDocs && <th className="p-2">Delete</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const originalUrl = `http://localhost:3000${doc.url}`;
                        const pdfUrl = doc.pdfUrl ? `http://localhost:3000${doc.pdfUrl}` : null;

                        return (
                          <tr key={doc.id} className="border-t hover:bg-gray-50">
                            <td className="p-2 truncate">{doc.name}</td>
                            <td className="p-2">{doc.category || '—'}</td>
                            <td className="p-2">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <a
                                href={originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600"
                              >
                                Download
                              </a>
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() =>
                                  setPreviewFile({
                                    originalUrl,
                                    pdfUrl,
                                    fileName: doc.name,
                                  })
                                }
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Preview
                              </button>
                            </td>
                            {canManageDocs && (
                              <td className="p-2">
                                <button
                                  onClick={() => setConfirmingDocId(doc.id)}
                                  className="text-red-600 hover:underline text-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No folders or files to display.</p>
              )}
            </div>
          </div>
        )}

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
              {newFolderError && <p className="text-red-600 mb-2">{newFolderError}</p>}
              <form onSubmit={handleCreateFolder} className="space-y-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                  className="w-full p-2 border rounded"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolderModal(false);
                      setNewFolderName('');
                      setNewFolderError('');
                    }}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload File Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Upload File</h3>
              {uploadError && <p className="text-red-600 mb-2">{uploadError}</p>}
              <form onSubmit={handleUploadFile} className="space-y-3">
                <div>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.mp4"
                    className="block mb-2"
                    disabled={uploading} // DISABLE while uploading
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    placeholder="Category (optional)"
                    className="w-full p-2 border rounded"
                    disabled={uploading} // DISABLE while uploading
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setUploadCategory('');
                      setUploadError('');
                    }}
                    className="px-4 py-2 rounded border"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded text-white ${
                      uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Modals */}
      {confirmingDocId && (
        <ConfirmModal
          title="Delete File"
          message="Are you sure you want to permanently delete this file?"
          onConfirm={handleConfirmDeleteDoc}
          onCancel={handleCancelDeleteDoc}
        />
      )}
      {confirmingFolderId && (
        <ConfirmModal
          title="Delete Folder"
          message="Are you sure you want to permanently delete this empty folder?"
          onConfirm={handleConfirmDeleteFolder}
          onCancel={handleCancelDeleteFolder}
        />
      )}

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          originalUrl={previewFile.originalUrl}
          pdfUrl={previewFile.pdfUrl}
          fileName={previewFile.fileName}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </Layout>
  );
}
