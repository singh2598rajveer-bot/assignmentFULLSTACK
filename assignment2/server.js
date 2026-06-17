const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { decodeQR } = require('./qr');
const { extractRollNumber, isRegistered } = require('./parser');
const { markPresent, getStats, getCSV } = require('./attendance');

const app = express();
const PORT = 3000;
const upload = multer({ dest: 'uploads/' });

// Parse URL-encoded bodies for the manual form
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const stats = getStats();
    const rows = stats.rollNumbers.map(roll => `<li>🎓 Roll Number: <strong>${roll}</strong></li>`).join('');
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Attendance Dashboard</title>
            <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f4f7f6; color: #333; }
                .box { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 25px; }
                button { background: #0070f3; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; font-size: 16px; margin-top: 10px;}
                button:hover { background: #0051cb; }
                .list { background: #fafafa; border: 1px solid #ddd; padding: 15px; border-radius: 6px; max-height: 150px; overflow-y: auto; }
                .csv-btn { background: #333; color: white; text-decoration: none; padding: 10px 15px; border-radius: 6px; display: inline-block; margin-top: 10px; font-size: 14px; }
                input[type="text"] { width: calc(100% - 22px); padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
                hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h2>📋 Attendance System Dashboard</h2>
            <div class="box">
                <h3>📷 Option 1: Scan ID Card</h3>
                <form action="/scan" method="POST" enctype="multipart/form-data">
                    <input type="file" name="idcard" accept="image/*" required style="margin-bottom: 15px; display: block;"/>
                    <button type="submit">Upload & Process QR</button>
                </form>
                
                <hr>
                
                <h3>⌨️ Option 2: Manual Entry Override</h3>
                <p style="font-size: 13px; color: #666;">Use if the QR scanner fails to read the image.</p>
                <form action="/manual" method="POST">
                    <input type="text" name="rollNumber" placeholder="Enter 6-digit Roll No (e.g. 240150)" required />
                    <button type="submit" style="background: #28a745;">Mark Present Manually</button>
                </form>
            </div>
            <div class="box">
                <h3>Live Registry Stats (Total: ${stats.total})</h3>
                <div class="list"><ul>${rows || '<li>No students logged yet.</li>'}</ul></div>
                <a href="/download-csv" class="csv-btn">📥 Download Registry (CSV)</a>
            </div>
        </body>
        </html>
    `);
});

// Original QR Scan Route
app.post('/scan', upload.single('idcard'), async (req, res) => {
    if (!req.file) return res.send('<h3>Error: No file uploaded. <a href="/">Back</a></h3>');
    try {
        const data = await decodeQR(req.file.path);
        const roll = extractRollNumber(data);
        if (!roll) {
            return res.send(`<h3>❌ Invalid ID Content. No registered roll number found (240001-240400).</h3><p>Data: ${data}</p><a href="/">Back</a>`);
        }
        const record = markPresent(roll);
        if (record.success) {
            res.send(`<h3 style="color:green">✅ Success! Marked Present: ${roll}</h3><a href="/">Back to Dashboard</a>`);
        } else {
            res.send(`<h3 style="color:orange">⚠️ Notice: ${roll} is already marked present.</h3><a href="/">Back to Dashboard</a>`);
        }
    } catch (e) {
        res.send(`<h3>❌ Failed: System could not locate a crisp QR block. <a href="/">Try again</a> or use the Manual Override.</h3>`);
    } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
});

// NEW: Manual Override Route
app.post('/manual', (req, res) => {
    const roll = req.body.rollNumber.trim();
    
    if (!/^\d{6}$/.test(roll) || !isRegistered(roll)) {
        return res.send(`<h3>❌ Invalid Roll Number. Must be exactly 6 digits between 240001 and 240400.</h3><a href="/">Back</a>`);
    }

    const record = markPresent(roll);
    if (record.success) {
        res.send(`<h3 style="color:green">✅ Success! Manually Marked Present: ${roll}</h3><a href="/">Back to Dashboard</a>`);
    } else {
        res.send(`<h3 style="color:orange">⚠️ Notice: ${roll} is already marked present.</h3><a href="/">Back to Dashboard</a>`);
    }
});

app.get('/download-csv', (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.send(getCSV());
});

app.listen(PORT, () => console.log(`🚀 App UI running at http://localhost:${PORT}`));