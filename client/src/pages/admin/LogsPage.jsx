import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getLogs } from '../../services/admin.api.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const res = await getLogs({ status: filter === 'all' ? undefined : filter });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="System Audit Logs" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#1B3A6B]">Verification History</h2>
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
              {['all', 'valid', 'invalid'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-[#1B3A6B] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Certificate ID</th>
                  <th className="px-8 py-5">Method</th>
                  <th className="px-8 py-5">IP Address</th>
                  <th className="px-8 py-5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B] mx-auto"></div>
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-8 py-5 font-mono text-xs font-bold text-[#1B3A6B]">{log.certId || 'N/A'}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded uppercase text-slate-500">{log.method}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono text-slate-400">{log.ipAddress}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          log.status === 'valid' 
                            ? 'bg-green-50 text-green-600 border-green-100' 
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic">No access logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
