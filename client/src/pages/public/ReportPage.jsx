import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitReport } from '../../services/verify.api.js';

export default function ReportPage() {
  const [formData, setFormData] = useState({ securityNumber: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport(formData);
      setSuccess(true);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-4">Report Submitted</h2>
          <p className="text-slate-600 mb-8">Thank you for helping us maintain the integrity of our academic credentials. Our security team will investigate this matter.</p>
          <Link to="/" className="inline-block bg-[#1B3A6B] text-white py-3 px-8 rounded-lg font-bold hover:bg-[#152e55] transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-[#1B3A6B] font-semibold flex items-center hover:underline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Portal
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#1B3A6B] p-6 text-white text-center">
            <h2 className="text-2xl font-bold">Report Forgery</h2>
            <p className="opacity-80">Help us investigate suspicious activities</p>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Suspected Security Number</label>
              <input 
                type="text"
                value={formData.securityNumber}
                onChange={(e) => setFormData({...formData, securityNumber: e.target.value.toUpperCase()})}
                placeholder="BNP-..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Suspicion Details</label>
              <textarea 
                rows="4"
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                placeholder="Please describe why you suspect this certificate is not genuine..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none transition-all resize-none"
                required
              ></textarea>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B3A6B] text-white py-4 rounded-lg font-bold shadow-lg hover:bg-[#152e55] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Security Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
