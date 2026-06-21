import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">Registration successful! Redirecting to login...</div>}
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Register</button>
        </form>
        <p className="text-center mt-4 text-sm">Already have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;