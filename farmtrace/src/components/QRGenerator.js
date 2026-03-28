import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Displays a QR code for a given batch ID
// The QR encodes a URL — when scanned, opens the product page
function QRGenerator({ batchId, size = 140 }) {
  // In production, this URL would be your deployed app
  // For local dev it uses localhost
  const url = `${window.location.origin}/?scan=${batchId}`;

  return (
    <QRCodeSVG
      value={url}
      size={size}
      bgColor="#ffffff"
      fgColor="#2C1A0E"
      level="M"
      includeMargin={true}
    />
  );
}

export default QRGenerator;
