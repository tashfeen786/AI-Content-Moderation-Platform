import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <p className="text-lg">Welcome, <span className="font-semibold">{user?.name}</span>!</p>
        <p>Email: {user?.email}</p>
        <p>Role: <span className="font-bold text-purple-600">{user?.role}</span></p>
        <hr className="my-4" />
        <p className="text-gray-500">Policy Management, Appeals Queue, and Analytics Charts will go here.</p>
      </div>
    </div>
  );
};

export default AdminPanel;