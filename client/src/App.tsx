import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User pages
import Dashboard from './pages/user/Dashboard';
import Jobs from './pages/user/Jobs';
import JobDetails from './pages/user/JobDetails';
import Applications from './pages/user/Applications';
import Resume from './pages/user/Resume';
import Profile from './pages/user/Profile';
import Subscription from './pages/user/Subscription';
import Payment from './pages/user/Payment';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminAnalytics from './pages/admin/Analytics';

// Public pages
import Landing from './pages/Landing';
import Logout from './pages/auth/Logout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/logout" element={<Logout />} />

                {/* Protected user routes */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="jobs/:id" element={<JobDetails />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="resume" element={<Resume />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="subscription/success" element={<Payment />} />
                  <Route path="subscription/cancel" element={<Payment />} />
                </Route>

                {/* Protected admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
