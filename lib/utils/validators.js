export function validateSecurityNumber(secNum) {
  // BNP-YY-DEPT-SEQ-SALT
  const regex = /^BNP-\d{2}-[A-Z]+-\d{5}-[A-F0-9]{4}$/;
  return regex.test(secNum);
}

export function validateStudentData(data) {
  const { name, regNumber, email } = data;
  if (!name || name.length < 2) return { valid: false, message: 'Name is too short' };
  if (!regNumber) return { valid: false, message: 'Registration number is required' };
  return { valid: true };
}

export function validateCSVRow(row) {
  const required = ['studentId', 'courseId', 'institutionId', 'issuedDate', 'graduationYear', 'studentEmail'];
  for (const field of required) {
    if (!row[field]) return { valid: false, message: `Missing field: ${field}` };
  }
  return { valid: true };
}

export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}
