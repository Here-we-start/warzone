# 🚀 Render.com Deployment Guide

## Quick Setup for Warzone Tournament App

### Your MongoDB Connection String
```bash
mongodb+srv://chahbounibadr:siritna3si@cluster0.dfidjct.mongodb.net/warzone-tournaments?retryWrites=true&w=majority
```

## Step 1: Create Render Account

1. **Visit Render.com**
   - Go to [https://render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with your GitHub account

2. **Connect GitHub Repository**
   - Authorize Render to access your repositories
   - Select your warzone tournament repository

## Step 2: Create Web Service

1. **New Web Service**
   - Click "New +" in the top right
   - Select "Web Service"
   - Choose your GitHub repository

2. **Configure Service Settings**
   ```
   Name: warzone-tournament-api
   Environment: Node
   Region: Oregon (US West) or Frankfurt (Europe)
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

## Step 3: Set Environment Variables

In the Render dashboard, add these environment variables:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://chahbounibadr:siritna3si@cluster0.dfidjct.mongodb.net/warzone-tournaments?retryWrites=true&w=majority
FRONTEND_URL=https://warzone-portal.netlify.app
SESSION_SECRET=warzone-super-secret-key-2025-production
ADMIN_CODE_1=MISOKIETI
ADMIN_CODE_2=MISOKIETI8
LOG_LEVEL=info
MAX_FILE_SIZE=50mb
```

## Step 4: Deploy Backend

1. **Start Deployment**
   - Click "Create Web Service"
   - Render will automatically start building and deploying
   - Wait for deployment to complete (5-10 minutes)

2. **Note Your Backend URL**
   - Your backend will be available at: `https://warzone-tournament-api.onrender.com`
   - Or similar URL based on your service name

## Step 5: Test Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/api/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "mongodb": "connected",
  "environment": "production"
}
```

## Step 6: Deploy Frontend to Netlify

1. **Create Netlify Account**
   - Visit [https://netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy Site**
   - Click "New site from Git"
   - Connect your GitHub repository
   - Configure:
     ```
     Build command: npm run build
     Publish directory: dist
     ```

3. **Set Frontend Environment Variables**
   ```bash
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```

## Step 7: Update CORS Settings

1. **Update Backend Environment Variables**
   - Go back to your Render dashboard
   - Update `FRONTEND_URL` with your actual Netlify URL
   - Example: `FRONTEND_URL=https://warzone-portal.netlify.app`

2. **Redeploy Backend**
   - Render will automatically redeploy with new settings

## 🎉 Your App is Live!

- **Backend**: `https://warzone-tournament-api.onrender.com`
- **Frontend**: `https://warzone-portal.netlify.app`
- **Database**: MongoDB Atlas (already configured)

## 🔧 Render.com Features

### Free Tier Benefits
- ✅ 750 hours/month (enough for 24/7)
- ✅ Automatic SSL certificates
- ✅ GitHub integration
- ✅ Environment variables
- ✅ Custom domains
- ✅ Automatic deployments

### Limitations
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Cold start delay (10-30 seconds)
- ⚠️ 750 hours/month limit

## 📊 Monitoring Your Deployment

### Render Dashboard
- View deployment logs
- Monitor service status
- Check resource usage
- Configure alerts

### Health Monitoring
```bash
# Set up a simple uptime monitor
# Ping your health endpoint every 14 minutes to prevent sleep
curl https://your-backend-url.onrender.com/api/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version in logs
   - Verify package.json scripts
   - Review build logs for errors

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify MongoDB URI format

3. **CORS Errors**
   - Verify FRONTEND_URL is set correctly
   - Check that frontend URL matches exactly
   - Ensure protocol (https) is correct

### Debug Commands
```bash
# Check service logs in Render dashboard
# Test API endpoints
curl https://your-backend-url.onrender.com/api/tournaments

# Test MongoDB connection
# (This is done automatically in health check)
```

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing)
- **Render.com**: Free (750 hours/month)
- **Netlify**: Free (100GB bandwidth)
- **MongoDB Atlas**: Free (512MB storage)
- **Total**: $0/month

### Paid Upgrade Path
- **Render Starter**: $7/month (no sleep, better performance)
- **Netlify Pro**: $19/month (more bandwidth)
- **MongoDB M2**: $9/month (dedicated cluster)

## 🎯 Next Steps

1. ✅ Backend deployed to Render
2. ✅ Frontend deployed to Netlify
3. ✅ Database connected to MongoDB Atlas
4. 🔄 Test complete application workflow
5. 📱 Verify mobile responsiveness
6. 🔒 Test authentication with admin codes
7. ⚡ Set up uptime monitoring (optional)
8. 🌐 Configure custom domain (optional)

---

**🎉 Congratulations! Your Warzone Tournament Management System is now live and accessible worldwide!**