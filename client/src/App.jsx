// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages
import ConfirmEmail from './pages/ConfirmEmail';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

// Member-only Pages
import DashboardRedirect from './pages/Dashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import Duties from './pages/Duties';
import NewDuty from './pages/NewDuty';
import Events from './pages/Events';
import NewEvent from './pages/NewEvent';
import Members from './pages/Members';
import MemberProfile from './pages/MemberProfile';
import Motions from './pages/Motions';
import NewMotion from './pages/NewMotion';
import MotionDetail from './pages/MotionDetail';
import Philanthropy from './pages/Philanthropy';
import NewLog from './pages/NewLog';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

// File System Page (Documents)
import FileSystemPage from './pages/FileSystemPage';

// Roles & Permissions Page
import Roles from './pages/Roles';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast container for global notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/confirm" element={<ConfirmEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Dashboard Redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Officer / Member Dashboards */}
          <Route
            path="/dashboard/officer"
            element={
              <ProtectedRoute>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/member"
            element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          {/* Duties */}
          <Route
            path="/duties"
            element={
              <ProtectedRoute>
                <Duties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/duties/new"
            element={
              <ProtectedRoute>
                <NewDuty />
              </ProtectedRoute>
            }
          />

          {/* Events */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <NewEvent />
              </ProtectedRoute>
            }
          />

          {/* Members */}
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members/:id"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />

          {/* Motions */}
          <Route
            path="/motions"
            element={
              <ProtectedRoute>
                <Motions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/motions/new"
            element={
              <ProtectedRoute>
                <NewMotion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/motions/:id"
            element={
              <ProtectedRoute>
                <MotionDetail />
              </ProtectedRoute>
            }
          />

          {/* Philanthropy */}
          <Route
            path="/philanthropy"
            element={
              <ProtectedRoute>
                <Philanthropy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/philanthropy/new"
            element={
              <ProtectedRoute>
                <NewLog />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* File System (Documents) */}
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <FileSystemPage />
              </ProtectedRoute>
            }
          />

          {/* Roles & Permissions */}
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
