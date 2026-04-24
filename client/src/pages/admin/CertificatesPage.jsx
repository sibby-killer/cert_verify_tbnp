import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import CertTable from '../../components/admin/CertTable.jsx';
import { getCertificates, getCourses } from '../../services/admin.api.js';
import { Link } from 'react-router-dom';

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filters and Sorting State
  const [courseId, setCourseId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('issuedDate');
  const [order, setOrder] = useState('desc');
  const [courses, setCourses] = useState([]);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Load courses for filter
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await getCourses({ limit: 100, sort: 'name', order: 'asc' });
        setCourses(res.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }
    loadCourses();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCertificates({ 
        search, 
        courseId, 
        graduationYear, 
        status, 
        sort, 
        order,
        limit: 50 
      });
      setCerts(res.data || []);
      // Reset selection when data changes
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, courseId, graduationYear, status, sort, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportSelected = () => {
    const selectedCerts = certs.filter(c =>
      selectedIds.includes(c.certificate.id)
    );

    if (selectedCerts.length === 0) return;

    exportToCsv(selectedCerts, `certificates_selected_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportFiltered = () => {
    if (certs.length === 0) return;
    exportToCsv(certs, `certificates_filtered_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToCsv = (data, filename) => {
    const csvRows = [
      [
        "Student Name",
        "Reg Number",
        "Gender",
        "Year Started",
        "Course",
        "Graduation Year",
        "Security Number",
        "Status",
        "Issue Date"
      ],
      ...data.map(c => [
        c.student.name,
        c.student.regNumber,
        c.student.gender || 'N/A',
        c.student.yearStarted || 'N/A',
        c.course.name,
        c.certificate.graduationYear,
        c.certificate.securityNumber,
        c.certificate.status,
        new Date(c.certificate.issuedDate || c.certificate.createdAt).toLocaleDateString()
      ])
    ];

    const csv = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Certificate Management" />
        <main className="p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-96">
                <input 
                  type="text" 
                  placeholder="Search by student name or security number..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-all bg-white"
                />
                <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportSelected}
                  disabled={selectedIds.length === 0}
                  className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-40 hover:bg-green-800 transition-all shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Selected ({selectedIds.length})</span>
                </button>
                <button
                  onClick={handleExportFiltered}
                  disabled={certs.length === 0}
                  className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-800 transition-all shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Filtered</span>
                </button>
                <Link 
                  to="/admin/issue" 
                  className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#152e55] transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Issue New</span>
                </Link>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Program</label>
                <select 
                  value={courseId} 
                  onChange={e => setCourseId(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm bg-slate-50/50"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Graduation Year</label>
                <input 
                  type="number"
                  placeholder="e.g. 2026"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm bg-slate-50/50 w-32"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm bg-slate-50/50"
                >
                  <option value="">All Status</option>
                  <option value="valid">Valid</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Sort By</label>
                <select 
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm bg-slate-50/50"
                >
                  <option value="issuedDate">Issued Date</option>
                  <option value="studentName">Student Name</option>
                  <option value="courseName">Course Name</option>
                  <option value="graduationYear">Graduation Year</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Order</label>
                <select 
                  value={order} 
                  onChange={e => setOrder(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm bg-slate-50/50"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <CertTable 
              certs={certs} 
              loading={loading} 
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
