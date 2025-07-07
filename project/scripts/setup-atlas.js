#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Helper Script
 * Guides users through Atlas configuration
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAtlas() {
  console.log('🚀 MongoDB Atlas Setup Helper');
  console.log('=====================================\n');

  console.log('This script will help you configure MongoDB Atlas for your Warzone Tournament App.\n');

  // Step 1: Check if user has Atlas account
  console.log('📋 Step 1: MongoDB Atlas Account');
  const hasAccount = await question('Do you have a MongoDB Atlas account? (y/n): ');
  
  if (hasAccount.toLowerCase() !== 'y') {
    console.log('\n🌐 Please create a MongoDB Atlas account:');
    console.log('1. Visit: https://cloud.mongodb.com/');
    console.log('2. Click "Try Free" to create an account');
    console.log('3. Verify your email address');
    console.log('4. Run this script again after creating your account\n');
    rl.close();
    return;
  }

  // Step 2: Get connection string
  console.log('\n📋 Step 2: Database Connection');
  console.log('Please provide your MongoDB Atlas connection string.');
  console.log('Format: mongodb+srv://username:password@cluster.mongodb.net/database\n');
  
  const connectionString = await question('Enter your MongoDB Atlas connection string: ');
  
  if (!connectionString.includes('mongodb+srv://')) {
    console.log('❌ Invalid connection string format. Please ensure it starts with mongodb+srv://');
    rl.close();
    return;
  }

  // Step 3: Environment setup
  console.log('\n📋 Step 3: Environment Configuration');
  const environment = await question('Environment (development/production): ') || 'development';
  const frontendUrl = await question('Frontend URL (e.g., https://your-app.netlify.app): ') || 'http://localhost:5173';
  const sessionSecret = await question('Session secret (leave blank for auto-generated): ') || generateRandomSecret();

  // Step 4: Create .env file
  console.log('\n📋 Step 4: Creating Environment File');
  
  const envContent = `# ===========================================
# WARZONE TOURNAMENT APP - ENVIRONMENT VARIABLES
# Generated on ${new Date().toISOString()}
# ===========================================

# Server Configuration
PORT=5000
NODE_ENV=${environment}

# Database Configuration (MongoDB Atlas)
MONGODB_URI=${connectionString}

# Frontend Configuration
FRONTEND_URL=${frontendUrl}

# Security Configuration
SESSION_SECRET=${sessionSecret}

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,${frontendUrl}

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
    console.log('✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    rl.close();
    return;
  }

  // Step 5: Test connection
  console.log('\n📋 Step 5: Testing Connection');
  const testConnection = await question('Test MongoDB connection now? (y/n): ');
  
  if (testConnection.toLowerCase() === 'y') {
    console.log('\n🔍 Testing MongoDB Atlas connection...');
    
    try {
      // Import and run the test script
      const { exec } = await import('child_process');
      exec('node scripts/test-mongodb.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Connection test failed:', error.message);
        } else {
          console.log(stdout);
        }
        
        if (stderr) {
          console.error('Warnings:', stderr);
        }
        
        showNextSteps();
        rl.close();
      });
    } catch (error) {
      console.error('❌ Could not run connection test:', error.message);
      showNextSteps();
      rl.close();
    }
  } else {
    showNextSteps();
    rl.close();
  }
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function showNextSteps() {
  console.log('\n🎉 MongoDB Atlas Setup Complete!');
  console.log('=====================================');
  console.log('\n📋 Next Steps:');
  console.log('1. ✅ MongoDB Atlas configured');
  console.log('2. ✅ Environment variables set');
  console.log('3. 🔄 Test your local development server:');
  console.log('   npm run dev');
  console.log('4. 🚀 Deploy to production:');
  console.log('   - Deploy backend to Render/Heroku/Railway');
  console.log('   - Deploy frontend to Netlify');
  console.log('   - Set environment variables on hosting platforms');
  console.log('\n📖 For detailed deployment instructions, see: docs/MONGODB_ATLAS_SETUP.md');
  console.log('\n🔧 To test MongoDB connection: npm run test:connection');
}

// Run the setup
setupAtlas().catch(error => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
});