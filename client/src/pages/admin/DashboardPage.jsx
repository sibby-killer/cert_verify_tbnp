import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import StatsCard from '../../components/admin/StatsCard.jsx';
import { getDashboard } from '../../services/admin.api.js';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-grow ml-72">
        <TopBar title="System Overview" />
        
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsCard 
              title="Issued Certificates" 
              value={stats.stats.totalCertificates} 
              icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              trend="+12% this month"
              color="blue"
            />
            <StatsCard 
              title="Registered Students" 
              value={stats.stats.totalStudents} 
              icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              trend="+5% week"
              color="gold"
            />
            <StatsCard 
              title="Today's Verifications" 
              value={stats.stats.verificationsToday} 
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              trend={stats.stats.verificationsToday > 0 ? "Active" : "Stable"}
              color="green"
            />
            <StatsCard 
              title="Pending Reports" 
              value={stats.stats.pendingReports} 
              icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              trend={stats.stats.pendingReports > 0 ? "Requires Attention" : "Clear"}
              color={stats.stats.pendingReports > 0 ? "red" : "blue"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Suspicious Activity</h3>
              {stats.suspicious && stats.suspicious.length > 0 ? (
                <div className="space-y-4">
                  {stats.suspicious.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-red-900 text-sm">Security Trigger: {item.certId}</p>
                          <p className="text-xs text-red-700">{item.count} attempts from single IP</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-red-600 underline">Investigate</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V22m0-19.056c-2.73 0-5.238.823-7.382 2.238L12 22l7.382-16.818c-2.144-1.415-4.652-2.238-7.382-2.238z" />
                  </svg>
                  <p>No suspicious activity detected today</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Verifications</h3>
              <div className="space-y-4">
                {stats.recentLogs && stats.recentLogs.length > 0 ? (
                  stats.recentLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${log.status === 'valid' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{log.certId}</p>
                          <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{log.method}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p>No verification history today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
