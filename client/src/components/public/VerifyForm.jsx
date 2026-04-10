import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyByNumber, verifyByFile } from '../../services/verify.api.js';

export default function VerifyForm({ type }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (type === 'number') {
        result = await verifyByNumber(value);
      } else {
        // Handle file upload
        const fileInput = document.getElementById('cert-file');
        if (fileInput.files.length === 0) {
          setError('Please select a file');
          setLoading(false);
          return;
        }
        result = await verifyByFile(fileInput.files[0]);
      }

      if (result.success) {
        navigate(`/verify?cert=${result.data.certificate.securityNumber}`);
      } else {
        navigate(`/verify?status=invalid&num=${value}`);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type === 'number' ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Certificate Security Number</label>
          <input 
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="e.g. BNP-24-COMP-00001-ABCD"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent outline-none transition-all"
            required
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-10 hover:border-[#1B3A6B] transition-colors bg-slate-50">
          <input 
            type="file" 
            id="cert-file"
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setValue(e.target.files[0]?.name || '')}
          />
          <label htmlFor="cert-file" className="cursor-pointer text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1B3A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-[#1B3A6B] font-semibold">{value || 'Choose a file to upload'}</p>
            <p className="text-sm text-slate-400 mt-2">PDF, PNG or JPG (Max 5MB)</p>
          </label>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-[#1B3A6B] text-white py-4 rounded-lg font-bold shadow-lg hover:bg-[#152e55] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying...' : 'Verify Now'}
      </button>
    </form>
  );
}
