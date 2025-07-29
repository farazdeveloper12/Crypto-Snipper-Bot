// mongo-test.js
// Simple script to test MongoDB connection
// Run with: node mongo-test.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongoConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    // Get connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }
    
    // Print sanitized URI (for debugging, hide password)
    const sanitizedUri = mongoURI.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Connecting to: ${sanitizedUri}`);
    
    // Attempt to connect
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Create a test schema and model
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    // Use a unique collection name to avoid conflicts
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    // Create a test document
    const testDoc = await TestModel.create({
      name: 'Connection Test',
    });
    
    console.log('✅ Successfully created test document:', testDoc._id.toString());
    
    // Clean up by removing the test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document removed');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
    console.log('🎉 All tests passed! Your MongoDB connection is working correctly.');
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:');
    console.error(`Error: ${error.message}`);
    
    // Provide helpful error diagnostics
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔍 Diagnosis: Cannot reach MongoDB server');
      console.error('   Possible causes:');
      console.error('   - Your IP is not whitelisted in MongoDB Atlas');
      console.error('   - Network/firewall issues');
      console.error('   - MongoDB Atlas server is down');
      console.error('\n📋 Solution: Go to MongoDB Atlas → Network Access and add your current IP');
    }
    
    if (error.name === 'MongoError' && error.code === 18) {
      console.error('\n🔍 Diagnosis: Authentication failed');
      console.error('   Possible causes:');
      console.error('   - Incorrect username or password in your connection string');
      console.error('   - User doesn\'t have access to this database');
      console.error('\n📋 Solution: Verify your credentials in MongoDB Atlas → Database Access');
    }
    
    if (error.name === 'MongoParseError') {
      console.error('\n🔍 Diagnosis: Invalid connection string format');
      console.error('   Possible causes:');
      console.error('   - Malformed MongoDB URI');
      console.error('   - Special characters in password not properly URL-encoded');
      console.error('\n📋 Solution: Get a fresh connection string from MongoDB Atlas');
    }
  }
}

testMongoConnection();