import React from 'react';
import { Link } from 'react-router-dom';

export default function ResultInvalid({ securityNumber }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#DC2626] p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Verification Failed</h2>
        <p className="opacity-90">This certificate record could not be found in our database.</p>
      </div>

      <div className="p-8 text-center">
        <div className="mb-8">
          <p className="text-slate-500 mb-2">The security number provided:</p>
          <p className="text-xl font-mono font-bold text-[#DC2626]">{securityNumber || 'N/A'}</p>
        </div>

        <div className="bg-red-50 rounded-xl p-6 mb-8 border border-red-100 text-left">
          <h4 className="font-bold text-red-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Important Warning
          </h4>
          <p className="text-sm text-red-700 leading-relaxed">
            This indicates the certificate may be fraudulent or was never officially issued by Bungoma National Polytechnic. Please double-check the security number for typing errors.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="bg-slate-200 text-slate-700 py-3 px-6 rounded-lg font-bold hover:bg-slate-300 transition-colors">
            Try Again
          </Link>
          <Link to="/report" className="bg-[#1B3A6B] text-white py-3 px-6 rounded-lg font-bold hover:bg-[#152e55] transition-colors shadow-lg">
            Report Forgery
          </Link>
        </div>
      </div>
    </div>
  );
}
