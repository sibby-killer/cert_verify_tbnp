import React from 'react';

export default function CertTable({ certs, loading }) {
  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B] mx-auto"></div>
        <p className="mt-4 text-slate-400 font-medium">Fetching certificates...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
            <th className="px-8 py-5">Student</th>
            <th className="px-8 py-5">Course</th>
            <th className="px-8 py-5">Security Number</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {certs.map((item) => (
            <tr key={item.certificate.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-8 py-5">
                <p className="font-bold text-slate-800">{item.student.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.student.regNumber}</p>
              </td>
              <td className="px-8 py-5">
                <p className="text-sm font-semibold text-slate-600">{item.course.name}</p>
              </td>
              <td className="px-8 py-5">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
                  {item.certificate.securityNumber}
                </span>
              </td>
              <td className="px-8 py-5">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                  item.certificate.status === 'valid' 
                    ? 'bg-green-50 text-green-600 border-green-100' 
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {item.certificate.status}
                </span>
              </td>
              <td className="px-8 py-5 text-right">
                <button className="text-slate-300 hover:text-[#1B3A6B] transition-colors p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {certs.length === 0 && (
            <tr>
              <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                No certificate records found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
