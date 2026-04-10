import React from 'react';
import { Link } from 'react-router-dom';

export default function ResultRevoked({ data }) {
  const { certificate, student, course } = data;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="bg-[#D97706] p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Certificate Revoked</h2>
        <p className="opacity-90">This document has been officially invalidated.</p>
      </div>

      <div className="p-8">
        <div className="bg-amber-50 rounded-xl p-6 mb-8 border border-amber-100">
          <label className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1 block">Revocation Reason</label>
          <p className="text-amber-900 font-semibold">{certificate.revokeReason || 'No reason provided.'}</p>
          <p className="text-xs text-amber-600 mt-2">Revoked on: {new Date(certificate.revokedAt).toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60 grayscale-[0.5]">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Name</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{student.name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course of Study</label>
              <p className="text-lg font-bold text-[#1B3A6B]">{course.name}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Number</label>
              <p className="text-lg font-mono font-bold text-[#1B3A6B]">{certificate.securityNumber}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <div className="mt-1">
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-200 uppercase">
                  REVOKED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/report" className="text-[#1B3A6B] font-semibold hover:underline">
            Need more information about this revocation? Contact Registrar
          </Link>
        </div>
      </div>
    </div>
  );
}
