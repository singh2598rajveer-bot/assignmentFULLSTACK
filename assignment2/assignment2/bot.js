require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { decodeQR } = require('./qr');
const { extractRollNumber, isRegistered } = require('./parser');
const { markPresent, getStats } = require('./attendance');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is not set. Please configure your .env file.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('QR Attendance Bot is running...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `👋 *Welcome to the QR Attendance Bot!*\n\n` +
      `📸 Send a photo of a student's IITK ID card to mark attendance.\n\n` +
      `📊 Use /report to see current attendance stats.\n` +
      `📁 Use /export to download a CSV of attendance records.`,
    { parse_mode: 'Markdown' }
  );
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;

  try {
    const photoArray = msg.photo;
    const fileId = photoArray[photoArray.length - 1].file_id;

    await bot.sendMessage(chatId, '🔍 Processing image, please wait...');

    await bot.downloadFile(fileId, os.tmpdir());
    const downloadedPath = path.join(os.tmpdir(), fileId);

    let qrData;
    try {
      qrData = await decodeQR(downloadedPath);
    } catch (err) {
      await bot.sendMessage(chatId, '❌ No QR code found in this image. Please send a clear photo of the IITK ID card.');
      cleanupFile(downloadedPath);
      return;
    }

    const rollNumber = extractRollNumber(qrData);
    if (!rollNumber) {
      await bot.sendMessage(chatId, '⚠️ QR code found, but no valid roll number could be extracted.\n\nRaw QR data: `' + qrData + '`', { parse_mode: 'Markdown' });
      cleanupFile(downloadedPath);
      return;
    }

    if (!isRegistered(rollNumber)) {
      await bot.sendMessage(chatId, `🚫 Roll number *${rollNumber}* is out of the registered range (240001–240400). Student is not registered.`, { parse_mode: 'Markdown' });
      cleanupFile(downloadedPath);
      return;
    }

    const result = markPresent(rollNumber);

    if (result.success) {
      await bot.sendMessage(
        chatId,
        `✅ *Attendance Marked!*\n\n` +
          `🎓 Roll Number: \`${rollNumber}\`\n` +
          `🕐 Time: ${new Date(result.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      const markedAt = new Date(result.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      await bot.sendMessage(
        chatId,
        `⚠️ *Already Marked!*\n\n` +
          `🎓 Roll Number: \`${rollNumber}\`\n` +
          `🕐 Originally marked at: ${markedAt}`,
        { parse_mode: 'Markdown' }
      );
    }

    cleanupFile(downloadedPath);
  } catch (err) {
    console.error('Unexpected error in photo handler:', err);
    await bot.sendMessage(chatId, '❌ An unexpected error occurred. Please try again.');
  }
});

bot.onText(/\/report/, (msg) => {
  const chatId = msg.chat.id;
  const stats = getStats();

  if (stats.total === 0) {
    bot.sendMessage(chatId, '📊 *Attendance Report*\n\nNo students marked present yet.', { parse_mode: 'Markdown' });
    return;
  }

  const rollList = stats.rollNumbers.map((r, i) => `${i + 1}. \`${r}\``).join('\n');

  bot.sendMessage(
    chatId,
    `📊 *Attendance Report*\n\n` +
      `👥 Total Present: *${stats.total}*\n\n` +
      `📋 Roll Numbers:\n${rollList}`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/export/, async (msg) => {
  const chatId = msg.chat.id;
  const stats = getStats();

  if (stats.total === 0) {
    bot.sendMessage(chatId, '📁 No attendance data to export yet.');
    return;
  }

  try {
    const attendanceFile = path.join(__dirname, 'attendance.json');
    const storeData = JSON.parse(fs.readFileSync(attendanceFile, 'utf8'));

    const header = 'RollNumber,Timestamp';
    const rows = stats.rollNumbers.map((roll) => `${roll},${storeData[roll].timestamp}`);
    const csvContent = [header, ...rows].join('\n');

    const csvPath = path.join(os.tmpdir(), `attendance_export_${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    await bot.sendDocument(chatId, csvPath, {}, { filename: 'attendance.csv', contentType: 'text/csv' });

    cleanupFile(csvPath);
  } catch (err) {
    console.error('Export error:', err);
    bot.sendMessage(chatId, '❌ Failed to generate CSV export.');
  }
});

function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) { }
}

process.on('SIGINT', () => {
  console.log('\nBot shutting down...');
  bot.stopPolling();
  process.exit(0);
});