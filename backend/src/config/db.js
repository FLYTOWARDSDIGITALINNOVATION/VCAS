const mongoose = require('mongoose');
const dns = require('dns');

// Fix Node.js on Windows SRV query ECONNREFUSED bug by specifying public DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // fallback to system resolver
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    console.log(`[MongoDB Atlas] Target Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;

