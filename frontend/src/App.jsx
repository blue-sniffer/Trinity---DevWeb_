import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ProductManagement from './pages/ProductManagement'
import Navbar from './components/Navbar'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/dashboard" replace />
    } else {
      return <Navigate to="/customer" replace />
    }
  }

  return children
}

function App() {
  const token = localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')

  return (
    <Router>
      {token && <Navbar />}
      <Routes>
        {/* Login - Always accessible */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard - Only for admins */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Products - Only for admins */}
        <Route
          path="/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <ProductManagement />
            </ProtectedRoute>
          }
        />

        {/* Customer Dashboard - Only for customers */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customers Management - Only for admins (TODO) */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredRole="admin">
              <div className="page-placeholder">
                <h2>👥 Customer Management</h2>
                <p>Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Invoices Management - Only for admins (TODO) */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute requiredRole="admin">
              <div className="page-placeholder">
                <h2>🧾 Invoice Management</h2>
                <p>Coming soon...</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Root redirect based on user role */}
        <Route
          path="/"
          element={
            token ? (
              userRole === 'admin' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/customer" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
