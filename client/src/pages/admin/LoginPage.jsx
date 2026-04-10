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
        setError(res.message);
      }
    } catch (err) {
      setError('Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#C9A84C] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
            <span className="text-slate-900 font-black text-3xl">BNP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400">Please sign in to access the verification dashboard</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#C9A84C]"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none transition-all font-medium"
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
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In Now'}
            </button>
          </form>
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/" className="text-slate-500 hover:text-[#C9A84C] transition-colors font-semibold">
            &larr; Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
