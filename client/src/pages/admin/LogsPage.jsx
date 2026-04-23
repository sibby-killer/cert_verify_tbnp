import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getLogs } from '../../services/admin.api.js';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (filter !== 'all') params.result = filter;
      
      const res = await getLogs(params);
      
      // Backend returns: { success: true, data: [...], pagination: {...} }
      // getLogs() returns res.data (axios), which is this object.
      setLogs(res?.data || []);
      setPagination(res?.pagination || null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setPage(1); // reset to page 1 whenever filter changes
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (f) => {
    setFilter(f);
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
              {['all', 'valid', 'invalid', 'revoked'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
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
                  <th className="px-8 py-5">Cert ID / Ref</th>
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
                    <tr key={log?.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm text-slate-500">
                        {log?.verifiedAt ? new Date(log.verifiedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-8 py-5 font-mono text-xs font-bold text-[#1B3A6B]">
                        {log?.certId?.slice(0, 8) || 'N/A'}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded uppercase text-slate-500">
                          {log?.method || 'web'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono text-slate-400">
                        {log?.verifierIp || '—'}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          log?.result === 'valid'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : log?.result === 'revoked'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {log?.result || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic">
                      No access logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-400">
                Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total} logs
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-100 text-slate-600 hover:border-[#1B3A6B] disabled:opacity-40 transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-100 text-slate-600 hover:border-[#1B3A6B] disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
