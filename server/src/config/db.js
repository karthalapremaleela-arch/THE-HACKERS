import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServerInstance = null;
let activeUri = '';

/**
 * Connects to MongoDB, with auto-fallback to embedded MongoMemoryServer
 * @param {string} [customUri]
 * @returns {Promise<string>} Connected MongoDB URI
 */
export async function connectDB(customUri) {
  const envUri = customUri || process.env.MONGODB_URI;

  // If already connected, return current URI
  if (mongoose.connection.readyState === 1) {
    return activeUri || mongoose.connection.client?.s?.url || 'connected';
  }

  // Check if explicit memory mode is requested or if URI is 'memory'
  if (envUri === 'memory' || !envUri) {
    console.log('[Database] Starting embedded MongoDB Memory Server for zero-config local run...');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    activeUri = mongoMemoryServerInstance.getUri();
  } else {
    // Attempt connecting to the supplied URI with a short timeout
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${envUri}`);
      await mongoose.connect(envUri, {
        serverSelectionTimeoutMS: 2500,
      });
      activeUri = envUri;
      console.log(`[Database] Connected successfully to external MongoDB: ${activeUri}`);
      return activeUri;
    } catch (err) {
      console.warn(`[Database] Could not connect to external MongoDB at ${envUri} (${err.message}).`);
      console.log('[Database] Falling back seamlessly to embedded MongoMemoryServer for hackathon demo!');
      mongoMemoryServerInstance = await MongoMemoryServer.create();
      activeUri = mongoMemoryServerInstance.getUri();
    }
  }

  await mongoose.connect(activeUri);
  console.log(`[Database] Connected successfully to embedded MongoDB: ${activeUri}`);
  return activeUri;
}

/**
 * Disconnects from MongoDB and stops in-memory server if running
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
    mongoMemoryServerInstance = null;
  }
}

/**
 * Clears all collections (useful for test resets)
 */
export async function clearDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export default {
  connectDB,
  disconnectDB,
  clearDatabase,
};
