import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getEligibleStudents, getCourses, issueSingle } from '../../services/admin.api.js';

export default function IssuePage() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('single');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);

  // Filter & Sorting State for Student Selection
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGender, setStudentGender] = useState('');
  const [studentYear, setStudentYear] = useState('');
  const [studentSort, setStudentSort] = useState('name');
  const [studentOrder, setStudentOrder] = useState('asc');

  // Issuance Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [singleData, setSingleData] = useState({
    studentId: '',
    courseId: '',
    graduationYear: new Date().getFullYear().toString()
  });

  // ── Load courses once on mount ────────────────────────────────────────────
  useEffect(() => {
    async function loadCourses() {
      try {
        const cRes = await getCourses({ limit: 500, sort: 'name', order: 'asc' });
        setCourses(cRes.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // ── Re-load eligible students whenever the selected course or filters change ──────────
  const loadEligibleStudents = useCallback(async (courseId) => {
    if (!courseId) { setStudents([]); return; }
    try {
      const res = await getEligibleStudents(courseId, {
        search: studentSearch,
        gender: studentGender,
        yearStarted: studentYear,
        sort: studentSort,
        order: studentOrder
      });
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load eligible students:', err);
      setStudents([]);
    }
  }, [studentSearch, studentGender, studentYear, studentSort, studentOrder]);

  useEffect(() => {
    loadEligibleStudents(singleData.courseId);
  }, [singleData.courseId, loadEligibleStudents]);

  const handleIssueSingle = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...singleData,
        graduationYear: parseInt(singleData.graduationYear)
      };

      const res = await issueSingle(payload);
      if (res.success) {
        setResult(res.data);
        setStep(4);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Issuance failed. Check if student already has a certificate for this course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueBulk = async () => {
    if (selectedStudentIds.length === 0) return;
    setSubmitting(true);
    setError('');
    setBulkResults(null);

    const results = { success: [], failed: [] };

    for (const studentId of selectedStudentIds) {
      try {
        const res = await issueSingle({
          studentId,
          courseId: singleData.courseId,
          graduationYear: parseInt(singleData.graduationYear)
        });
        if (res.success) {
          results.success.push({
            name: res.data?.student?.name || studentId,
            securityNumber: res.data?.certificate?.securityNumber,
          });
        } else {
          results.failed.push({ studentId, reason: res.message });
        }
      } catch (err) {
        results.failed.push({ studentId, reason: err.response?.data?.message || 'Issuance failed' });
      }
    }

    setBulkResults(results);
    setStep(4);
    setSubmitting(false);
  };

  const isAllOnPageSelected = students.length > 0 && students.every(s => selectedStudentIds.includes(s.id));

  const toggleAllOnPage = () => {
    if (isAllOnPageSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !students.some(s => s.id === id)));
    } else {
      const newIds = students.map(s => s.id).filter(id => !selectedStudentIds.includes(id));
      setSelectedStudentIds(prev => [...prev, ...newIds]);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Issue Certificate" />
        <main className="p-8">
          {/* Stepper Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex flex-col items-center flex-1 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all z-10 ${step >= s ? 'bg-[#1B3A6B] text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {s}
                  </div>
                  <span className={`text-[10px] mt-2 font-black uppercase tracking-widest ${step >= s ? 'text-slate-800' : 'text-slate-300'}`}>
                    {s === 1 ? 'Method' : s === 2 ? 'Details' : s === 3 ? 'Review' : 'Result'}
                  </span>
                  {s < 4 && (
                    <div className={`absolute left-[50%] top-5 w-full h-0.5 -z-0 transition-all ${step > s ? 'bg-[#1B3A6B]' : 'bg-slate-100'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-10 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
            {step === 1 && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-[#1B3A6B] mb-2 text-center">Select Issuance Method</h2>
                <p className="text-slate-400 text-center mb-10">Choose how you want to generate the secure certificates.</p>
                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => { setMethod('single'); setStep(2); setSelectedStudentIds([]); setSingleData({...singleData, studentId: ''}); }}
                    className="group border-2 border-slate-50 p-8 rounded-3xl hover:border-[#1B3A6B] transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-[#1B3A6B]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1B3A6B] group-hover:text-white transition-all text-[#1B3A6B]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-700">Single Entry</h3>
                    <p className="text-xs text-slate-400 mt-2">Issue for one specific student manually.</p>
                  </button>
                  <button 
                    onClick={() => { setMethod('bulk'); setStep(2); setSelectedStudentIds([]); setSingleData({...singleData, studentId: ''}); }}
                    className="group border-2 border-slate-50 p-8 rounded-3xl hover:border-[#1B3A6B] transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-[#1B3A6B]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1B3A6B] group-hover:text-white transition-all text-[#1B3A6B]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-700">Bulk Selection</h3>
                    <p className="text-xs text-slate-400 mt-2">Select multiple students from the eligibility registry.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <h3 className="font-bold text-slate-800 text-xl">{method === 'single' ? 'Issue Individual Certificate' : 'Bulk Certificate Issuance'}</h3>
                
                <div className="space-y-6">
                  {/* Program Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-3">1. Select Program of Study</label>
                    <select 
                      value={singleData.courseId}
                      onChange={(e) => {
                        setSingleData({...singleData, courseId: e.target.value, studentId: ''});
                        setSelectedStudentIds([]);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] bg-white font-bold text-[#1B3A6B]"
                    >
                      <option value="">-- Choose Program --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Student Selection Table */}
                  {singleData.courseId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex justify-between items-end">
                        <label className="block text-xs font-bold text-slate-400 uppercase">2. Select {method === 'single' ? 'Student' : 'Students'}</label>
                        {method === 'bulk' && (
                          <span className="text-[10px] font-black text-[#1B3A6B] bg-blue-50 px-3 py-1 rounded-full">
                            {selectedStudentIds.length} SELECTED
                          </span>
                        )}
                      </div>
                      
                      {/* Filter Bar */}
                      <div className="flex flex-wrap gap-3">
                        <div className="relative flex-grow min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Search by name or reg number..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                          />
                          <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <select
                          value={studentGender}
                          onChange={(e) => setStudentGender(e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                        >
                          <option value="">All Genders</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>

                        <input
                          type="number"
                          placeholder="Year"
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className="w-24 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                        />

                        <select
                          value={studentSort}
                          onChange={(e) => setStudentSort(e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="regNumber">Sort by Reg No</option>
                          <option value="gender">Sort by Gender</option>
                          <option value="yearStarted">Sort by Year</option>
                        </select>

                        <select
                          value={studentOrder}
                          onChange={(e) => setStudentOrder(e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                        >
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                      </div>

                      {/* Scrollable Table */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                  {method === 'bulk' && (
                                    <input 
                                      type="checkbox" 
                                      checked={isAllOnPageSelected} 
                                      onChange={toggleAllOnPage} 
                                      className="w-4 h-4 rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
                                    />
                                  )}
                                  {method === 'single' && 'Pick'}
                                </th>
                                <th className="px-6 py-4">Student Details</th>
                                <th className="px-6 py-4 text-center">Gender</th>
                                <th className="px-6 py-4 text-center">Joined</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                              {students.map(s => {
                                const isSelected = method === 'single' 
                                  ? singleData.studentId === s.id 
                                  : selectedStudentIds.includes(s.id);
                                
                                return (
                                  <tr 
                                    key={s.id} 
                                    onClick={() => {
                                      if (method === 'single') {
                                        setSingleData({...singleData, studentId: s.id});
                                      } else {
                                        setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                                      }
                                    }}
                                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                                  >
                                    <td className="px-6 py-4 text-center">
                                      <input
                                        type={method === 'single' ? 'radio' : 'checkbox'}
                                        checked={isSelected}
                                        readOnly
                                        className={`w-4 h-4 text-[#1B3A6B] focus:ring-[#1B3A6B] ${method === 'bulk' ? 'rounded' : ''}`}
                                      />
                                    </td>
                                    <td className="px-6 py-4">
                                      <p className="font-bold text-slate-800">{s.name}</p>
                                      <p className="text-[10px] font-mono text-slate-400">{s.regNumber}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center capitalize text-slate-500 font-medium">
                                      {s.gender || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500 font-medium">
                                      {s.yearStarted || '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-3">3. Graduation Year</label>
                    <input 
                      type="number" 
                      value={singleData.graduationYear}
                      onChange={(e) => setSingleData({...singleData, graduationYear: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] outline-none" 
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Back</button>
                  <button 
                    onClick={() => setStep(3)} 
                    disabled={method === 'single' ? !singleData.studentId : selectedStudentIds.length === 0}
                    className="bg-[#1B3A6B] text-white px-12 py-3 rounded-xl font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2a5496] transition-all"
                  >
                    Review Issuance
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl mx-auto animate-in fade-in duration-500 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Confirm Issuance</h3>
                <div className="flex-grow space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Program:</span>
                    <span className="font-bold text-[#1B3A6B] text-right">{courses.find(c => c.id === singleData.courseId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Academic Year:</span>
                    <span className="font-bold text-[#1B3A6B]">{singleData.graduationYear}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-4 mt-4">
                    <span className="text-slate-400">{method === 'single' ? 'Student:' : 'Total Students:'}</span>
                    <span className="font-bold text-[#1B3A6B]">
                      {method === 'single' 
                        ? students.find(s => s.id === singleData.studentId)?.name 
                        : `${selectedStudentIds.length} Students Selected`}
                    </span>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 italic">{error}</p>}
                <div className="flex space-x-4 mt-10">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 font-bold">Edit Selection</button>
                  <button 
                    onClick={method === 'single' ? handleIssueSingle : handleIssueBulk} 
                    disabled={submitting}
                    className="flex-2 bg-[#1B3A6B] text-white px-12 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Signing...' : `Confirm & Issue ${method === 'single' ? 'Certificate' : 'Certificates'}`}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && method === 'single' && (
              <div className="max-w-2xl mx-auto animate-in zoom-in duration-500 flex flex-col items-center justify-center flex-grow text-center pb-8">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mb-4 shadow-xl shadow-green-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Successfully Issued</h2>
                <p className="text-slate-400 mb-6 text-sm px-4">The certificate has been digitally signed and the student's secure QR verifier is ready.</p>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg w-full max-w-sm mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-green-700"></div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{students.find(s => s.id === singleData.studentId)?.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wider">{courses.find(c => c.id === singleData.courseId)?.name}</p>

                  {result?.certificate?.qrCodeUrl && (
                    <img src={result.certificate.qrCodeUrl} alt="QR" className="w-48 h-48 mx-auto rounded-xl border border-slate-100 shadow-sm mb-4" />
                  )}

                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Security Number</label>
                  <p className="font-mono text-lg font-bold text-green-700 tracking-widest">{result?.certificate?.securityNumber}</p>
                </div>

                <div className="flex space-x-3 w-full max-w-sm">
                  <a
                    href={result?.certificate?.qrCodeUrl}
                    download={`QR_${result?.certificate?.securityNumber}.png`}
                    className="flex-1 bg-green-700 text-white px-2 py-3 rounded-xl font-bold hover:bg-green-800 transition-all shadow-md text-sm text-center"
                  >
                    Download QR
                  </a>
                  <button
                    onClick={() => { setStep(1); setSingleData({...singleData, studentId: ''}); setResult(null); setSelectedStudentIds([]); }}
                    className="flex-1 bg-slate-900 text-white px-2 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md text-sm"
                  >
                    Issue More
                  </button>
                </div>
              </div>
            )}

            {step === 4 && method === 'bulk' && (
              <div className="max-w-2xl mx-auto animate-in fade-in duration-500 flex flex-col flex-grow">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Bulk Issuance Complete</h2>
                    <p className="text-sm text-slate-400">{bulkResults?.success.length} issued · {bulkResults?.failed.length} failed</p>
                  </div>
                </div>

                {bulkResults?.success.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase text-green-700 tracking-widest mb-2">✓ Issued ({bulkResults.success.length})</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {bulkResults.success.map((r, i) => (
                        <div key={i} className="flex justify-between text-sm bg-green-50 px-4 py-2 rounded-xl">
                          <span className="font-medium text-slate-700">{r.student?.name || 'Student'}</span>
                          <span className="font-mono text-green-700 text-xs">{r.certificate?.securityNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkResults?.failed.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase text-red-500 tracking-widest mb-2">✗ Failed ({bulkResults.failed.length})</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {bulkResults.failed.map((r, i) => (
                        <div key={i} className="text-xs bg-red-50 px-4 py-2 rounded-xl">
                          <p className="text-red-600 font-medium">{r.reason}</p>
                          <p className="font-mono text-slate-400 truncate">ID: {r.studentId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setStep(1); setBulkResults(null); setError(''); setSelectedStudentIds([]); }}
                  className="mt-auto bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
                >
                  Start New Issuance
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
