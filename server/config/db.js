const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri || mongoUri === 'YOUR_MONGODB_ATLAS_CONNECTION_STRING') {
      console.error('Error: Please provide a valid MONGODB_URI or MONGO_URI in server/.env');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'problempool',
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
