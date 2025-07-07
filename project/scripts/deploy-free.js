#!/usr/bin/env node

/**
 * Free Hosting Deployment Helper
 * Guides users through free hosting setup
 */

import readline from 'readline';
import { exec } from 'child_process';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function deployToFreeHosting() {
  console.log('🆓 Free Hosting Deployment Helper');
  console.log('=====================================\n');

  console.log('This script will help you deploy your Warzone Tournament App to free hosting services.\n');

  // Step 1: Check prerequisites
  console.log('📋 Step 1: Prerequisites Check');
  
  try {
    await execCommand('git --version');
    console.log('✅ Git is installed');
  } catch (error) {
    console.log('❌ Git is not installed. Please install Git first.');
    rl.close();
    return;
  }

  try {
    await execCommand('npm --version');
    console.log('✅ npm is installed');
  } catch (error) {
    console.log('❌ npm is not installed. Please install Node.js and npm first.');
    rl.close();
    return;
  }

  // Step 2: Check if MongoDB is configured
  console.log('\n📋 Step 2: Database Configuration');
  
  if (!fs.existsSync('.env')) {
    console.log('❌ .env file not found. Please run: npm run setup:atlas');
    rl.close();
    return;
  }

  const envContent = fs.readFileSync('.env', 'utf8');
  if (!envContent.includes('MONGODB_URI=mongodb+srv://')) {
    console.log('❌ MongoDB Atlas not configured. Please run: npm run setup:atlas');
    rl.close();
    return;
  }

  console.log('✅ MongoDB Atlas configured');

  // Step 3: Test local build
  console.log('\n📋 Step 3: Testing Local Build');
  const testBuild = await question('Test local build before deployment? (y/n): ');
  
  if (testBuild.toLowerCase() === 'y') {
    try {
      console.log('🔨 Building application...');
      await execCommand('npm run build');
      console.log('✅ Build successful');
    } catch (error) {
      console.log('❌ Build failed:', error.message);
      console.log('Please fix build errors before deploying.');
      rl.close();
      return;
    }
  }

  // Step 4: Choose hosting provider
  console.log('\n📋 Step 4: Choose Hosting Provider');
  console.log('Recommended free hosting stack:');
  console.log('1. Backend: Render.com (Free tier)');
  console.log('2. Frontend: Netlify (Free tier)');
  console.log('3. Database: MongoDB Atlas (Free tier - already configured)');
  
  const useRecommended = await question('\nUse recommended hosting stack? (y/n): ');
  
  if (useRecommended.toLowerCase() !== 'y') {
    console.log('\n📖 Alternative options:');
    console.log('- Railway.app (Backend with $5 credit)');
    console.log('- Vercel (Frontend alternative)');
    console.log('- See docs/FREE_HOSTING_GUIDE.md for details');
    rl.close();
    return;
  }

  // Step 5: Prepare for deployment
  console.log('\n📋 Step 5: Preparing for Deployment');
  
  // Check if repository is clean
  try {
    const { stdout } = await execCommand('git status --porcelain');
    if (stdout.trim()) {
      console.log('📝 Uncommitted changes detected. Committing...');
      await execCommand('git add .');
      await execCommand('git commit -m "Prepare for production deployment"');
      console.log('✅ Changes committed');
    }
  } catch (error) {
    console.log('⚠️ Git commit failed. Please commit changes manually.');
  }

  // Push to GitHub
  try {
    console.log('📤 Pushing to GitHub...');
    await execCommand('git push origin main');
    console.log('✅ Code pushed to GitHub');
  } catch (error) {
    console.log('⚠️ Git push failed. Please ensure your repository is connected to GitHub.');
  }

  // Step 6: Deployment instructions
  console.log('\n📋 Step 6: Deployment Instructions');
  console.log('\n🔧 BACKEND DEPLOYMENT (Render.com):');
  console.log('1. Visit https://render.com and sign up with GitHub');
  console.log('2. Click "New +" → "Web Service"');
  console.log('3. Connect your GitHub repository');
  console.log('4. Configure:');
  console.log('   - Name: warzone-tournament-api');
  console.log('   - Environment: Node');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: npm start');
  console.log('5. Set Environment Variables:');
  
  // Read current .env and show production values
  const envLines = envContent.split('\n');
  console.log('   Environment Variables to set:');
  envLines.forEach(line => {
    if (line.startsWith('MONGODB_URI=') || 
        line.startsWith('SESSION_SECRET=') || 
        line.startsWith('ADMIN_CODE_')) {
      console.log(`   ${line}`);
    }
  });
  console.log('   NODE_ENV=production');
  console.log('   FRONTEND_URL=https://your-app-name.netlify.app (update after frontend deployment)');
  
  console.log('\n🌐 FRONTEND DEPLOYMENT (Netlify):');
  console.log('1. Visit https://netlify.com and sign up with GitHub');
  console.log('2. Click "New site from Git"');
  console.log('3. Connect your GitHub repository');
  console.log('4. Configure:');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: dist');
  console.log('5. Set Environment Variables:');
  console.log('   VITE_API_URL=https://your-backend-url.onrender.com');
  console.log('   VITE_SOCKET_URL=https://your-backend-url.onrender.com');

  console.log('\n🔄 FINAL STEPS:');
  console.log('1. Deploy backend on Render first');
  console.log('2. Note the backend URL (e.g., https://warzone-tournament-api.onrender.com)');
  console.log('3. Deploy frontend on Netlify');
  console.log('4. Update FRONTEND_URL on Render with your Netlify URL');
  console.log('5. Test the complete application');

  // Step 7: Generate deployment checklist
  console.log('\n📋 Step 7: Generating Deployment Checklist');
  
  const checklist = `# 🚀 Deployment Checklist

## Backend Deployment (Render.com)
- [ ] Render account created with GitHub
- [ ] Web Service created and connected to repository
- [ ] Build Command: npm install
- [ ] Start Command: npm start
- [ ] Environment variables set:
  - [ ] NODE_ENV=production
  - [ ] MONGODB_URI=${envContent.match(/MONGODB_URI=(.+)/)?.[1] || 'YOUR_MONGODB_URI'}
  - [ ] SESSION_SECRET=${envContent.match(/SESSION_SECRET=(.+)/)?.[1] || 'YOUR_SESSION_SECRET'}
  - [ ] ADMIN_CODE_1=${envContent.match(/ADMIN_CODE_1=(.+)/)?.[1] || 'MISOKIETI'}
  - [ ] ADMIN_CODE_2=${envContent.match(/ADMIN_CODE_2=(.+)/)?.[1] || 'MISOKIETI8'}
  - [ ] FRONTEND_URL=https://your-app-name.netlify.app
- [ ] Deployment successful
- [ ] Health check responding: https://your-backend-url.onrender.com/api/health

## Frontend Deployment (Netlify)
- [ ] Netlify account created with GitHub
- [ ] Site created from Git repository
- [ ] Build command: npm run build
- [ ] Publish directory: dist
- [ ] Environment variables set:
  - [ ] VITE_API_URL=https://your-backend-url.onrender.com
  - [ ] VITE_SOCKET_URL=https://your-backend-url.onrender.com
- [ ] Deployment successful
- [ ] Site accessible and functional

## Integration Testing
- [ ] Frontend loads without errors
- [ ] Backend API accessible from frontend
- [ ] Socket.io connection working
- [ ] Database operations working
- [ ] Authentication working (admin codes: MISOKIETI, MISOKIETI8)
- [ ] Real-time updates working
- [ ] Mobile responsiveness verified

## Post-Deployment
- [ ] Update FRONTEND_URL on Render with actual Netlify URL
- [ ] Test complete tournament workflow
- [ ] Monitor application logs
- [ ] Set up uptime monitoring (optional)
- [ ] Configure custom domain (optional)

## 🎉 Success Criteria
Your app is successfully deployed when:
✅ Backend health check returns "healthy" status
✅ Frontend loads and connects to backend
✅ You can log in with admin codes
✅ Real-time features work across multiple browser tabs
✅ Mobile interface is responsive and functional

## 📞 Support
If you encounter issues:
1. Check the deployment logs on Render/Netlify
2. Verify environment variables are set correctly
3. Test MongoDB connection with: npm run test:connection
4. Review docs/FREE_HOSTING_GUIDE.md for troubleshooting

---
Generated on: ${new Date().toISOString()}
Repository: ${await execCommand('git remote get-url origin').then(r => r.stdout.trim()).catch(() => 'Unknown')}
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('✅ Deployment checklist saved to DEPLOYMENT_CHECKLIST.md');

  console.log('\n🎉 Preparation Complete!');
  console.log('=====================================');
  console.log('\n📋 Next Steps:');
  console.log('1. ✅ Code prepared and pushed to GitHub');
  console.log('2. 📖 Follow the deployment instructions above');
  console.log('3. ✅ Use DEPLOYMENT_CHECKLIST.md to track progress');
  console.log('4. 📚 See docs/FREE_HOSTING_GUIDE.md for detailed guide');
  
  console.log('\n🆓 Estimated deployment time: 15-30 minutes');
  console.log('💰 Total monthly cost: $0 (free tiers)');
  
  const openGuide = await question('\nOpen deployment guide in browser? (y/n): ');
  if (openGuide.toLowerCase() === 'y') {
    try {
      await execCommand('open docs/FREE_HOSTING_GUIDE.md');
    } catch (error) {
      console.log('📖 Please manually open docs/FREE_HOSTING_GUIDE.md');
    }
  }

  rl.close();
}

// Run the deployment helper
deployToFreeHosting().catch(error => {
  console.error('❌ Deployment preparation failed:', error.message);
  rl.close();
});