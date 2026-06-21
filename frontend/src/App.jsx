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

// ----- ADMIN PAGE (Tabbed: Policies + Appeals + Analytics) -----
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AdminPage({ user, logout }) {
  const [activeTab, setActiveTab] = useState('policies');
  const token = localStorage.getItem('token');

  // ========== 1. POLICIES STATE & LOGIC ==========
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [saving, setSaving] = useState({});
  const [message, setMessage] = useState(null);

  // ========== 2. APPEALS STATE & LOGIC ==========
  const [appeals, setAppeals] = useState([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [adminResponse, setAdminResponse] = useState({});

  // ========== 3. ANALYTICS STATE & LOGIC ==========
  const [analytics, setAnalytics] = useState(null);
  const [userRanking, setUserRanking] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const COLORS = ['#4F46E5', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899'];

  // Fetch Policies
  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/admin/policies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolicies(res.data);
    } catch (err) {
      setMessage({ text: 'Failed to load policies', type: 'error' });
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch Appeals
  const fetchAppeals = async (status = 'Pending') => {
    setLoadingAppeals(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/admin/appeals?status_filter=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppeals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppeals(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [overviewRes, rankingRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/admin/analytics/overview', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://127.0.0.1:8000/api/admin/analytics/user-ranking', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAnalytics(overviewRes.data);
      setUserRanking(rankingRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'policies') {
      fetchPolicies();
    } else if (activeTab === 'appeals') {
      fetchAppeals('Pending');
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Policy Update Handler
  const handlePolicyUpdate = async (category, updatedData) => {
    setSaving(prev => ({ ...prev, [category]: true }));
    setMessage(null);
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/policies/${encodeURIComponent(category)}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolicies(prev => prev.map(p => p.category === category ? { ...p, ...updatedData } : p));
      setMessage({ text: `✅ Policy for '${category}' updated!`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: `❌ Failed to update '${category}'`, type: 'error' });
    } finally {
      setSaving(prev => ({ ...prev, [category]: false }));
    }
  };

  const handlePolicyChange = (category, field, value) => {
    setPolicies(prev => prev.map(p => p.category === category ? { ...p, [field]: value } : p));
  };

  // Appeal Review Handler
  const handleReviewAppeal = async (appealId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this appeal?`)) return;
    setReviewing(appealId);
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/appeals/${appealId}/review`, {
        status: status,
        admin_response: adminResponse[appealId] || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ Appeal ${status} successfully!`);
      fetchAppeals('Pending');
      setAdminResponse(prev => ({ ...prev, [appealId]: '' }));
    } catch (err) {
      alert('❌ Failed to review appeal: ' + (err.response?.data?.detail || 'Server error'));
    } finally {
      setReviewing(null);
    }
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
          
          <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
            <p className="text-lg">Welcome, Admin <span className="font-semibold">{user?.name}</span>!</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 px-4">
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'policies' 
                  ? 'border-blue-600 text-blue-700 bg-white -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Policies
            </button>
            <button
              onClick={() => setActiveTab('appeals')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'appeals' 
                  ? 'border-blue-600 text-blue-700 bg-white -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📬 Appeals Queue
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'analytics' 
                  ? 'border-blue-600 text-blue-700 bg-white -mb-px' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {message && activeTab === 'policies' && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {message.text}
              </div>
            )}

            {/* ==================== TAB 1: POLICIES ==================== */}
            {activeTab === 'policies' && (
              <>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">⚙️ Moderation Policies</h2>
                {loadingPolicies ? (
                  <p className="text-gray-400">Loading policies...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {policies.map((policy) => (
                      <div key={policy.category} className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-800 text-lg mb-4 border-b pb-2">{policy.category}</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Status</span>
                            <button
                              onClick={() => handlePolicyChange(policy.category, 'isEnabled', !policy.isEnabled)}
                              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                policy.isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                                policy.isEnabled ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm font-medium text-gray-700">Threshold</label>
                              <span className="text-sm font-bold text-blue-600">{policy.threshold}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={policy.threshold}
                              onChange={(e) => handlePolicyChange(policy.category, 'threshold', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              disabled={!policy.isEnabled}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Enforcement Action</label>
                            <select
                              value={policy.enforcement}
                              onChange={(e) => handlePolicyChange(policy.category, 'enforcement', e.target.value)}
                              className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !policy.isEnabled ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={!policy.isEnabled}
                            >
                              <option value="Auto-Block">🚫 Auto-Block</option>
                              <option value="Flag-for-Review">🚩 Flag for Review</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handlePolicyUpdate(policy.category, {
                              isEnabled: policy.isEnabled,
                              threshold: policy.threshold,
                              enforcement: policy.enforcement
                            })}
                            disabled={saving[policy.category]}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-50 text-sm mt-2"
                          >
                            {saving[policy.category] ? 'Saving...' : '💾 Save Changes'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ==================== TAB 2: APPEALS ==================== */}
            {activeTab === 'appeals' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-700">📬 Appeals Queue</h2>
                  <button
                    onClick={() => fetchAppeals('Pending')}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition"
                  >
                    🔄 Refresh
                  </button>
                </div>
                
                {loadingAppeals ? (
                  <p className="text-gray-400">Loading appeals...</p>
                ) : appeals.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <p className="text-gray-500 text-lg">🎉 No pending appeals!</p>
                    <p className="text-gray-400 text-sm">All appeals have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appeals.map((appeal) => (
                      <div key={appeal.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{appeal.id.substring(0, 12)}...</span>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">Pending</span>
                            </div>
                            <p className="font-semibold text-gray-700">{appeal.user_email}</p>
                            <p className="text-sm text-gray-600 mt-1">📝 <span className="font-medium">Justification:</span> {appeal.justification}</p>
                            <p className="text-xs text-gray-400 mt-1">Submission ID: {appeal.submission_id}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                            <div className="w-full sm:w-64">
                              <input
                                type="text"
                                placeholder="Admin response (optional)"
                                value={adminResponse[appeal.id] || ''}
                                onChange={(e) => setAdminResponse(prev => ({ ...prev, [appeal.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={reviewing === appeal.id}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewAppeal(appeal.id, 'Accepted')}
                                disabled={reviewing === appeal.id}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-4 rounded-lg transition text-sm disabled:opacity-50"
                              >
                                {reviewing === appeal.id ? '...' : '✅ Accept'}
                              </button>
                              <button
                                onClick={() => handleReviewAppeal(appeal.id, 'Rejected')}
                                disabled={reviewing === appeal.id}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 rounded-lg transition text-sm disabled:opacity-50"
                              >
                                {reviewing === appeal.id ? '...' : '❌ Reject'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ==================== TAB 3: ANALYTICS ==================== */}
            {activeTab === 'analytics' && (
              <>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">📊 Platform Analytics</h2>
                
                {loadingAnalytics ? (
                  <p className="text-gray-400">Loading analytics...</p>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                        <p className="text-sm text-blue-600 font-medium">Total Submissions</p>
                        <p className="text-3xl font-bold text-blue-800">{analytics?.total_submissions || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                        <p className="text-sm text-yellow-600 font-medium">Total Appeals</p>
                        <p className="text-3xl font-bold text-yellow-800">{analytics?.appeals?.total || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                        <p className="text-sm text-green-600 font-medium">Accepted Appeals</p>
                        <p className="text-3xl font-bold text-green-800">{analytics?.appeals?.accepted || 0}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                        <p className="text-sm text-red-600 font-medium">Rejected Appeals</p>
                        <p className="text-3xl font-bold text-red-800">{analytics?.appeals?.rejected || 0}</p>
                      </div>
                    </div>

                    {/* Chart & Table Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pie Chart: Verdict Distribution */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">📊 Verdict Distribution</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={analytics?.verdict_distribution || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={2}
                              dataKey="count"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(analytics?.verdict_distribution || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* User Ranking Table */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">🏆 Top Users</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200">
                                <th className="pb-2 font-medium">User</th>
                                <th className="pb-2 font-medium text-center">Submissions</th>
                                <th className="pb-2 font-medium text-center">Violations</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userRanking.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="py-4 text-center text-gray-400">No data</td>
                                </tr>
                              ) : (
                                userRanking.map((u, idx) => (
                                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                                    <td className="py-2 text-gray-700 truncate max-w-[120px]">{u.user_email}</td>
                                    <td className="py-2 text-center font-medium">{u.submission_count}</td>
                                    <td className="py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                        u.violation_count > 3 ? 'bg-red-100 text-red-700' : 
                                        u.violation_count > 0 ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {u.violation_count}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
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