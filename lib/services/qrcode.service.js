import QRCode from 'qrcode';

export async function generateQR(securityNumber) {
  const url = `https://verify.bungomapoly.ac.ke/verify?cert=${securityNumber}`;
  
  const options = {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#1B3A6B',
      light: '#FFFFFF'
    }
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, options);
    // Base64 is the data part after the comma
    const base64 = dataUrl.split(',')[1];
    
    return { base64, dataUrl };
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
}
