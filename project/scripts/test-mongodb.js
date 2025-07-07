#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * Run with: node scripts/test-mongodb.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  console.log('📝 Please set MONGODB_URI in your .env file');
  console.log('📖 See docs/MONGODB_ATLAS_SETUP.md for instructions');
  process.exit(1);
}

console.log('🔍 Testing MongoDB Atlas Connection...');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
console.log('📍 Database:', MONGODB_URI.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');

// Test connection
async function testConnection() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    console.log('📈 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');

    // Test basic operations
    console.log('\n🧪 Testing basic database operations...');
    
    // Create a test collection
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    }));

    // Insert test document
    const testDoc = new TestModel({ message: 'MongoDB Atlas connection test' });
    await testDoc.save();
    console.log('✅ Test document created successfully');

    // Read test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Test document retrieved successfully');

    // Clean up test document
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log('✅ Test document deleted successfully');

    console.log('\n🎉 All tests passed! MongoDB Atlas is ready for production.');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Error Solutions:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Verify the database user exists in MongoDB Atlas');
      console.log('3. Ensure the user has read/write permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('\n🌐 Network Error Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify IP address is whitelisted in MongoDB Atlas');
      console.log('3. Check firewall settings');
    } else if (error.message.includes('SSL')) {
      console.log('\n🔒 SSL Error Solutions:');
      console.log('1. Ensure your connection string includes SSL parameters');
      console.log('2. Update Node.js to a recent version');
    }
    
    console.log('\n📖 For detailed setup instructions, see: docs/MONGODB_ATLAS_SETUP.md');
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

// Run the test
testConnection();