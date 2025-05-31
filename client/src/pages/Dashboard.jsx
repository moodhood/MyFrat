// src/pages/Dashboard.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:3000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user info');
        return res.json();
      })
      .then((user) => {
        const isOfficer = user?.role?.permissions?.includes('assign_duties');
        if (isOfficer) {
          navigate('/dashboard/officer');
        } else {
          navigate('/dashboard/member');
        }
      })
      .catch((err) => {
        console.error('Dashboard redirect error:', err);
        navigate('/login');
      });
  }, [navigate]);

  return (
    <div className="p-6 text-center text-gray-600">
      Redirecting to your dashboard...
    </div>
  );
}
