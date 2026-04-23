import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/admin/Sidebar.jsx';
import TopBar from '../../components/admin/TopBar.jsx';
import { getSettings, updateSettings } from '../../services/admin.api.js';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('institution');
  const [saving, setSaving] = useState(false);
  const [loadingInst, setLoadingInst] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Institution settings — loaded from real API
  const [inst, setInst] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    logoUrl: '',
    website: '',
    motto: '',
  });

  // ── Load institution data on mount ────────────────────────────────────────
  const loadInstitution = useCallback(async () => {
    setLoadingInst(true);
    try {
      const res = await getSettings();
      if (res.success && res.data) {
        setInst({
          name:    res.data.name    || '',
          address: res.data.address || '',
          email:   res.data.email   || '',
          phone:   res.data.phone   || '',
          logoUrl: res.data.logoUrl || '',
          website: res.data.website || '',
          motto:   res.data.motto   || '',
        });
      }
    } catch (err) {
      console.error('Failed to load institution settings:', err);
    } finally {
      setLoadingInst(false);
    }
  }, []);

  useEffect(() => {
    loadInstitution();
  }, [loadInstitution]);

  // ── Save institution data ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const res = await updateSettings(inst);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(res.message || 'Save failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setSaveError(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
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
                  {loadingInst ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B3A6B]" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Institution Name</label>
                          <input 
                            id="settings-name"
                            type="text" 
                            value={inst.name}
                            onChange={(e) => setInst({...inst, name: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Primary Email</label>
                          <input 
                            id="settings-email"
                            type="email" 
                            value={inst.email}
                            onChange={(e) => setInst({...inst, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                          <input 
                            id="settings-phone"
                            type="text" 
                            value={inst.phone}
                            onChange={(e) => setInst({...inst, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Website</label>
                          <input 
                            id="settings-website"
                            type="url"
                            value={inst.website}
                            onChange={(e) => setInst({...inst, website: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mailing Address</label>
                        <textarea 
                          id="settings-address"
                          value={inst.address}
                          onChange={(e) => setInst({...inst, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B] h-24" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Motto / Tagline</label>
                        <input 
                          id="settings-motto"
                          type="text" 
                          value={inst.motto}
                          onChange={(e) => setInst({...inst, motto: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#1B3A6B]" 
                        />
                      </div>

                      {saveSuccess && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 font-medium text-sm">
                          ✓ Institution settings saved successfully.
                        </div>
                      )}
                      {saveError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium text-sm">
                          {saveError}
                        </div>
                      )}

                      <button 
                        id="settings-save"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#1B3A6B] text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Update Institution Details'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-2">API Security Signature</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      The master key used for signing QR code payloads. Set via the <code className="bg-slate-200 px-1 rounded text-xs">JWT_SECRET</code> environment variable on Vercel. Never expose this value in client code.
                    </p>
                    <div className="font-mono text-xs bg-white p-4 rounded-xl border border-slate-200 text-slate-400 select-all">
                      [Set via JWT_SECRET environment variable — not displayed for security]
                    </div>
                  </div>
                  
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-amber-900 mb-2">Caution: Database Maintenance</h4>
                    <p className="text-sm text-amber-700 mb-4">
                      Manual migrations are locked for active production domains. Please use the Drizzle CLI (<code className="bg-amber-100 px-1 rounded text-xs">npx drizzle-kit push</code>) for schema updates.
                    </p>
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
