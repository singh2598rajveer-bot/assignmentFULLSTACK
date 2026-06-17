

function extractRollNumber(qrString) {
    const matches = qrString.match(/\b\d{6}\b/g);
    if (matches) {
        return matches.find(num => isRegistered(num)) || null;
    }
    return null;
}

function isRegistered(rollNumber) {
    const num = Number(rollNumber);
    return num >= 240001 && num <= 240400;
}

module.exports = { extractRollNumber, isRegistered };