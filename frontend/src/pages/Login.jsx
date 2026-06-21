import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { access_token, user } = res.data;
      login(access_token, user);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Login</button>
        </form>
        <p className="text-center mt-4 text-sm">Don't have an account? <Link to="/register" className="text-blue-600">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;