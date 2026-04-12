import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../services/admin.api.js';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newCourse, setNewCourse] = useState({ name: '', department: '', duration: '2 Years' });
  const [error, setError] = useState('');
  
  const token = localStorage.getItem('token');
  const role = token ? JSON.parse(atob(token.split('.')[1])).role : 'admin';
  const isSuperadmin = role === 'superadmin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setError('');
    setIsEdit(false);
    setNewCourse({ name: '', department: '', duration: '2 Years' });
    setShowModal(true);
  };

  const handleOpenEdit = (course) => {
    setError('');
    setIsEdit(true);
    setCurrentId(course.id);
    setNewCourse({ name: course.name, department: course.department, duration: course.duration });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await deleteCourse(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete course. " + (err.response?.data?.message || ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (isEdit) {
        res = await updateCourse(currentId, newCourse);
      } else {
        res = await createCourse(newCourse);
      }
      
      if (res.success) {
        setShowModal(false);
        fetchData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Only Super Admins can modify courses.');
      } else {
        setError('Operation failed.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Academic Programs" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-green-900">Manage Courses</h2>
            {isSuperadmin && (
              <button 
                onClick={handleOpenCreate}
                className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-800 transition-all"
              >
                Add New Course
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              </div>
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C9A84C] bg-amber-50 px-2 py-1 rounded-lg">
                      {course.duration}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{course.name}</h3>
                  <p className="text-sm text-slate-400 font-medium mb-4">{course.department}</p>
                  
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-mono">ID: {course.id.substring(0,8)}</span>
                    {isSuperadmin && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleDelete(course.id)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
                        <button onClick={() => handleOpenEdit(course)} className="text-xs font-bold text-green-700 hover:underline">Edit</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-100">
                No course programs registered yet.
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{isEdit ? 'Edit Academic Program' : 'Create Academic Program'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course Name</label>
                <input 
                  type="text" 
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                  placeholder="e.g. Diploma in IT"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
                <input 
                  type="text" 
                  value={newCourse.department}
                  onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700" 
                  placeholder="e.g. Computing & Informatics"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Duration</label>
                <select 
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-green-700 bg-white"
                >
                  <option>1 Year</option>
                  <option>2 Years</option>
                  <option>3 Years</option>
                  <option>4 Years</option>
                </select>
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
                  {isEdit ? 'Save Changes' : 'Register Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
