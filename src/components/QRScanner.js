import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('starting');
  // status: 'starting' | 'scanning' | 'success' | 'error' | 'no-camera'

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        // Check camera permission
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setStatus('no-camera');
          return;
        }

        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use rear camera
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // SUCCESS — QR scanned
            setStatus('success');
            html5QrCode.stop().catch(() => {});

            // Extract batch ID from URL or use raw text
            let batchId = decodedText;
            try {
              const url = new URL(decodedText);
              const param = url.searchParams.get('scan');
              if (param) batchId = param;
            } catch {
              // Not a URL — use raw text as batch ID
            }
            onScan(batchId);
          },
          () => {
            // QR not detected yet — normal, keep scanning
            if (status !== 'success') setStatus('scanning');
          }
        );
        setStatus('scanning');
      } catch (err) {
        console.error('Scanner error:', err);
        if (err.toString().includes('permission') || err.toString().includes('NotAllowed')) {
          setStatus('no-camera');
          if (onError) onError('Camera permission denied. Please allow camera access and try again.');
        } else {
          setStatus('error');
          if (onError) onError('Could not start camera. Try entering the batch ID manually.');
        }
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusMessages = {
    starting: '📷 Starting camera...',
    scanning: '🔍 Point camera at QR code',
    success:  '✅ QR code scanned!',
    error:    '❌ Camera error — use manual entry below',
    'no-camera': '📵 No camera found — use manual entry below',
  };

  const statusClass = status === 'success' ? 'success' : status === 'error' || status === 'no-camera' ? 'error' : '';

  return (
    <div>
      {/* Camera view — only show if camera might work */}
      {status !== 'no-camera' && (
        <div className="scanner-wrapper">
          <div id="qr-reader" style={{ width: '100%' }} />
          {status === 'scanning' && (
            <>
              <div className="scan-corners" />
              <div className="scan-line" />
            </>
          )}
        </div>
      )}

      <p className={`scan-status ${statusClass}`}>
        {statusMessages[status] || ''}
      </p>
    </div>
  );
}

export default QRScanner;
