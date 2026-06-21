import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminPanel from './pages/AdminPanel';

// Private Route Component
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute adminOnly={true}>
              <AdminPanel />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;