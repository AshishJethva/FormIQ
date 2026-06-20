import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';

const DB =
  process.env.DATABASE?.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD || ''
  ) || '';

async function connectDB() {
  try {
    await mongoose.connect(DB);
    console.log('DB connection successful!');
  } catch (error) {
    console.error('DB connection error:', error);
    process.exit(1);
  }
}
connectDB();

const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT} `);
  });
} catch (error) {
  console.error('Server error:', error);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
