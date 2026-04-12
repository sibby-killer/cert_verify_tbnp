import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getUsers, createUser } from '../../services/admin.api.js';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'admin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users. Are you a super admin?');
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await createUser(formData);
      if (res.success) {
        setSuccess('User created successfully');
        setFormData({ username: '', email: '', password: '', role: 'admin' });
        loadUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Users & Roles" />
        <main className="p-8">
          
          <div className="flex gap-8">
            <div className="w-1/3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-xl font-bold text-green-900 mb-6">Create Admin</h2>
                
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">{error}</div>}
                {success && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm mb-4">{success}</div>}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Scope</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-700 outline-none bg-white">
                      <option value="data_entry">Data Entry (Read/Issue)</option>
                      <option value="admin">Administrator</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-all mt-4">
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </form>
              </div>
            </div>

            <div className="w-2/3">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-green-900">Manage Users</h2>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Username</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="4" className="text-center p-8 text-slate-400">Loading...</td></tr>
                    ) : users.map(user => (
                      <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-700">{user.username}</td>
                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role==='superadmin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
