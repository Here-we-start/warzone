# MongoDB Atlas Setup Guide

## 🚀 Complete MongoDB Atlas Configuration

### Step 1: Create MongoDB Atlas Account

1. **Visit MongoDB Atlas**
   - Go to [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
   - Click "Try Free" or "Sign Up"
   - Create account with email or Google/GitHub

2. **Create Organization & Project**
   - Organization: "Your Company" or personal name
   - Project: "Warzone Tournament App"

### Step 2: Create Database Cluster

1. **Choose Deployment Type**
   - Select "Shared" (Free M0 tier)
   - Perfect for development and small production apps

2. **Cloud Provider & Region**
   - **Provider**: AWS (recommended)
   - **Region**: Choose closest to your users
   - **Cluster Tier**: M0 Sandbox (Free Forever)

3. **Cluster Name**
   - Name: `warzone-cluster` or `tournament-cluster`
   - Click "Create Cluster"

### Step 3: Database Security Setup

#### 3.1 Create Database User

1. **Go to Database Access**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"

2. **User Configuration**
   ```
   Authentication Method: Password
   Username: warzone-admin
   Password: [Generate secure password - SAVE THIS!]
   Database User Privileges: Read and write to any database
   ```

3. **Save Credentials**
   ```
   Username: warzone-admin
   Password: [Your generated password]
   ```

#### 3.2 Configure Network Access

1. **Go to Network Access**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"

2. **IP Whitelist Options**

   **Option A: Allow All IPs (Easiest for deployment)**
   ```
   IP Address: 0.0.0.0/0
   Comment: Allow all IPs for cloud deployment
   ```

   **Option B: Specific IPs (More Secure)**
   ```
   Your Development IP: [Your current IP]
   Render.com IPs: Add when you deploy
   Heroku IPs: Add when you deploy
   ```

### Step 4: Get Connection String

1. **Go to Database**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster

2. **Choose Connection Method**
   - Select "Connect your application"
   - Driver: Node.js
   - Version: 4.1 or later

3. **Copy Connection String**
   ```
   mongodb+srv://warzone-admin:<password>@warzone-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Replace Password**
   - Replace `<password>` with your actual database user password
   - Final format:
   ```
   mongodb+srv://warzone-admin:YourActualPassword@warzone-cluster.xxxxx.mongodb.net/warzone-tournaments?retryWrites=true&w=majority
   ```

### Step 5: Database Configuration

1. **Create Database**
   - Database Name: `warzone-tournaments`
   - Collection: Will be created automatically by the app

2. **Connection String with Database**
   ```
   mongodb+srv://warzone-admin:YourPassword@warzone-cluster.xxxxx.mongodb.net/warzone-tournaments?retryWrites=true&w=majority
   ```

## 🔧 Environment Configuration

### Local Development (.env)
```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://warzone-admin:YourPassword@warzone-cluster.xxxxx.mongodb.net/warzone-tournaments?retryWrites=true&w=majority

# Other settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-local-secret-key
```

### Production Deployment

#### Render.com Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://warzone-admin:YourPassword@warzone-cluster.xxxxx.mongodb.net/warzone-tournaments?retryWrites=true&w=majority
FRONTEND_URL=https://your-app-name.netlify.app
SESSION_SECRET=your-production-secret-key
```

#### Heroku Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://warzone-admin:YourPassword@warzone-cluster.xxxxx.mongodb.net/warzone-tournaments?retryWrites=true&w=majority"
heroku config:set FRONTEND_URL=https://your-app-name.netlify.app
heroku config:set SESSION_SECRET=your-production-secret-key
```

## 🛡️ Security Best Practices

### 1. Database User Security
- Use strong, unique passwords
- Create separate users for different environments
- Limit user privileges to minimum required

### 2. Network Security
- Start with specific IP whitelisting
- Add cloud provider IPs as needed
- Monitor access logs regularly

### 3. Connection Security
- Always use SSL/TLS (included in Atlas)
- Use connection string with authentication
- Store credentials in environment variables only

## 📊 Monitoring & Maintenance

### 1. Atlas Dashboard
- Monitor connection count
- Track database operations
- Set up alerts for issues

### 2. Performance Monitoring
- Query performance insights
- Index recommendations
- Storage usage tracking

### 3. Backup & Recovery
- Automatic backups enabled by default
- Point-in-time recovery available
- Download backup snapshots

## 🔍 Testing Your Connection

### 1. Local Testing
```bash
# Test connection with your app
npm run test:connection

# Check health endpoint
curl http://localhost:5000/api/health
```

### 2. Production Testing
```bash
# Test deployed backend
curl https://your-backend-app.render.com/api/health

# Should return:
{
  "success": true,
  "status": "healthy",
  "mongodb": "connected",
  "environment": "production"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check username/password in connection string
   - Verify database user exists and has correct permissions

2. **Connection Timeout**
   - Check IP whitelist settings
   - Verify network connectivity
   - Check firewall settings

3. **Database Not Found**
   - Database will be created automatically on first connection
   - Ensure database name in connection string is correct

4. **SSL/TLS Errors**
   - Atlas requires SSL - ensure your connection string includes SSL parameters
   - Update Node.js if using very old version

### Debug Commands

```bash
# Test MongoDB connection directly
node -e "
const mongoose = require('mongoose');
mongoose.connect('your-connection-string')
  .then(() => console.log('✅ Connected successfully'))
  .catch(err => console.error('❌ Connection failed:', err));
"

# Check DNS resolution
nslookup your-cluster.xxxxx.mongodb.net
```

## 📈 Scaling Considerations

### Free Tier Limits (M0)
- 512 MB storage
- Shared RAM and vCPU
- No backup/restore
- Community support only

### Upgrade Path
- M2/M5: Dedicated clusters with more resources
- Automated backups and point-in-time recovery
- Advanced monitoring and alerting
- Priority support

## 🎯 Next Steps

1. ✅ Complete Atlas setup following this guide
2. ✅ Update your `.env` file with Atlas connection string
3. ✅ Test local connection
4. ✅ Deploy backend to cloud hosting
5. ✅ Configure production environment variables
6. ✅ Test production deployment

---

**🔐 Security Reminder**: Never commit your actual MongoDB connection string to version control. Always use environment variables!