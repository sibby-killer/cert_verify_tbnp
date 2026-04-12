import QRCode from 'qrcode';

/**
 * Generates a QR code for the given URL.
 * @param {string} url - The full URL to encode in the QR code.
 * @returns {{ base64: string, dataUrl: string }}
 */
export async function generateQR(url) {
  const options = {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#166534',   // BNP Green
      light: '#FFFFFF'
    }
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, options);
    const base64 = dataUrl.split(',')[1];
    return { base64, dataUrl };
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
}
