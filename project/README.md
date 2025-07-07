# Warzone Tournament Management System

A comprehensive, real-time tournament management application for Call of Duty: Warzone competitions.

## 🚀 Features

- **Real-time Tournament Management**: Live updates using Socket.io
- **Multi-role Access**: Admin, Manager, and Team interfaces
- **Score Tracking**: Automated scoring with customizable multipliers
- **Photo Submissions**: Teams can submit match screenshots for verification
- **Audit Logging**: Complete activity tracking for transparency
- **Mobile Responsive**: Optimized for all devices
- **Cloud-Ready**: Designed for production deployment

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom ice-themed design
- **Icons**: Lucide React
- **Real-time**: Socket.io client
- **Deployment**: Netlify (static hosting)

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io server
- **Authentication**: Code-based access control
- **Deployment**: Cloud hosting (Render, Heroku, Railway, etc.)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd warzone-tournament-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your local MongoDB URI and other settings
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```
   This starts both the backend (port 5000) and frontend (port 5173) concurrently.

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 🌐 Production Deployment

### Step 1: Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a free account and new cluster

2. **Configure Database**
   - Create database user with read/write permissions
   - Configure network access (whitelist IPs or allow all: 0.0.0.0/0)
   - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/warzone-tournaments`

### Step 2: Backend Deployment

#### Option A: Render (Recommended)
1. **Connect Repository**
   - Link your GitHub repository to Render
   - Select "Web Service" deployment

2. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warzone-tournaments
   FRONTEND_URL=https://your-app-name.netlify.app
   SESSION_SECRET=your-secure-random-string
   PORT=10000
   ```

**IMPORTANTE**: Per garantire prestazioni ottimali e supporto per più utenti simultanei, considera l'upgrade ai piani a pagamento:
- **Render Starter ($7/mese)**: Elimina il "sleep mode", garantisce uptime 24/7 e prestazioni migliori
- **Render Standard ($25/mese)**: Risorse dedicate, maggiore memoria e CPU per gestire più utenti

#### Option B: Heroku
1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warzone-tournaments
   heroku config:set FRONTEND_URL=https://your-app-name.netlify.app
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Step 3: Frontend Deployment (Netlify)

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Set build directory to `dist`

2. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

3. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend-app.render.com
   VITE_SOCKET_URL=https://your-backend-app.render.com
   ```

**IMPORTANTE**: Per garantire prestazioni ottimali e supporto per più traffico:
- **Netlify Pro ($19/mese)**: Maggiore bandwidth (400GB vs 100GB), build più veloci, e funzionalità avanzate
- **Netlify Business ($99/mese)**: Per applicazioni enterprise con traffico elevato

### Step 4: Ottimizzazioni per Produzione

#### Database (MongoDB Atlas)
- **M2 Cluster ($9/mese)**: Cluster dedicato con backup automatici e prestazioni migliori
- **M5 Cluster ($25/mese)**: Per applicazioni con molti utenti simultanei
- Configura indici per ottimizzare le query più frequenti
- Abilita il monitoring per tenere traccia delle prestazioni

#### Monitoraggio e Scalabilità
- Configura alerting per uptime e prestazioni
- Implementa logging centralizzato per debugging
- Considera l'uso di CDN per asset statici
- Monitora l'utilizzo di memoria e CPU del backend

#### Sicurezza
- Usa HTTPS per tutte le comunicazioni
- Configura CORS correttamente per l'ambiente di produzione
- Implementa rate limiting per prevenire abusi
- Mantieni aggiornate tutte le dipendenze
4. **Deploy**
   - Netlify will automatically deploy on git push

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warzone-tournaments

# Server
PORT=5000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://your-app-name.netlify.app

# Security
SESSION_SECRET=your-secure-random-string

# Admin Codes
ADMIN_CODE_1=MISOKIETI
ADMIN_CODE_2=MISOKIETI8
```

#### Frontend (Netlify Environment Variables)
```bash
VITE_API_URL=https://your-backend-app.render.com
VITE_SOCKET_URL=https://your-backend-app.render.com
```

## 🎮 Usage

### Access Levels

1. **Public View**
   - View active tournaments and leaderboards
   - No authentication required

2. **Team Access**
   - Submit match results with photos
   - View team statistics
   - Access code provided by admin

3. **Manager Access**
   - Approve/reject team submissions
   - Apply score adjustments
   - Manage tournament settings
   - Access code provided by admin

4. **Admin Access**
   - Full tournament management
   - Create tournaments and teams
   - Manage managers
   - View audit logs
   - Access codes: `MISOKIETI` or `MISOKIETI8`

### Tournament Flow

1. **Admin creates tournament** with settings (lobbies, matches, etc.)
2. **Admin registers teams** and distributes access codes
3. **Teams submit match results** with screenshot proof
4. **Managers review and approve** submissions
5. **Real-time leaderboard updates** for all users
6. **Admin completes tournament** and archives results

## 🔒 Security Features

- **Code-based Authentication**: No passwords, secure access codes
- **CORS Protection**: Restricted to allowed origins
- **Input Validation**: Server-side validation for all inputs
- **Audit Logging**: Complete activity tracking
- **Environment Variables**: Sensitive data protection
- **Production Hardening**: Enhanced error handling and security headers

## 📱 Mobile Support

- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Large touch targets and gestures
- **Camera Integration**: Direct photo capture on mobile devices
- **Offline Resilience**: Local storage backup and sync

## 🔄 Real-time Features

- **Live Leaderboards**: Instant score updates
- **Submission Notifications**: Real-time approval status
- **Cross-device Sync**: Changes reflected across all connected devices
- **Connection Monitoring**: Automatic reconnection handling
- **OBS Streaming Integration**: Real-time tournament overlays for streaming
- **Multiple Overlay Types**: Minimal, compact, full leaderboard displays
- **Customizable Themes**: Dark, light, and transparent overlay options

## 🛡️ Data Backup & Recovery

- **Multiple Storage Layers**: localStorage, sessionStorage, IndexedDB
- **Automatic Backups**: Emergency data preservation
- **Data Validation**: Integrity checks and recovery
- **Cross-tab Sync**: BroadcastChannel for real-time updates

## 📊 Monitoring & Debugging

### Health Check Endpoint
```bash
GET /api/health
```
Returns server status, database connection, and system information.

### Connection Testing
```bash
npm run test:connection
```
Tests MongoDB connection and server startup.

### Logs
- **Development**: Console logging with detailed information
- **Production**: Structured logging with error tracking

## 🎥 OBS Streaming Integration

### Features
- **Real-time Tournament Overlays**: Live updating leaderboards for streaming
- **Multiple Overlay Types**: 
  - Minimal (200x100px) - Corner display
  - Compact (350x400px) - Side panel
  - Leaderboard (500x600px) - Central overlay
  - Full (600x500px) - Complete tournament display
- **Customizable Themes**: Dark, light, and transparent backgrounds
- **Auto-refresh**: Configurable update intervals (1-30 seconds)
- **QR Code Generation**: Easy mobile access to streaming URLs
- **OBS Configuration Export**: Automatic scene setup files

### Setup Instructions

1. **Access OBS Plugin Manager**
   - Login as Admin
   - Click "OBS" button in the header
   - Select active tournament

2. **Configure Overlay**
   - Choose overlay type and theme
   - Set refresh rate and display options
   - Generate streaming URL

3. **OBS Studio Setup**
   - Add "Browser Source" to your scene
   - Paste the generated URL
   - Set recommended dimensions
   - Enable "Shutdown source when not visible"
   - Enable "Refresh browser when scene becomes active"

4. **Automatic Setup**
   - Download OBS configuration file
   - Import scene collection in OBS
   - Activate "Tournament_Stream" scene

### Streaming URLs
```
Format: https://your-domain.com/stream?tournament=ID&overlay=TYPE&theme=THEME&logos=BOOL&stats=BOOL&refresh=MS

Example: https://warzone-portal.netlify.app/stream?tournament=blackcrow-123&overlay=leaderboard&theme=dark&logos=true&stats=true&refresh=5000
```

### Recommended Dimensions
- **Minimal**: 250x100px (corner overlay)
- **Compact**: 350x400px (side panel)
- **Leaderboard**: 500x600px (main overlay)
- **Full**: 600x500px (full screen)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software developed by BM Solution.

## 🆘 Support

For technical support or deployment assistance, contact the development team.

---

**© 2025 BM Solution - Advanced Tournament Management System v4.0**