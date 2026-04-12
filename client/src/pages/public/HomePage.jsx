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
      <header className="bg-white text-slate-900 border-b border-green-700 border-b-4 py-4 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/icon-512.png" alt="BNP Logo" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-green-900">Bungoma National Polytechnic</h1>
              <p className="text-xs text-green-700 uppercase tracking-widest font-semibold">Certificate Verification Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-green-900 mb-4">Validate Your Credentials</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Ensuring the integrity of academic achievements. Please use one of the methods below to verify a certificate's authenticity.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('number')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'number' ? 'text-green-800 border-b-2 border-green-700 bg-green-50/30' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Verify by Number
            </button>
            <button 
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'qr' ? 'text-green-800 border-b-2 border-green-700 bg-green-50/30' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Scan QR Code
            </button>
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'file' ? 'text-green-800 border-b-2 border-green-700 bg-green-50/30' : 'text-slate-500 hover:text-slate-700'}`}
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
            Found a fake certificate? <a href="/report" className="text-green-700 font-semibold hover:underline">Report forgery here</a>
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
