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

  // Single issuance state
  const [singleData, setSingleData] = useState({
    studentId: '',
    courseId: '',
    graduationYear: new Date().getFullYear().toString()
  });

  // Bulk issuance state
  const [bulkFile, setBulkFile] = useState(null);

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

  // ── Re-load eligible students whenever the selected course changes ──────────
  const loadEligibleStudents = useCallback(async (courseId) => {
    if (!courseId) { setStudents([]); return; }
    try {
      const res = await getEligibleStudents(courseId);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load eligible students:', err);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    loadEligibleStudents(singleData.courseId);
  }, [singleData.courseId, loadEligibleStudents]);

  const handleIssueSingle = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Ensure graduationYear is a number for validation
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

  const [bulkResults, setBulkResults] = useState(null);

  const handleIssueBulk = async () => {
    if (!bulkFile) return;
    setSubmitting(true);
    setError('');
    setBulkResults(null);

    try {
      const text = await bulkFile.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      // Skip header row if present (detect by checking if first row has non-ID content)
      const rows = lines[0]?.toLowerCase().includes('student') || lines[0]?.toLowerCase().includes('name')
        ? lines.slice(1)
        : lines;

      if (rows.length === 0) {
        setError('CSV file is empty or has no data rows.');
        setSubmitting(false);
        return;
      }

      const results = { success: [], failed: [] };

      for (const row of rows) {
        // Support: studentId,courseId,graduationYear  OR  regNumber,courseCode,year
        const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) {
          results.failed.push({ row, reason: 'Invalid format — need 3 columns: studentId,courseId,graduationYear' });
          continue;
        }

        const [studentId, courseId, graduationYear] = cols;

        try {
          const res = await issueSingle({ studentId, courseId, graduationYear });
          if (res.success) {
            results.success.push({
              name: res.data?.student?.name || studentId,
              securityNumber: res.data?.certificate?.securityNumber,
            });
          } else {
            results.failed.push({ row, reason: res.message });
          }
        } catch (err) {
          results.failed.push({ row, reason: err.response?.data?.message || 'Issuance failed' });
        }
      }

      setBulkResults(results);
      setStep(4);
    } catch (err) {
      setError('Failed to read CSV file. Make sure it is a valid .csv file.');
    } finally {
      setSubmitting(false);
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

          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-10 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-[#1B3A6B] mb-2 text-center">Select Issuance Method</h2>
                <p className="text-slate-400 text-center mb-10">Choose how you want to generate the secure certificates.</p>
                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => { setMethod('single'); setStep(2); }}
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
                    onClick={() => { setMethod('bulk'); setStep(2); }}
                    className="group border-2 border-slate-50 p-8 rounded-3xl hover:border-[#1B3A6B] transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-[#1B3A6B]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1B3A6B] group-hover:text-white transition-all text-[#1B3A6B]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-700">Bulk Upload</h3>
                    <p className="text-xs text-slate-400 mt-2">Upload CSV file for batch processing.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && method === 'single' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <h3 className="font-bold text-slate-800">Student & Course Selection</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Student</label>
                    <select 
                      value={singleData.studentId}
                      onChange={(e) => setSingleData({...singleData, studentId: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] bg-white"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.regNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Program</label>
                    <select 
                      value={singleData.courseId}
                      onChange={(e) => setSingleData({...singleData, courseId: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] bg-white"
                    >
                      <option value="">-- Choose Program --</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Academic Year</label>
                    <input 
                      type="text" 
                      value={singleData.graduationYear}
                      onChange={(e) => setSingleData({...singleData, graduationYear: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200" 
                    />
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 text-slate-400 font-bold">Back</button>
                  <button onClick={() => setStep(3)} className="bg-[#1B3A6B] text-white px-12 py-3 rounded-xl font-bold">Review</button>
                </div>
              </div>
            )}

            {step === 2 && method === 'bulk' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Upload CSV File</h3>
                  <p className="text-xs text-slate-400">Each row: <code className="bg-slate-100 px-1 rounded">studentId,courseId,graduationYear</code></p>
                </div>

                {/* CSV Template download */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Need a template?</p>
                      <p className="text-xs text-slate-400 mt-0.5">Download and fill in your student IDs</p>
                    </div>
                    <button
                      onClick={() => {
                        const header = 'studentId,courseId,graduationYear';
                        const examples = students.slice(0,2).map((s,i) => `${s.id},${courses[0]?.id || 'COURSE_ID'},${new Date().getFullYear()}`).join('\n');
                        const blob = new Blob([header + '\n' + examples], { type: 'text/csv' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'bnp_bulk_template.csv';
                        a.click();
                      }}
                      className="bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-800 transition-all"
                    >
                      Download Template
                    </button>
                  </div>

                  {/* Show student/course reference */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Students</p>
                      {students.slice(0, 4).map(s => (
                        <p key={s.id} className="font-mono text-slate-400 truncate">{s.id.slice(0,8)}… = {s.name}</p>
                      ))}
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Courses</p>
                      {courses.slice(0, 4).map(c => (
                        <p key={c.id} className="font-mono text-slate-400 truncate">{c.id.slice(0,8)}… = {c.name}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setBulkFile(e.target.files[0] || null)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-green-700 file:text-white hover:file:bg-green-800 cursor-pointer"
                  />
                  {bulkFile && <p className="text-xs text-green-700 mt-1 font-medium">✓ {bulkFile.name} selected</p>}
                </div>

                {error && <p className="text-red-500 text-sm italic">{error}</p>}

                <div className="flex space-x-4 pt-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 text-slate-400 font-bold">Back</button>
                  <button
                    onClick={handleIssueBulk}
                    disabled={!bulkFile || submitting}
                    className="bg-green-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg disabled:opacity-40 flex items-center space-x-2"
                  >
                    {submitting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Processing…</span></>
                    ) : (
                      <span>Process CSV</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in duration-500 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Confirm Details</h3>
                <div className="flex-grow space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-bold text-[#1B3A6B]">{students.find(s => s.id === singleData.studentId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-bold text-[#1B3A6B] text-right">{courses.find(c => c.id === singleData.courseId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Graduation:</span>
                    <span className="font-bold text-[#1B3A6B]">{singleData.graduationYear}</span>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 italic">{error}</p>}
                <div className="flex space-x-4 mt-10">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 font-bold">Edit</button>
                  <button 
                    onClick={handleIssueSingle} 
                    disabled={submitting}
                    className="flex-2 bg-[#1B3A6B] text-white px-12 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Generating...' : 'Finalize & Sign Certificate'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && method === 'single' && (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center flex-grow text-center pb-8">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mb-4 shadow-xl shadow-green-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Successfully Issued</h2>
                <p className="text-slate-400 mb-6 text-sm px-4">The certificate has been digitally signed and the student's secure QR verifier is ready.</p>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg w-full max-w-sm mb-6 relative overflow-hidden" id="qr-export-container">
                  <div className="absolute top-0 left-0 w-full h-2 bg-green-700"></div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{students.find(s => s.id === singleData.studentId)?.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wider">{courses.find(c => c.id === singleData.courseId)?.name}</p>

                  {result?.certificate?.qrCodeUrl && (
                    <img
                      src={result.certificate.qrCodeUrl}
                      alt="Verification QR Code"
                      className="w-48 h-48 mx-auto rounded-xl border border-slate-100 shadow-sm mb-4"
                    />
                  )}

                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Security Number</label>
                  <p className="font-mono text-lg font-bold text-green-700 tracking-widest">{result?.certificate?.securityNumber}</p>
                </div>

                <div className="flex space-x-3 w-full max-w-sm">
                  <a
                    href={result?.certificate?.qrCodeUrl}
                    download={`QR_${result?.certificate?.securityNumber}.png`}
                    className="flex-1 bg-green-700 text-white px-2 py-3 rounded-xl font-bold hover:bg-green-800 transition-all shadow-md text-sm cursor-pointer text-center"
                  >
                    Download QR
                  </a>
                  <button
                    onClick={() => { setStep(1); setSingleData({ studentId: '', courseId: '', graduationYear: new Date().getFullYear().toString() }); setResult(null); }}
                    className="flex-1 bg-slate-900 text-white px-2 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md text-sm"
                  >
                    Issue Another
                  </button>
                </div>
              </div>
            )}

            {step === 4 && method === 'bulk' && (
              <div className="animate-in fade-in duration-500 flex flex-col flex-grow">
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
                          <span className="font-medium text-slate-700">{r.name}</span>
                          <span className="font-mono text-green-700 text-xs">{r.securityNumber}</span>
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
                          <p className="font-mono text-slate-400 truncate">{r.row}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setStep(1); setBulkFile(null); setBulkResults(null); setError(''); }}
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
