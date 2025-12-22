import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

// Connect to a test database before running any tests
export async function connectTestDatabase() {
    try {
        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        await mongoose.connect(uri);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Error connecting to test database:', error);
        throw error;
    }
}

// Disconnect and close connection after all tests
export async function closeTestDatabase() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
        }
        if (mongod) {
            await mongod.stop();
        }
        console.log('Disconnected from test database');
    } catch (error) {
        console.error('Error closing test database:', error);
        throw error;
    }
}

// Clear all test data after each test
export async function clearTestDatabase() {
    if (mongoose.connection.readyState === 0) {
        return; // Not connected, skip cleanup
    }

    const models = mongoose.modelNames();
    for (const modelName of models) {
        await mongoose.model(modelName).deleteMany({});
    }
}
