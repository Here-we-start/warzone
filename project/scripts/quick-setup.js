#!/usr/bin/env node

/**
 * Quick Setup Script for Development
 * Creates basic environment configuration
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Quick Development Setup');
console.log('==========================\n');

// Check if .env already exists
if (fs.existsSync('.env')) {
  console.log('✅ .env file already exists');
  console.log('📝 To reconfigure MongoDB, run: npm run setup:atlas\n');
} else {
  console.log('📝 Creating basic .env file for development...');
  
  const envContent = `# ===========================================
# WARZONE TOURNAMENT APP - DEVELOPMENT CONFIG
# Generated on ${new Date().toISOString()}
# ===========================================

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# Replace with your MongoDB Atlas connection string
MONGODB_URI=mongodb://localhost:27017/warzone-tournaments

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Security Configuration
SESSION_SECRET=dev-secret-key-change-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5000

# Socket.io Configuration
SOCKET_CORS_ORIGIN=*

# Admin Credentials
ADMIN_CODE_1=MISOKIETI
ADMIN_CODE_2=MISOKIETI8

# File Upload Configuration
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created successfully!\n');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
}

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
  console.log('✅ Logs directory created');
}

console.log('📋 Next Steps:');
console.log('==============');
console.log('1. 🗄️  Set up MongoDB Atlas:');
console.log('   npm run setup:atlas');
console.log('');
console.log('2. 🚀 Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('3. 🌐 Open your browser to:');
console.log('   http://localhost:5173');
console.log('');
console.log('💡 The app will work with limited functionality until MongoDB is configured.');
console.log('   Run "npm run setup:atlas" to connect to MongoDB Atlas.');