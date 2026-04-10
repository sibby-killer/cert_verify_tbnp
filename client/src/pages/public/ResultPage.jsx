import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyByNumber } from '../../services/verify.api.js';
import ResultValid from '../../components/public/ResultValid.jsx';
import ResultInvalid from '../../components/public/ResultInvalid.jsx';
import ResultRevoked from '../../components/public/ResultRevoked.jsx';

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const certNum = searchParams.get('cert');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function performVerify() {
      if (!certNum) {
        setLoading(false);
        return;
      }
      try {
        const res = await verifyByNumber(certNum);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    performVerify();
  }, [certNum]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B]"></div>
      </div>
    );
  }

  const certificate = data?.certificate;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-[#1B3A6B] font-semibold flex items-center hover:underline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Verification
          </Link>
        </div>

        {!data ? (
          <ResultInvalid securityNumber={certNum} />
        ) : certificate.status === 'valid' ? (
          <ResultValid data={data} />
        ) : certificate.status === 'revoked' ? (
          <ResultRevoked data={data} />
        ) : (
          <ResultInvalid securityNumber={certNum} />
        )}
      </div>
    </div>
  );
}
