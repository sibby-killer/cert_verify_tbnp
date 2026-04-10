import nodemailer from 'nodemailer';

export async function sendCertificateEmail(studentEmail, data) {
  const { studentName, securityNumber, courseName, qrCodeDataUrl } = data;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Bungoma National Polytechnic" <${process.env.GMAIL_USER}>`,
    to: studentEmail,
    subject: 'Certificate Issued - Bungoma National Polytechnic',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1B3A6B; padding: 20px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0;">Congratulations!</h1>
        </div>
        <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>We are pleased to inform you that your certificate for <strong>${courseName}</strong> has been issued and is now verifiable online.</p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #C9A84C; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0; color: #64748b; font-size: 0.875rem;">Security Number</p>
            <h2 style="margin: 10px 0; color: #1B3A6B; letter-spacing: 2px;">${securityNumber}</h2>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>Scan the QR code below to verify directly:</p>
            <img src="${qrCodeDataUrl}" alt="Verification QR Code" style="width: 200px; height: 200px; border: 1px solid #cbd5e1;" />
          </div>

          <div style="text-align: center;">
            <a href="https://verify.bungomapoly.ac.ke/verify?cert=${securityNumber}" 
               style="background-color: #1B3A6B; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
               Verify Online
            </a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 0.75rem; color: #64748b;">
          <p>&copy; ${new Date().getFullYear()} Bungoma National Polytechnic. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}
