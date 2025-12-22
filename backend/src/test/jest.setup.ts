// Mock environment variables FIRST (before any imports)
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.PAYU_MERCHANT_KEY = 'test-merchant-key';
process.env.PAYU_MERCHANT_SALT = 'test-merchant-salt';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Mock external services
jest.mock('../services/emailService');
jest.mock('../services/cacheService');

// Import test database utilities
import { connectTestDatabase, closeTestDatabase, clearTestDatabase } from './utils/testDb';

// Setup before all tests
beforeAll(async () => {
    await connectTestDatabase();
}, 60000); // 60 second timeout for database setup

// Cleanup after all tests
afterAll(async () => {
    await closeTestDatabase();
}, 60000);

// Clear database after each test
afterEach(async () => {
    await clearTestDatabase();
});

// Suppress console logs during tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging
    error: originalConsole.error,
};
