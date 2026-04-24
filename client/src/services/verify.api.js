import axios from 'axios';

export const verifyByNumber = async (cert) => {
  const response = await axios.get(`/api/v1/verify`, { params: { cert } });
  return response.data;
};

// QR scanner uses internal logic to parse and then call verifyByNumber
// File verification is a placeholder for now as per hobby plan limits, 
// but we can route it to verifyByNumber if we extract the ID client side.
export const verifyByFile = async (file) => {
  // Logic to 'extract' if we had a client side OCR, for now simulate
  return { success: false, message: 'Visual verification requires manual check or standard login' };
};

export const submitReport = async (data) => {
  const response = await axios.post('/api/report', data);
  return response.data;
};
