// src/pages/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/documents', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error('Failed to load documents.');
        }
        const data = await res.json();
        if (Array.isArray(data)) setDocs(data);
        else if (Array.isArray(data.documents)) setDocs(data.documents);
        else if (Array.isArray(data.docs)) setDocs(data.docs);
        else setDocs([]);
      } catch (err) {
        console.error(err);
        setDocs([]);
        toast.error(err.message || 'Error loading documents.');
      }
    };
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Upload failed.');
      }

      setDocs((prev) =>
        Array.isArray(prev) ? [payload, ...prev] : [payload]
      );
      setFile(null);
      setCategory('');
      e.target.reset();
      toast.success('Document uploaded successfully.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Chapter Documents</h1>

        <form
          onSubmit={handleUpload}
          className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4"
        >
          <h2 className="text-lg font-semibold">Upload New Document</h2>

          <div className="space-y-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-600"
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. Budget, Forms)"
              className="w-full p-2 border rounded focus:outline-none focus:ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 rounded text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Uploading…' : 'Upload Document'}
          </button>
        </form>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3">Download</th>
              </tr>
            </thead>
            <tbody>
              {docs.length ? (
                docs.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 truncate max-w-xs">{doc.name}</td>
                    <td className="p-3">{doc.category || '—'}</td>
                    <td className="p-3">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <a
                        href={`http://localhost:3000${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="p-6 text-center text-gray-500"
                  >
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
