import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

const QRScanner = ({ onScan, onCancel }) => {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let isScanning = true;

    const startScanning = async () => {
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('Camera not available — use the security number tab instead');
          return;
        }

        // Use the first available device
        const selectedDeviceId = videoInputDevices[0].deviceId;
        
        const controls = await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result && isScanning) {
              isScanning = false;
              const qrText = result.getText();
              
              // Visual feedback
              setFlash(true);
              
              // Extract cert from URL if present, otherwise use raw text
              let cert = qrText;
              try {
                const url = new URL(qrText);
                const certParam = url.searchParams.get('cert');
                if (certParam) cert = certParam;
              } catch (e) {
                // Not a URL, use raw text
              }

              // Stop camera immediately
              if (controlsRef.current) {
                controlsRef.current.stop();
              }

              setTimeout(() => {
                onScan(cert);
              }, 500);
            }
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Camera not available — use the security number tab instead');
      }
    };

    startScanning();

    return () => {
      isScanning = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScan]);

  const handleCancel = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
    }
    onCancel();
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black border-4 transition-all duration-300 ${flash ? 'border-green-500' : 'border-slate-200'}`}>
        {!error ? (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-64 object-cover"
            />
            {/* Scan line overlay */}
            <div className="absolute inset-x-0 h-full pointer-events-none">
              <div className="scan-line"></div>
            </div>
            {/* Viewfinder corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg"></div>
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

      <button 
        onClick={handleCancel}
        className="mt-8 px-6 py-2 text-slate-500 font-semibold hover:text-[#1B3A6B] transition-colors"
      >
        Cancel Scanning
      </button>
      
      {!error && (
        <p className="text-sm text-slate-400 mt-4 text-center">
          Scanner is active. Hold the QR code steady within the frame.
        </p>
      )}
    </div>
  );
};

export default QRScanner;
