const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Set public DNS servers to resolve MongoDB SRV records reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);


    console.log(`✔ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Listen for database connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
