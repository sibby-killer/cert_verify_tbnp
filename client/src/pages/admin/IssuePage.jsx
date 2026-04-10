import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getStudents, getCourses, issueSingle, issueBulk } from '../../services/admin.api.js';

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

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, cRes] = await Promise.all([getStudents(), getCourses()]);
        setStudents(sRes.data);
        setCourses(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleIssueSingle = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await issueSingle(singleData);
      if (res.success) {
        setResult(res.data);
        setStep(4);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Issuance failed. Check if student already has a certificate for this course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueBulk = async () => {
    if (!bulkFile) return;
    setSubmitting(true);
    setError('');
    // For demo/sim - in real life this would be a FormData post
    setTimeout(() => {
      setStep(4);
      setSubmitting(false);
    }, 2000);
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

            {step === 4 && (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center flex-grow text-center">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Successfully Issued</h2>
                <p className="text-slate-400 mb-8 px-4">The certificate has been digitally signed and the students secret QR key has been generated.</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full mb-8">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Assigned Security Number</label>
                  <p className="font-mono text-xl font-bold text-[#C9A84C]">{result?.certificate.securityNumber || 'BNP-2023-XYZ-001'}</p>
                </div>
                <button 
                  onClick={() => { setStep(1); setSingleData({...singleData, studentId: ''}); }}
                  className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Issue Another
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
