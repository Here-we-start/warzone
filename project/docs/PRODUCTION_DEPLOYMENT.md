# Production Deployment Guide

## 🚀 Complete Production Setup

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB Atlas account
- Git repository
- Domain name (optional)

## 🔧 Backend Deployment

### Option 1: Render.com (Recommended)

1. **Create Render Account**
   - Visit [render.com](https://render.com)
   - Connect your GitHub account

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Configure settings:
     ```
     Name: warzone-tournament-api
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     Port: 10000
     ```

3. **Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warzone-tournaments
   FRONTEND_URL=https://your-app-name.netlify.app
   SESSION_SECRET=your-secure-random-string-64-chars-long
   ADMIN_CODE_1=MISOKIETI
   ADMIN_CODE_2=MISOKIETI8
   LOG_LEVEL=info
   MAX_FILE_SIZE=50mb
   PORT=10000
   ```

4. **Deploy**
   - Render will automatically deploy on git push
   - Monitor logs for any issues

### 🚀 Raccomandazioni per Produzione

#### Upgrade Hosting Plans per Prestazioni Ottimali

**Render.com:**
- **Free Tier**: Limitato a 750 ore/mese, "sleep mode" dopo 15 minuti di inattività
- **Starter ($7/mese)**: ✅ **RACCOMANDATO** - Elimina sleep mode, uptime 24/7, prestazioni migliori
- **Standard ($25/mese)**: Per applicazioni con molti utenti simultanei, più memoria e CPU

**Netlify:**
- **Free Tier**: 100GB bandwidth/mese, 300 minuti build/mese
- **Pro ($19/mese)**: ✅ **RACCOMANDATO** - 400GB bandwidth, build più veloci, funzionalità avanzate
- **Business ($99/mese)**: Per applicazioni enterprise

**MongoDB Atlas:**
- **M0 (Free)**: 512MB storage, cluster condiviso
- **M2 ($9/mese)**: ✅ **RACCOMANDATO** - Cluster dedicato, backup automatici, prestazioni migliori
- **M5 ($25/mese)**: Per applicazioni con molti utenti simultanei

#### Configurazioni Ottimali per Multi-Utente

**Backend (Render):**
```bash
# Variabili aggiuntive per prestazioni
WEB_CONCURRENCY=2
MAX_CONNECTIONS=100
KEEP_ALIVE_TIMEOUT=65000
HEADERS_TIMEOUT=66000
```

**Database (MongoDB Atlas):**
- Abilita connection pooling (già configurato nel codice)
- Configura indici per query frequenti:
  ```javascript
  // Indici raccomandati
  db.tournaments.createIndex({ status: 1, createdAt: -1 })
  db.teams.createIndex({ tournamentId: 1, code: 1 })
  db.matches.createIndex({ tournamentId: 1, teamCode: 1, status: 1 })
  ```

**Socket.io Ottimizzazioni:**
- Configurato per gestire fino a 1000 connessioni simultanee
- Heartbeat ogni 25 secondi per mantenere connessioni attive
- Automatic reconnection per resilienza di rete

#### Monitoraggio e Alerting

**Render Dashboard:**
- Monitora CPU e memoria usage
- Configura alerting per downtime
- Rivedi logs regolarmente

**MongoDB Atlas:**
- Abilita Performance Advisor
- Configura alerting per connessioni e storage
- Monitora query performance

**Netlify:**
- Monitora bandwidth usage
- Configura notifiche per build failures
- Ottimizza asset per ridurre dimensioni
### Option 2: Railway

1. **Create Railway Account**
   - Visit [railway.app](https://railway.app)
   - Connect GitHub account

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js

3. **Environment Variables**
   - Add the same variables as Render
   - Railway provides a PostgreSQL addon if needed

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create warzone-tournament-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your-mongodb-connection-string"
   heroku config:set FRONTEND_URL=https://your-app-name.netlify.app
   heroku config:set SESSION_SECRET=your-secure-secret
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🌐 Frontend Deployment (Netlify)

### Automatic Deployment

1. **Connect Repository**
   - Visit [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   ```bash
   VITE_API_URL=https://your-backend-app.render.com
   VITE_SOCKET_URL=https://your-backend-app.render.com
   VITE_LOG_LEVEL=warn
   ```

4. **Deploy**
   - Netlify automatically deploys on git push
   - Custom domain can be configured in settings

### Manual Deployment

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

## 🔒 Security Configuration

### SSL/TLS Certificates
- **Render**: Automatic SSL certificates
- **Netlify**: Automatic SSL certificates
- **Heroku**: Automatic SSL certificates
- **Custom Domain**: Configure DNS and SSL

### Environment Security
```bash
# Generate secure session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Use strong MongoDB passwords
# Enable MongoDB Atlas IP whitelisting
# Configure CORS for production domains only
```

### Rate Limiting
The application includes built-in rate limiting:
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes

## 📊 Process Management with PM2

### Local PM2 Setup
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
npm run pm2:start

# Monitor processes
npm run pm2:monitor

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop
```

### PM2 on Production Server
```bash
# Install PM2 on server
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor with PM2 Plus (optional)
pm2 link <secret_key> <public_key>
```

## 📈 Monitoring & Logging

### Application Logs
- **Development**: Console output with colors
- **Production**: File-based logging with Winston
- **Log Files**: `logs/error.log`, `logs/combined.log`

### Health Monitoring
```bash
# Health check endpoint
curl https://your-api-domain.com/api/health

# Expected response
{
  "success": true,
  "status": "healthy",
  "mongodb": "connected",
  "environment": "production",
  "uptime": 3600
}
```

### Performance Monitoring
- **PM2 Monitoring**: Built-in process monitoring
- **Application Metrics**: Memory usage, CPU, response times
- **Database Monitoring**: MongoDB Atlas provides built-in monitoring

## 🔧 Database Configuration

### MongoDB Atlas Production Setup

1. **Cluster Configuration**
   - Use M2+ tier for production (M0 for testing)
   - Enable automated backups
   - Configure alerts for high usage

2. **Security**
   ```bash
   # Create production database user
   Username: warzone-prod-user
   Password: [Generate strong password]
   Privileges: Read and write to warzone-tournaments database
   ```

3. **Network Security**
   ```bash
   # Add production server IPs
   Render.com: Add in Network Access
   Heroku: Add in Network Access
   Railway: Add in Network Access
   
   # Or allow all IPs (less secure but simpler)
   IP: 0.0.0.0/0
   ```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Domain name configured (optional)
- [ ] Rate limiting tested
- [ ] Security headers verified

### Backend Deployment
- [ ] Repository connected to hosting service
- [ ] Build and start commands configured
- [ ] Environment variables set
- [ ] Health check endpoint responding
- [ ] Database connection verified
- [ ] Logs accessible

### Frontend Deployment
- [ ] Build command configured
- [ ] Environment variables set
- [ ] API connection verified
- [ ] Socket.io connection working
- [ ] All routes accessible
- [ ] Mobile responsiveness verified

### Post-Deployment
- [ ] Full application testing
- [ ] Performance monitoring setup
- [ ] Backup procedures verified
- [ ] Error tracking configured
- [ ] Documentation updated

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```bash
   # Check FRONTEND_URL environment variable
   # Verify CORS configuration in server.js
   # Ensure protocol (http/https) matches
   ```

2. **Database Connection Issues**
   ```bash
   # Verify MongoDB URI format
   # Check IP whitelist in MongoDB Atlas
   # Test connection with npm run test:connection
   ```

3. **Environment Variables**
   ```bash
   # Verify all required variables are set
   # Check for typos in variable names
   # Ensure values are properly escaped
   ```

4. **Build Failures**
   ```bash
   # Check Node.js version compatibility
   # Verify all dependencies are installed
   # Review build logs for specific errors
   ```

### Debug Commands

```bash
# Test MongoDB connection
npm run test:connection

# Check API health
curl https://your-api-domain.com/api/health

# View application logs
npm run pm2:logs

# Monitor processes
npm run pm2:monitor
```

## 📋 Maintenance

### Regular Tasks
- Monitor application logs
- Check database performance
- Update dependencies
- Review security alerts
- Backup database
- Monitor SSL certificate expiration

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit

# Deploy updates
git push origin main
```

## 🎯 Performance Optimization

### Backend Optimizations
- PM2 cluster mode for multi-core usage
- MongoDB connection pooling
- Response compression
- Static file caching
- Rate limiting

### Frontend Optimizations
- Code splitting with Vite
- Image optimization
- CDN for static assets
- Service worker for caching
- Bundle size monitoring

---

**🔐 Security Reminder**: Always use HTTPS in production, keep dependencies updated, and monitor for security vulnerabilities!