import React, { useState } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('institution');
  const [saving, setSaving] = useState(false);

  // Institution settings
  const [inst, setInst] = useState({
    name: 'Bungoma National Polytechnic',
    address: 'Bungoma, Kenya',
    email: 'info@bungomapoly.ac.ke',
    phone: '+254 700 000 000'
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-grow ml-72">
        <TopBar title="Settings & Configuration" />
        <main className="p-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-50">
              <button 
                onClick={() => setActiveTab('institution')}
                className={`px-8 py-5 text-sm font-bold transition-all ${activeTab === 'institution' ? 'text-[#1B3A6B] border-b-2 border-[#1B3A6B]' : 'text-slate-400'}`}
              >
                Institution Profile
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-8 py-5 text-sm font-bold transition-all ${activeTab === 'security' ? 'text-[#1B3A6B] border-b-2 border-[#1B3A6B]' : 'text-slate-400'}`}
              >
                Security & Keys
              </button>
            </div>

            <div className="p-10">
              {activeTab === 'institution' && (
                <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">School Name</label>
                      <input 
                        type="text" 
                        value={inst.name}
                        onChange={(e) => setInst({...inst, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Primary Email</label>
                      <input 
                        type="email" 
                        value={inst.email}
                        onChange={(e) => setInst({...inst, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mailing Address</label>
                    <textarea 
                      value={inst.address}
                      onChange={(e) => setInst({...inst, address: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] h-24" 
                    />
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1B3A6B] text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving Profile...' : 'Update Institution Details'}
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">API Security Signature</h4>
                    <p className="text-sm text-slate-500 mb-4">The master key used for signing QR code payloads. This should never be modified unless the institution core domain changes.</p>
                    <div className="font-mono text-xs bg-white p-4 rounded-xl border border-slate-200 text-slate-400 select-all">
                      JWT_SIGN_SECRET_ECC_SHA256_0x782...
                    </div>
                  </div>
                  
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 mb-2">Caution: Database Maintenance</h4>
                    <p className="text-sm text-amber-700 mb-4">Manual migrations are locked for active production domains. Please use the CLI for schema updates.</p>
                    <button className="text-xs font-bold text-amber-600 underline">View Maintenance Logs</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
