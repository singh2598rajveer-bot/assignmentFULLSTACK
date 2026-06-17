require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { decodeQR } = require('./qr');
const { extractRollNumber } = require('./parser');
const { markPresent, getStats, getCSV } = require('./attendance');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Send me a photo of an IITK ID card to mark attendance.");
});

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1]; 
    
    try {
        const filePath = await bot.downloadFile(photo.file_id, os.tmpdir());
        const qrData = await decodeQR(filePath);
        const rollNumber = extractRollNumber(qrData);
        
        if (!rollNumber) {
            bot.sendMessage(chatId, "QR decoded, but no valid registered roll number found.");
        } else {
            const result = markPresent(rollNumber);
            if (result.success) {
                bot.sendMessage(chatId, `✅ Roll number ${rollNumber} marked present!`);
            } else {
                bot.sendMessage(chatId, `⚠️ Roll number ${rollNumber} already marked at ${result.timestamp}.`);
            }
        }
        fs.unlinkSync(filePath); 
    } catch (error) {
        bot.sendMessage(chatId, "❌ Error processing image or no QR found.");
    }
});

bot.onText(/\/report/, (msg) => {
    const stats = getStats();
    bot.sendMessage(msg.chat.id, `📊 Total Present: ${stats.total}\nRolls:\n${stats.rollNumbers.join('\n')}`);
});

bot.onText(/\/export/, (msg) => {
    const tempPath = path.join(os.tmpdir(), 'attendance.csv');
    fs.writeFileSync(tempPath, getCSV());
    bot.sendDocument(msg.chat.id, tempPath).then(() => fs.unlinkSync(tempPath));
});

console.log("Telegram Bot worker script loaded structure.");