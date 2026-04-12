import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/admin.api.js';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 401) {
        setError('Invalid username or password.');
      } else if (status === 404) {
        setError('API Endpoint not found (404). Check Vercel configuration.');
      } else {
        setError(`Connection failed (${status || 'Network Error'}). ${serverMsg || 'Please ensure Environment Variables are set in Vercel.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-8">
          <img src="/icon-512.png" alt="Bungoma National Polytechnic" className="w-24 h-24 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-bold text-green-900 mb-2">Admin Portal</h1>
          <p className="text-slate-600">Please sign in to access the verification dashboard</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-2xl overflow-hidden relative border border-slate-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-700"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg text-red-600 text-sm font-medium border border-red-100 italic">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-green-800 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In Now'}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center pt-6 border-t border-slate-200">
          <p className="text-slate-500 text-sm">
            Please contact the Super Admin if you forgot your password.
          </p>
          <Link to="/" className="inline-block mt-4 text-green-700 hover:text-green-800 transition-colors text-sm font-medium">
            &larr; Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
