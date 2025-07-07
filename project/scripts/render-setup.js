#!/usr/bin/env node

/**
 * Render.com Setup Helper
 * Prepares the app for Render deployment
 */

import fs from 'fs';
import { exec } from 'child_process';

console.log('🚀 Render.com Deployment Setup');
console.log('================================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found');
  console.log('📝 Please run: npm run setup:env');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');

// Check MongoDB URI
if (!envContent.includes('MONGODB_URI=mongodb+srv://')) {
  console.log('❌ MongoDB Atlas not configured');
  console.log('📝 Please run: npm run setup:atlas');
  process.exit(1);
}

console.log('✅ Environment configuration found');

// Extract MongoDB URI
const mongoUri = envContent.match(/MONGODB_URI=(.+)/)?.[1];
if (mongoUri) {
  console.log('✅ MongoDB Atlas connection string detected');
}

// Test build
console.log('\n🔨 Testing production build...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Build failed:', error.message);
    console.log('Please fix build errors before deploying to Render');
    process.exit(1);
  }
  
  console.log('✅ Build successful');
  
  // Commit changes
  exec('git add . && git commit -m "Prepare for Render deployment" && git push', (gitError) => {
    if (gitError) {
      console.log('⚠️ Git operations failed. Please commit and push manually.');
    } else {
      console.log('✅ Changes committed and pushed to GitHub');
    }
    
    showRenderInstructions();
  });
});

function showRenderInstructions() {
  console.log('\n🎯 Ready for Render Deployment!');
  console.log('================================\n');
  
  console.log('📋 Follow these steps:');
  console.log('1. Visit https://render.com and sign up with GitHub');
  console.log('2. Click "New +" → "Web Service"');
  console.log('3. Connect your GitHub repository');
  console.log('4. Configure:');
  console.log('   - Name: warzone-tournament-api');
  console.log('   - Environment: Node');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: npm start');
  console.log('\n5. Set Environment Variables:');
  console.log('   NODE_ENV=production');
  
  if (mongoUri) {
    console.log(`   MONGODB_URI=${mongoUri}`);
  }
  
  console.log('   FRONTEND_URL=https://your-app-name.netlify.app');
  console.log('   SESSION_SECRET=warzone-super-secret-key-2025');
  console.log('   ADMIN_CODE_1=MISOKIETI');
  console.log('   ADMIN_CODE_2=MISOKIETI8');
  console.log('   LOG_LEVEL=info');
  console.log('   MAX_FILE_SIZE=50mb');
  
  console.log('\n6. Deploy and test:');
  console.log('   https://your-service-name.onrender.com/api/health');
  
  console.log('\n📖 For detailed instructions, see: docs/RENDER_DEPLOYMENT.md');
  console.log('\n🎉 Your app will be live in 10-15 minutes!');
}