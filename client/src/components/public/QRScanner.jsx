import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

const QRScanner = ({ onScan, onCancel }) => {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [devices, setDevices] = useState([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch (_) {}
      controlsRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (deviceId) => {
    stopScanner();
    setIsStarting(true);
    setError('');

    try {
      const codeReader = new BrowserQRCodeReader();
      let handled = false;

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && !handled) {
            handled = true;
            setFlash(true);

            let cert = result.getText();
            try {
              const url = new URL(cert);
              // Support both /verify/:id path and ?cert= param
              const certParam = url.searchParams.get('cert');
              if (certParam) {
                cert = certParam;
              } else {
                // Extract last path segment e.g. /verify/BNP-2025-XXXX
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length > 0) cert = parts[parts.length - 1];
              }
            } catch (_) { /* raw text */ }

            stopScanner();
            setTimeout(() => onScan(cert), 400);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Camera access denied or not available. Please use the security number tab.');
    } finally {
      setIsStarting(false);
    }
  }, [stopScanner, onScan]);

  // On mount, enumerate devices and prefer back camera
  useEffect(() => {
    const init = async () => {
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('No camera found — use the security number tab instead.');
          return;
        }

        setDevices(videoInputDevices);

        // Prefer back/environment camera
        const backIdx = videoInputDevices.findIndex(d =>
          /back|rear|environment/i.test(d.label)
        );
        const preferredIdx = backIdx >= 0 ? backIdx : 0;
        setActiveDeviceIndex(preferredIdx);
        startScanner(videoInputDevices[preferredIdx].deviceId);
      } catch (err) {
        setError('Camera not available — use the security number tab instead.');
      }
    };
    init();

    return () => stopScanner();
  }, [startScanner, stopScanner]);

  const handleFlip = () => {
    if (devices.length < 2) return;
    const nextIdx = (activeDeviceIndex + 1) % devices.length;
    setActiveDeviceIndex(nextIdx);
    startScanner(devices[nextIdx].deviceId);
  };

  const handleCancel = () => {
    stopScanner();
    onCancel();
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black border-4 transition-all duration-300 ${flash ? 'border-green-500' : 'border-slate-200'}`}>
        {!error ? (
          <>
            <video ref={videoRef} className="w-full h-64 object-cover" />

            {/* Scan overlay */}
            <div className="absolute inset-x-0 h-full pointer-events-none">
              <div className="scan-line"></div>
            </div>

            {/* Viewfinder corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-lg"></div>
            <div className="absolute bottom-16 left-4 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-lg"></div>
            <div className="absolute bottom-16 right-4 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-lg"></div>

            {/* Camera flip button — shown only if multiple cameras available */}
            {devices.length > 1 && (
              <button
                onClick={handleFlip}
                disabled={isStarting}
                title="Switch Camera"
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all disabled:opacity-50"
              >
                {/* Flip / rotate icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* Starting indicator */}
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-64 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
            <svg className="w-12 h-12 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={handleCancel}
          className="px-6 py-2 text-slate-500 font-semibold hover:text-slate-800 transition-colors"
        >
          Cancel Scanning
        </button>
        {devices.length > 1 && !error && (
          <button
            onClick={handleFlip}
            disabled={isStarting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Flip Camera</span>
          </button>
        )}
      </div>

      {!error && (
        <p className="text-sm text-slate-400 mt-3 text-center">
          {isStarting ? 'Starting camera…' : 'Hold the QR code steady within the frame.'}
        </p>
      )}
    </div>
  );
};

export default QRScanner;
