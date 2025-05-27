// src/App.jsx

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

import Register        from './pages/Register'
import Login           from './pages/Login'
import Profile         from './pages/Profile'
import Events          from './pages/Events'
import NewEvent        from './pages/NewEvent'
import Duties          from './pages/Duties'
import NewDuty         from './pages/NewDuty'
import Philanthropy    from './pages/Philanthropy'
import NewLog          from './pages/NewLog'
import Dashboard       from './pages/Dashboard'
import Members         from './pages/Members'
import MemberProfile   from './pages/MemberProfile'
import Motions         from './pages/Motions'
import MotionDetail    from './pages/MotionDetail'
import NewMotion       from './pages/NewMotion'
import EditProfile from './pages/EditProfile'


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login"    element={<Login />} />

          {/* Protected Routes */}
          <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/events"            element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/new"        element={<ProtectedRoute><NewEvent /></ProtectedRoute>} />
          <Route path="/duties"            element={<ProtectedRoute><Duties /></ProtectedRoute>} />
          <Route path="/duties/new"        element={<ProtectedRoute><NewDuty /></ProtectedRoute>} />
          <Route path="/philanthropy"      element={<ProtectedRoute><Philanthropy /></ProtectedRoute>} />
          <Route path="/philanthropy/new"  element={<ProtectedRoute><NewLog /></ProtectedRoute>} />
          <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/members"           element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/members/:id"       element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/motions"           element={<ProtectedRoute><Motions /></ProtectedRoute>} />
          <Route path="/motions/new"       element={<ProtectedRoute><NewMotion /></ProtectedRoute>} />
          <Route path="/motions/:id"       element={<ProtectedRoute><MotionDetail /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/profile" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
