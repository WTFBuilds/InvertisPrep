import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connection pool tuning for Render (1GB RAM on paid tier)
    // maxPoolSize: 50, minPoolSize: 5
    // socketTimeoutMS: 45000 (45s for long operations)
    // serverSelectionTimeoutMS: 10000 (fail fast if no server)
    // heartbeatFrequencyMS: 10000 (check connection health every 10s)
    // family: 4 (force IPv4 to avoid DNS issues)
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      family: 4,
    });

    console.log(`��� MongoDB Connected: ${conn.connection.host}`);
    console.log(`���� Database: ${conn.connection.name}`);
    console.log(`���� Connection Pool: max=50, min=5`);
  } catch (error) {
    console.error('��� MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('������  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('��� MongoDB error:', error);
});

mongoose.connection.on('connected', () => {
  console.log('���� MongoDB connection established');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});