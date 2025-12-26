import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import OwnerDashboard from '@/pages/OwnerDashboard';
import FarmerDashboard from '@/pages/FarmerDashboard';
import SubscriberDashboard from '@/pages/SubscriberDashboard';
import '@/App.css';

const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f1e8]">
        <div className="text-xl text-[#2d5016]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on role
  if (user.role === 'owner') {
    return <OwnerDashboard />;
  } else if (user.role === 'farmer') {
    return <FarmerDashboard />;
  } else if (user.role === 'subscriber') {
    return <SubscriberDashboard />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center bg-[#f5f1e8]">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-[#2d5016] mb-4">Access Denied</h1>
                    <p className="text-[#5a7c3b] mb-8">You don't have permission to access this page.</p>
                    <a href="/dashboard" className="text-[#558b2f] hover:underline font-medium">
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
