import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SetupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/admin/setup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      alert('Admin account created! Please log in.');
      navigate('/admin/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed. Database may already have users.');
    } finally {
      setLoading(false);
    }
  };

    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-700"></div>
        <div className="text-center mb-8">
          <img src="/icon-512.png" alt="Bungoma National Polytechnic" className="w-24 h-24 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-bold text-green-900 mb-2">Setup Admin</h1>
          <p className="text-slate-600">Initialize the first administrator account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 mt-4 shadow-xl"
          >
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-200">
          <Link to="/admin/auth/login" className="text-green-700 hover:text-green-800 transition-colors text-sm font-medium">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
