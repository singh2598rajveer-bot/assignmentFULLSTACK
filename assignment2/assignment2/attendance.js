const fs = require('fs');
const path = require('path');

const ATTENDANCE_FILE = path.join(__dirname, 'attendance.json');

let store = {};

try {
  const raw = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
  store = JSON.parse(raw);
} catch (err) {
  store = {};
}

function saveStore() {
  fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function markPresent(rollNumber) {
  if (store[rollNumber]) {
    return {
      success: false,
      reason: 'already_marked',
      timestamp: store[rollNumber].timestamp,
    };
  }

  const timestamp = new Date().toISOString();
  store[rollNumber] = { timestamp };
  saveStore();

  return { success: true, timestamp };
}

function getStats() {
  const rollNumbers = Object.keys(store).sort();
  return {
    total: rollNumbers.length,
    rollNumbers,
  };
}

if (require.main === module) {
  console.log('Testing attendance store...');
  console.log('Mark 240157:', markPresent('240157'));
  console.log('Mark 240157 (duplicate):', markPresent('240157'));
  console.log('Mark 240200:', markPresent('240200'));
  console.log('Stats:', getStats());
}

module.exports = { markPresent, getStats };