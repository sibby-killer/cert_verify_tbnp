import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import CertTable from '../../components/admin/CertTable.jsx';
import { getCertificates } from '../../services/admin.api.js';
import { Link } from 'react-router-dom';

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getCertificates({ search });
        setCerts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [search]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Certificate Management" />
        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="relative w-96">
              <input 
                type="text" 
                placeholder="Search by student name or security number..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-all"
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Link 
              to="/admin/issue" 
              className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#152e55] transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Issue New</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <CertTable certs={certs} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
