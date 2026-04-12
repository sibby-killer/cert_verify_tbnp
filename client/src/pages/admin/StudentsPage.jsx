import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/admin.api.js';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', regNumber: '', email: '' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const role = token ? JSON.parse(atob(token.split('.')[1])).role : 'admin';
  const isSuperadmin = role === 'superadmin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setError('');
    setIsEdit(false);
    setNewStudent({ name: '', regNumber: '', email: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (student) => {
    setError('');
    setIsEdit(true);
    setCurrentId(student.id);
    setNewStudent({ name: student.name, regNumber: student.regNumber, email: student.email });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete student. " + (err.response?.data?.message || ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (isEdit) {
        res = await updateStudent(currentId, newStudent);
      } else {
        res = await createStudent(newStudent);
      }
      
      if (res.success) {
        setShowModal(false);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Only Super Admins can modify students.');
      } else {
        setError('Failed to process student. Reg number may already exist.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Students Registry" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-green-900">Manage Students</h2>
            {isSuperadmin && (
              <button 
                onClick={handleOpenCreate}
                className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-800 transition-all"
              >
                Add New Student
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Name</th>
                  <th className="px-8 py-5">Registration No.</th>
                  <th className="px-8 py-5">Email Address</th>
                  <th className="px-8 py-5">Registration Date</th>
                  {isSuperadmin && <th className="px-8 py-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={isSuperadmin ? 5 : 4} className="px-8 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-800">{student.name}</td>
                      <td className="px-8 py-5 font-mono text-xs text-slate-500">{student.regNumber}</td>
                      <td className="px-8 py-5 text-sm text-slate-600">{student.email}</td>
                      <td className="px-8 py-5 text-sm text-slate-400">{new Date(student.createdAt).toLocaleDateString()}</td>
                      {isSuperadmin && (
                        <td className="px-8 py-5 text-right space-x-3">
                          <button onClick={() => handleOpenEdit(student)} className="text-sm font-bold text-green-700 hover:text-green-800">Edit</button>
                          <button onClick={() => handleDelete(student.id)} className="text-sm font-bold text-red-600 hover:text-red-700">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isSuperadmin ? 5 : 4} className="px-8 py-20 text-center text-slate-400 italic">No student records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{isEdit ? 'Edit Student Details' : 'Register Student'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Registration Number</label>
                <input 
                  type="text" 
                  value={newStudent.regNumber}
                  onChange={(e) => setNewStudent({...newStudent, regNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                  placeholder="e.g. BNP/2026/001"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm italic">{error}</p>}
              <div className="flex space-x-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-2 bg-green-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-800"
                >
                  {isEdit ? 'Save Changes' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
