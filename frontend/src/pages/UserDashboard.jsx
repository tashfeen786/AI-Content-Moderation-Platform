import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <p className="text-lg">Welcome, <span className="font-semibold">{user?.name}</span>!</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        <hr className="my-4" />
        <p className="text-gray-500">Image Upload UI and History will go here.</p>
      </div>
    </div>
  );
};

export default UserDashboard;