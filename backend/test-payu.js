#!/usr/bin/env node

/**
 * PayU Integration Test Script
 * This script tests the PayU service configuration and hash generation
 */

const crypto = require('crypto');

// Test PayU configuration
const testConfig = {
  merchantKey: 'gtKFFx',
  salt: 'eCwWELxi',
  environment: 'test'
};

// Test payment data
const testPaymentData = {
  txnid: 'TXN_TEST_123456789',
  amount: '100.00',
  productinfo: 'Test Product',
  firstname: 'John',
  email: 'john@example.com',
  phone: '9999999999',
  surl: 'http://localhost:5173/payment/success',
  furl: 'http://localhost:5173/payment/failure',
  udf1: 'ORDER_123',
  udf2: 'GCG_EYEWEAR'
};

// Generate payment hash
function generatePaymentHash(paymentData) {
  const { txnid, amount, productinfo, firstname, email } = paymentData;
  const hashString = `${testConfig.merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${testConfig.salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

// Generate reverse hash for verification
function generateReverseHash(responseData) {
  const { status, email, firstname, productinfo, amount, txnid } = responseData;
  const hashString = `${testConfig.salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${testConfig.merchantKey}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

// Test the hash generation
console.log('🧪 Testing PayU Integration...\n');

console.log('📋 Test Configuration:');
console.log(`Merchant Key: ${testConfig.merchantKey}`);
console.log(`Salt: ${testConfig.salt}`);
console.log(`Environment: ${testConfig.environment}\n`);

console.log('💳 Test Payment Data:');
console.log(JSON.stringify(testPaymentData, null, 2));

const paymentHash = generatePaymentHash(testPaymentData);
console.log(`\n🔐 Generated Payment Hash: ${paymentHash}`);

// Test reverse hash with success response
const successResponse = {
  status: 'success',
  email: 'john@example.com',
  firstname: 'John',
  productinfo: 'Test Product',
  amount: '100.00',
  txnid: 'TXN_TEST_123456789',
  hash: 'test_hash'
};

const reverseHash = generateReverseHash(successResponse);
console.log(`🔍 Generated Reverse Hash: ${reverseHash}`);

console.log('\n✅ PayU Integration Test Complete!');
console.log('\n📝 Next Steps:');
console.log('1. Copy backend/env.example to backend/.env');
console.log('2. Update the environment variables with your actual PayU credentials');
console.log('3. Start the backend server: npm run dev');
console.log('4. Start the frontend server: npm run dev');
console.log('5. Test the checkout flow with test credentials');
