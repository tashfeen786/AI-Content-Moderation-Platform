import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';

// ----- LOGIN PAGE -----
function LoginPage({ setIsAuthenticated, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login', {
        email,
        password
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.detail || 'Invalid credentials');
      } else {
        setError('Cannot connect to server. Make sure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition">
              Create one
            </a>
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
          <p className="text-xs text-gray-400">Demo: tashfeen@example.com / test123</p>
        </div>
      </div>
    </div>
  );
}

// ----- DASHBOARD PAGE (User) with Persistent History -----
function DashboardPage({ user, logout }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const token = localStorage.getItem('token');

  // Fetch ALL submissions from backend on page load
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/submissions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load history when component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      alert('Please select at least one image.');
      return;
    }

    setUploading(true);
    setUploadResponse(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/submissions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setUploadResponse(response.data);
      alert(`✅ Upload successful! Submission ID: ${response.data.submission_id}`);
      
      // Refresh history after 3 seconds (allow backend screening)
      setTimeout(fetchHistory, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Upload failed: ' + (error.response?.data?.detail || 'Server error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">User Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
          
          {/* User Info */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-lg">Welcome, <span className="font-semibold">{user?.name}</span>!</p>
            <p className="text-gray-600">Role: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{user?.role}</span></p>
          </div>

          {/* Upload Section */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📤 Upload Images for Moderation</h2>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-400 mt-1">You can select multiple images (Max 5).</p>
              </div>
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Submit for Moderation'}
              </button>
            </form>
            {uploadResponse && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">✅ Submission ID: <span className="font-mono">{uploadResponse.submission_id}</span></p>
                <p className="text-green-600 text-xs">Status: {uploadResponse.status}</p>
              </div>
            )}
          </div>

          {/* History Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4">📋 Submission History</h2>
            {loadingHistory ? (
              <p className="text-gray-400">Loading history...</p>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.submission_id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm text-gray-600">{item.submission_id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      {item.images?.map((img) => (
                        <span key={img.id} className={`inline-block mr-2 px-2 py-1 rounded text-xs ${
                          img.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          img.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {img.filename}: {img.status}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No submissions found. Upload an image to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- ADMIN PAGE -----
function AdminPage({ user, logout }) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
          <div className="bg-purple-50 rounded-xl p-6">
            <p className="text-lg">Welcome, Admin <span className="font-semibold">{user?.name}</span>!</p>
            <p className="text-gray-600 mt-2">Email: {user?.email}</p>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-600">Policy Config</p>
              <p className="text-2xl font-bold text-blue-800">Coming Soon</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="text-sm text-green-600">Appeals Queue</p>
              <p className="text-2xl font-bold text-green-800">Coming Soon</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <p className="text-sm text-orange-600">Analytics</p>
              <p className="text-2xl font-bold text-orange-800">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- MAIN APP -----
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
          ) : (
            <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated && user?.role === 'user' ? (
            <DashboardPage user={user} logout={logout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          isAuthenticated && user?.role === 'admin' ? (
            <AdminPage user={user} logout={logout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} 
      />
    </Routes>
  );
}

export default App;