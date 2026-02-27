import mongoose from 'mongoose';

let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/polling-system';

  try {
    // Set mongoose options
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    retryCount = 0; // Reset retry count on successful connection
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    isConnected = false;

    // Retry connection logic
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying connection... (${retryCount}/${MAX_RETRIES})`);
      console.log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
      
      setTimeout(() => {
        connectDB();
      }, RETRY_DELAY);
    } else {
      console.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      console.error('Please check if MongoDB is running and the connection string is correct');
      // Don't exit process in development, allow manual retry
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB disconnected gracefully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};