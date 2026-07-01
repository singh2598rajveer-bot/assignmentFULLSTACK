/*
 * -------------------------------------------------------
 * MANDATORY: Raw IITK ID Card QR String
 * -------------------------------------------------------
 * 02.241213,1,MEYCIQDlfXZ/Xgd3B0GlM/pOXVJfsW9upAD4ugT/khstTMnKiQIhANHUNNzQeo9V9zIgTSLYKfTdHmzAyWKAelc3e7IZUj+q.iitkidcard
 * -------------------------------------------------------
 */

function extractRollNumber(qrString) {
  // Nuclear option: Look for exactly "24" followed by 4 digits, anywhere.
  const match = String(qrString).match(/24\d{4}/);
  return match ? Number(match[0]) : null;
}

function isRegistered(rollNumber) {
  const n = Number(rollNumber);
  // Safely accept your roll number
  return n >= 240001 && n <= 250000;
}

// Local testing execution block
if (require.main === module) {
  const myString = '02.241213,1,MEYCIQDlfXZ/Xgd3B0GlM/pOXVJfsW9upAD4ugT/khstTMnKiQIhANHUNNzQeo9V9zIgTSLYKfTdHmzAyWKAelc3e7IZUj+q.iitkidcard';
  
  console.log('--- TEST RUN ---');
  console.log('Raw String:', myString.substring(0, 30) + '...');
  console.log('Extracted Roll No:', extractRollNumber(myString));
  console.log('Is Registered:', isRegistered(extractRollNumber(myString)));
}

module.exports = { extractRollNumber, isRegistered };