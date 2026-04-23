import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/admin.api.js';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', regNumber: '', email: '', gender: '', yearStarted: '' });
  const [error, setError] = useState('');
  
  // Search and Sort State
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Bulk Upload State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsv, setBulkCsv] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  const token = localStorage.getItem('token');
  const role = token ? JSON.parse(atob(token.split('.')[1])).role : 'admin';
  const isSuperadmin = role === 'superadmin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ search, sort, order, page, limit: 25 });
      setStudents(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, sort, order, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setError('');
    setIsEdit(false);
    setNewStudent({ name: '', regNumber: '', email: '', gender: '', yearStarted: new Date().getFullYear() });
    setShowModal(true);
  };

  const handleOpenEdit = (student) => {
    setError('');
    setIsEdit(true);
    setCurrentId(student.id);
    setNewStudent({ 
      name: student.name, 
      regNumber: student.regNumber, 
      email: student.email,
      gender: student.gender || '',
      yearStarted: student.yearStarted || ''
    });
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
    
    // Convert yearStarted to number for the API
    const studentData = {
      ...newStudent,
      yearStarted: newStudent.yearStarted ? parseInt(newStudent.yearStarted) : null
    };

    try {
      let res;
      if (isEdit) {
        res = await updateStudent(currentId, studentData);
      } else {
        res = await createStudent(studentData);
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
        setError(err.response?.data?.message || 'Failed to process student.');
      }
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult(null);

    try {
      const res = await fetch(`/api/v1/students?mode=bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csv: bulkCsv })
      });

      const data = await res.json();

      if (data.success) {
        setBulkResult(data);
        fetchData();
      } else {
        setBulkError(data.message || 'Bulk upload failed');
      }
    } catch (err) {
      setBulkError('Bulk upload failed');
    }
  };

  const downloadTemplate = () => {
    const template = "name,regNumber,email,gender,yearStarted\nJohn Doe,BNP/2026/001,john@example.com,male,2022";
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'students_template.csv';
    link.click();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Students Registry" />
        <main className="p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-4">Manage Students</h2>
              <div className="flex space-x-4">
                {/* Search Input */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search by name or reg..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700 w-64 text-sm"
                  />
                  <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Sort Dropdown */}
                <select 
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700 text-sm bg-white"
                >
                  <option value="name">Sort by Name</option>
                  <option value="regNumber">Sort by Reg No</option>
                  <option value="gender">Sort by Gender</option>
                  <option value="yearStarted">Sort by Year</option>
                  <option value="createdAt">Sort by Date Added</option>
                </select>

                <select 
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700 text-sm bg-white"
                >
                  {sort === 'gender' ? (
                    <>
                      <option value="asc">Male First</option>
                      <option value="desc">Female First</option>
                    </>
                  ) : (
                    <>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {isSuperadmin && (
              <div className="flex space-x-3">
                <button 
                  onClick={handleOpenCreate}
                  className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-800 transition-all"
                >
                  Add Student
                </button>
                <button 
                  onClick={() => {
                    setBulkCsv('');
                    setBulkResult(null);
                    setBulkError('');
                    setShowBulkModal(true);
                  }}
                  className="bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all"
                >
                  Bulk Upload
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Name</th>
                  <th className="px-8 py-5">Registration No.</th>
                  <th className="px-8 py-5">Gender</th>
                  <th className="px-8 py-5">Year Started</th>
                  <th className="px-8 py-5">Registration Date</th>
                  {isSuperadmin && <th className="px-8 py-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={isSuperadmin ? 6 : 5} className="px-8 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-800">{student.name}</td>
                      <td className="px-8 py-5 font-mono text-xs text-slate-500">{student.regNumber}</td>
                      <td className="px-8 py-5 text-sm text-slate-600 capitalize">{student.gender || '—'}</td>
                      <td className="px-8 py-5 text-sm text-slate-600">{student.yearStarted || '—'}</td>
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
                    <td colSpan={isSuperadmin ? 6 : 5} className="px-8 py-20 text-center text-slate-400 italic">No student records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-400">
                Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total} students
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-100 text-slate-600 hover:border-green-700 disabled:opacity-40 transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-100 text-slate-600 hover:border-green-700 disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Bulk Upload Students</h3>

            <button
              onClick={downloadTemplate}
              className="mb-4 text-sm font-bold text-blue-700 underline"
            >
              Download CSV Template
            </button>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                rows={8}
                className="w-full p-4 border border-slate-200 rounded-xl text-sm font-mono"
                placeholder="Paste CSV content here..."
                required
              />

              {bulkError && <p className="text-red-500 text-sm">{bulkError}</p>}

              {bulkResult && (
                <div className="bg-green-50 p-4 rounded-xl text-sm">
                  Inserted: {bulkResult.inserted} <br />
                  Failed: {bulkResult.failed}
                  {bulkResult.errors?.length > 0 && (
                    <div className="mt-2 text-red-600 max-h-32 overflow-y-auto">
                      {bulkResult.errors.map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 text-white px-6 py-2 rounded-xl font-bold"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Registration Number</label>
                  <input 
                    type="text" 
                    value={newStudent.regNumber}
                    onChange={(e) => setNewStudent({...newStudent, regNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                    placeholder="BNP/2026/001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Gender</label>
                  <select 
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Year Started</label>
                  <input 
                    type="number" 
                    value={newStudent.yearStarted}
                    onChange={(e) => setNewStudent({...newStudent, yearStarted: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                    placeholder="2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                    placeholder="john@example.com"
                  />
                </div>
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
