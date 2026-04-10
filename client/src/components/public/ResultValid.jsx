import React from 'react';

export default function ResultValid({ data }) {
  const { certificate, student, course } = data;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="bg-[#16A34A] p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Certificate Verified</h2>
        <p className="opacity-90">This document is authentic and currently valid.</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Name</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{student.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course of Study</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{course.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Graduation Year</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{certificate.graduationYear}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Number</label>
              <p className="text-lg font-mono font-bold text-[#1B3A6B]">{certificate.securityNumber}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Date</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{new Date(certificate.issuedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <div className="mt-1">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border border-green-200 uppercase">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 mb-4">Verification Digital Signature ID</p>
          <p className="text-xs font-mono text-slate-300 break-all">{certificate.id}</p>
        </div>
      </div>
    </div>
  );
}
