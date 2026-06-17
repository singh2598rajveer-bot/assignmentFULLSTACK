const fs = require('fs');
const STORE_FILE = 'attendance.json';

let store = {};

try {
    if (fs.existsSync(STORE_FILE)) {
        store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    }
} catch (error) {
    store = {};
}

function markPresent(rollNumber) {
    if (store[rollNumber]) {
        return { success: false, timestamp: store[rollNumber] };
    }
    
    const timestamp = new Date().toISOString();
    store[rollNumber] = timestamp;
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    
    return { success: true, timestamp };
}

function getStats() {
    const rollNumbers = Object.keys(store).sort();
    return { total: rollNumbers.length, rollNumbers };
}

function getCSV() {
    const rows = [['RollNumber', 'Timestamp']];
    for (const [roll, time] of Object.entries(store)) {
        rows.push([roll, time]);
    }
    return rows.map(r => r.join(',')).join('\n');
}

module.exports = { markPresent, getStats, getCSV };