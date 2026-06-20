import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Validate all required env vars before anything starts
const REQUIRED_ENV_VARS = [
  'DATABASE',
  'DATABASE_PASSWORD',
  'JWT_SECRET',
  'FRONTEND_URL',
  'GROQ_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

import app from './app';

const DB = process.env.DATABASE!.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD!
);
const PORT = process.env.PORT || 5000;

// MongoDB event handlers
mongoose.connection.on('disconnected', () => {
  console.error('⚠️  MongoDB disconnected');
});
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error:', err.message);
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

async function connectDB() {
  await mongoose.connect(DB, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ DB connection successful');
}

// Graceful shutdown — Railway sends SIGTERM on deploy/restart
const gracefulShutdown = async (signal: string, server: any) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled rejection:', err?.message);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught exception:', err?.message);
  process.exit(1);
});

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   NODE_ENV   : ${process.env.NODE_ENV}`);
      console.log(`   Frontend   : ${process.env.FRONTEND_URL}`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
