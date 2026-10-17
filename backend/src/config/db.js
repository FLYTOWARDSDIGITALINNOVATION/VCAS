const mongoose = require('mongoose');
const dns = require('dns');

// Fix Node.js on Windows DNS resolver by setting reliable public DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // fallback to system resolver
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to avoid ENOTFOUND / IPv6 lookup issues on Windows
    });
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    console.log(`[MongoDB Atlas] Target Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection Error: ${error.message}`);
    // Auto-retry connection after 5 seconds instead of letting queries fail silently
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Atlas] Disconnected. Reconnecting...');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Atlas] Runtime Error:', err.message);
});

module.exports = connectDB;

