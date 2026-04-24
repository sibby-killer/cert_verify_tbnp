import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCertificates } from '../../services/admin.api.js';

export default function PrintableCertificatePage() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCert() {
      try {
        const res = await getCertificates({ id });
        if (res.success) {
          setCert(res.data);
        } else {
          setError(res.message || 'Certificate not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load certificate');
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white print:hidden">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8 print:hidden">
        <div className="text-center max-w-md">
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 mb-6">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-sm">{error || 'Something went wrong'}</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-slate-400 font-bold underline">Try Again</button>
        </div>
      </div>
    );
  }

  const { certificate, student, course, institution } = cert;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-end space-x-3 print:hidden">
        <a 
          href={certificate.qrCodeUrl} 
          download={`QR_${certificate.securityNumber}.png`}
          className="bg-white text-slate-700 px-6 py-3 rounded-xl font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download QR</span>
        </a>
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Certificate</span>
        </button>
      </div>

      {/* Certificate Frame */}
      <div className="max-w-[800px] mx-auto bg-white p-16 shadow-2xl border-[12px] border-slate-900 relative print:shadow-none print:border-[8px] print:max-w-none print:w-full">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-slate-200 -mt-1 -ml-1 print:hidden"></div>
        <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-slate-200 -mt-1 -mr-1 print:hidden"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-slate-200 -mb-1 -ml-1 print:hidden"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-slate-200 -mb-1 -mr-1 print:hidden"></div>

        <div className="text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900 mb-2">{institution?.name || 'Academic Institution'}</h1>
          <div className="h-1 w-32 bg-slate-900 mx-auto mb-12"></div>
          
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm mb-4">Official Certificate of Achievement</p>
          <h2 className="text-lg font-serif italic text-slate-500 mb-12">This is to certify that</h2>
          
          <h3 className="text-5xl font-black text-slate-900 mb-4">{student?.name}</h3>
          <p className="text-slate-500 font-mono text-sm mb-12">REGISTRATION NO: {student?.regNumber}</p>
          
          <p className="text-lg text-slate-600 mb-2">has successfully completed the prescribed program of study in</p>
          <h4 className="text-2xl font-bold text-slate-800 mb-12">{course?.name}</h4>
          
          <div className="grid grid-cols-2 gap-12 mb-16 text-left border-t border-slate-100 pt-12">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Graduation Year</label>
                <p className="text-lg font-bold text-slate-800">{certificate.graduationYear}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Gender / Started</label>
                <p className="text-sm text-slate-600 capitalize">{student?.gender || '—'} · {student?.yearStarted || '—'}</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date of Issuance</label>
                <p className="text-lg font-bold text-slate-800">{new Date(certificate.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Security Reference</label>
                <p className="font-mono text-sm font-bold text-slate-900 tracking-wider">{certificate.securityNumber}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-slate-100 pt-12">
            <div className="text-left">
               {certificate.qrCodeUrl && (
                <div className="mb-4">
                  <img src={certificate.qrCodeUrl} alt="Verification QR" className="w-24 h-24 border border-slate-100 p-1" />
                  <p className="text-[8px] font-mono text-slate-400 mt-2">SCAN TO VERIFY AUTHENTICITY</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="w-48 h-0.5 bg-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-900">Registrar Signature</p>
              <p className="text-[8px] font-mono text-slate-400 mt-4 uppercase">Certificate ID: {certificate.id}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Instructions */}
      <p className="text-center text-slate-400 text-xs mt-8 print:hidden">
        For best results, print on A4 paper with "Background Graphics" enabled in browser settings.
      </p>
    </div>
  );
}