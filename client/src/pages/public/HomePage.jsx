import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VerifyForm from '../../components/public/VerifyForm.jsx';
import QRScanner from '../../components/public/QRScanner.jsx';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('number');
  const navigate = useNavigate();

  const handleScan = (cert) => {
    navigate(`/verify?cert=${cert}`);
  };

  const handleCancel = () => {
    setActiveTab('number');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#1B3A6B] text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#1B3A6B] font-bold text-xl">BNP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Bungoma National Polytechnic</h1>
              <p className="text-xs text-slate-300 uppercase tracking-widest">Certificate Verification Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#1B3A6B] mb-4">Validate Your Credentials</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Ensuring the integrity of academic achievements. Please use one of the methods below to verify a certificate's authenticity.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('number')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'number' ? 'text-[#1B3A6B] border-b-2 border-[#1B3A6B] bg-slate-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Verify by Number
            </button>
            <button 
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'qr' ? 'text-[#1B3A6B] border-b-2 border-[#1B3A6B] bg-slate-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Scan QR Code
            </button>
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'file' ? 'text-[#1B3A6B] border-b-2 border-[#1B3A6B] bg-slate-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Upload Certificate
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'number' && (
              <VerifyForm type="number" />
            )}
            {activeTab === 'qr' && (
              <QRScanner onScan={handleScan} onCancel={handleCancel} />
            )}
            {activeTab === 'file' && (
              <VerifyForm type="file" />
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Found a fake certificate? <a href="/report" className="text-[#C9A84C] font-semibold hover:underline">Report forgery here</a>
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Bungoma National Polytechnic. Accredited Institution.
          </p>
        </div>
      </footer>
    </div>
  );
}
