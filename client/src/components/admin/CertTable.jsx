import React, { useState } from 'react';

export default function CertTable({ certs, loading }) {
  const [selectedCert, setSelectedCert] = useState(null);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B] mx-auto"></div>
        <p className="mt-4 text-slate-400 font-medium">Fetching certificates...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
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
                <button 
                  onClick={() => setSelectedCert(item)}
                  className="text-slate-300 hover:text-[#1B3A6B] transition-colors p-2"
                >
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

      {/* Certificate Details Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-[#1B3A6B]">Certificate Details</h3>
              <button 
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Student Name</label>
                <p className="font-bold text-slate-800">{selectedCert.student.name}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Registration No.</label>
                <p className="font-mono text-xs font-bold text-slate-600">{selectedCert.student.regNumber}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Gender</label>
                <p className="text-sm text-slate-600 capitalize">{selectedCert.student.gender || '—'}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Year Started</label>
                <p className="text-sm text-slate-600">{selectedCert.student.yearStarted || '—'}</p>
              </div>
              <div className="col-span-2 border-t border-slate-50 pt-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Program of Study</label>
                <p className="font-bold text-[#1B3A6B]">{selectedCert.course.name}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Graduation Year</label>
                <p className="text-sm font-bold text-slate-700">{selectedCert.certificate.graduationYear}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Issue Date</label>
                <p className="text-sm text-slate-500">{new Date(selectedCert.certificate.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Security Number</label>
                <p className="font-mono text-sm font-bold text-green-700 tracking-wider">{selectedCert.certificate.securityNumber}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Status</label>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  selectedCert.certificate.status === 'valid' 
                    ? 'bg-green-50 text-green-600 border-green-100' 
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {selectedCert.certificate.status}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-50 pt-4 flex items-center space-x-6">
                {selectedCert.certificate.qrCodeUrl && (
                  <div className="flex-shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <img 
                      src={selectedCert.certificate.qrCodeUrl} 
                      alt="Verification QR" 
                      className="w-24 h-24"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Certificate ID</label>
                  <p className="font-mono text-[10px] text-slate-400 break-all mb-4">{selectedCert.certificate.id}</p>
                  <a 
                    href={selectedCert.certificate.qrCodeUrl}
                    download={`QR_${selectedCert.certificate.securityNumber}.png`}
                    className="inline-flex items-center text-xs font-bold text-[#1B3A6B] hover:underline"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR Code
                  </a>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedCert(null)}
              className="w-full bg-[#1B3A6B] text-white py-3 rounded-xl font-bold hover:bg-[#2a5496] transition-all shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
