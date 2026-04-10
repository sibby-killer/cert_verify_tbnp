import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getReports, updateReport } from '../../services/admin.api.js';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await updateReport(id, status);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Forgery Reports" />
        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1B3A6B]">Fraud Investigations</h2>
            <p className="text-slate-500">Review and manage reports of suspicious or forged certificates.</p>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
              </div>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in slide-in-from-right-10 duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Security Number: {report.certNumber}</h3>
                        <p className="text-xs text-slate-400">Reported on {new Date(report.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {report.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(report.id, 'resolved')}
                            className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                          >
                            Mark Resolved
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                            className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status !== 'pending' && (
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${report.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          {report.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-2">Reporter Attachment</h4>
                      <p className="text-sm text-slate-600 italic">"{report.details || 'No additional details provided.'}"</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {report.contactEmail && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-2">Reporter Contact</h4>
                          <p className="text-sm font-bold text-[#C9A84C]">{report.contactEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-100">
                Excellent! No pending forgery reports.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
