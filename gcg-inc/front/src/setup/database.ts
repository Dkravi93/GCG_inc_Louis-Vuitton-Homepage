import mongoose from 'mongoose';
import 'dotenv/config';

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  
  if (!mongoUri) {
    console.warn('MONGODB_URI not set. Continuing without DB connection.');
    return;
  }

  try {
    // Configure mongoose settings
    mongoose.set('strictQuery', false);

    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      dbName: process.env.DB_NAME || 'luxury-ecommerce',
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(mongoUri, options);
    isConnected = true;
    console.log(mongoose.connection.db?.databaseName);
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    // Create indexes for better performance
    await createIndexes();

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('🔄 Continuing in development mode without database...');
    }
  }
}

// Create database indexes for performance
async function createIndexes(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Product indexes
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ price: 1 });
    await db.collection('products').createIndex({ createdAt: -1 });
    await db.collection('products').createIndex({ featured: 1 });
    await db.collection('products').createIndex({ status: 1 });

    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });

    // Order indexes
    await db.collection('orders').createIndex({ userId: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });

    // Collection indexes
    await db.collection('collections').createIndex({ slug: 1 }, { unique: true });
    await db.collection('collections').createIndex({ featured: 1 });

    console.log('📈 Database indexes created successfully');
  } catch (error) {
    console.error('⚠️  Index creation failed:', error);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});


