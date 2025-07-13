// PRODUCTION-READY WARZONE TOURNAMENT SERVER - VERSIONE CORRETTA
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'warzone-tournament-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const app = express();
const httpServer = createServer(app);

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Enhanced Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://codesporttournament.netlify.app",
      "https://*.netlify.app",
      "https://*.bolt.new",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6
});

// Express middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '50mb',
  verify: (req, res, buf) => {
    // Log large payloads
    if (buf.length > 10 * 1024 * 1024) { // 10MB
      logger.warn(`Large payload received: ${buf.length} bytes`, {
        ip: req.ip,
        endpoint: req.path,
        size: buf.length
      });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FILE_SIZE || '50mb' 
}));

// Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://warzone-portal.netlify.app',
        /https:\/\/.*\.netlify\.app$/,
        /https:\/\/.*\.bolt\.new$/
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie']
}));

// Trust proxy for deployment
app.set('trust proxy', 1);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
});

// Enhanced MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/warzone-tournaments';

console.log('🔌 Connecting to MongoDB...');
console.log('📊 MONGODB_URI set:', MONGODB_URI ? 'Yes' : 'No');
console.log('📊 Database type:', MONGODB_URI.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');

logger.info('Connecting to MongoDB...', {
  environment: process.env.NODE_ENV || 'development',
  database: MONGODB_URI.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'
});

// Enhanced MongoDB connection with better error handling
const connectToMongoDB = async () => {
  try {
    console.log('🔄 Attempting MongoDB connection...');
    console.log('📍 Connection string type:', MONGODB_URI.includes('mongodb+srv') ? 'Atlas (Cloud)' : 'Local/Other');
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connected successfully!');
    logger.info('Connected to MongoDB', {
      database: mongoose.connection.db?.databaseName || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    logger.error('MongoDB connection error', { error: error.message, stack: error.stack });
    
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 Exiting due to MongoDB connection failure in production');
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing without MongoDB in development mode');
    }
  }
};

// Connect to MongoDB
connectToMongoDB();

// Enhanced connection monitoring
mongoose.connection.on('error', err => {
  logger.error('MongoDB error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// Helper function to detect MongoDB ObjectId format
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Helper function to find tournament by either _id or custom id
const findTournamentById = async (id) => {
  if (isValidObjectId(id)) {
    return await Tournament.findById(id).lean();
  } else {
    return await Tournament.findOne({ id: id }).lean();
  }
};

// Input validation schemas
const tournamentValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('type').isIn(['Ritorno', 'BR']),
  body('startDate').optional().isISO8601(),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('settings.lobbies').isInt({ min: 1, max: 10 }),
  body('settings.totalMatches').isInt({ min: 1, max: 20 }),
  body('settings.countedMatches').isInt({ min: 1, max: 20 })
];

const teamValidation = [
  body('name').trim().isLength({ min: 1, max: 50 }).escape(),
  body('tournamentId').isLength({ min: 1 }).withMessage('Tournament ID is required'),
  body('playerName').optional().trim().isLength({ max: 50 }).escape(),
  body('clanName').optional().trim().isLength({ max: 50 }).escape()
];

const matchValidation = [
  body('position').isInt({ min: 1, max: 100 }),
  body('kills').isInt({ min: 0, max: 100 }),
  body('teamCode').trim().isLength({ min: 1, max: 20 }).escape(),
  body('tournamentId').isLength({ min: 1 }).withMessage('Tournament ID is required'),
  body('photos').isArray({ max: 5 })
];

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', {
      errors: errors.array(),
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Database Schemas
const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  type: { type: String, enum: ['Ritorno', 'BR'], default: 'Ritorno' },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  startDate: String,
  startTime: { type: String, default: '20:00' },
  createdAt: { type: Number, default: Date.now },
  endedAt: Number,
  completedAt: Number,
  createdBy: { type: String, default: 'admin' },
  assignedManagers: [String],
  settings: {
    lobbies: { type: Number, default: 2, min: 1, max: 10 },
    slotsPerLobby: { type: Number, default: 15, min: 1, max: 100 },
    totalMatches: { type: Number, default: 4, min: 1, max: 20 },
    countedMatches: { type: Number, default: 3, min: 1, max: 20 }
  },
  finalLeaderboard: [mongoose.Schema.Types.Mixed],
  isDemo: { type: Boolean, default: false }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  code: { type: String, required: true, unique: true, maxlength: 20 },
  lobby: String,
  lobbyNumber: Number,
  slotId: String,
  slotNumber: Number,
  createdAt: { type: Number, default: Date.now },
  tournamentId: { type: String, required: true },
  playerName: { type: String, maxlength: 50 },
  clanName: { type: String, maxlength: 50 }
});

const matchSchema = new mongoose.Schema({
  position: { type: Number, required: true, min: 1, max: 100 },
  kills: { type: Number, required: true, min: 0, max: 100 },
  score: { type: Number, required: true, min: 0 },
  teamCode: { type: String, required: true, maxlength: 20 },
  photos: { type: [String], validate: [val => val.length <= 5, 'Photos exceed limit of 5'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Number, default: Date.now },
  reviewedAt: Number,
  reviewedBy: String,
  tournamentId: { type: String, required: true },
  rejectionReason: String
});

const pendingSubmissionSchema = new mongoose.Schema({
  teamCode: { type: String, required: true, maxlength: 20 },
  teamName: { type: String, required: true, maxlength: 50 },
  position: { type: Number, required: true, min: 1, max: 100 },
  kills: { type: Number, required: true, min: 0, max: 100 },
  photos: { type: [String], validate: [val => val.length <= 5, 'Photos exceed limit of 5'] },
  submittedAt: { type: Number, default: Date.now },
  tournamentId: { type: String, required: true }
});

const scoreAdjustmentSchema = new mongoose.Schema({
  teamCode: { type: String, required: true, maxlength: 20 },
  teamName: { type: String, required: true, maxlength: 50 },
  points: { type: Number, required: true, min: -1000, max: 1000 },
  reason: { type: String, required: true, maxlength: 200 },
  type: { type: String, enum: ['penalty', 'reward', 'crash'], required: true },
  appliedAt: { type: Number, default: Date.now },
  appliedBy: { type: String, required: true },
  tournamentId: { type: String, required: true }
});

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  code: { type: String, required: true, unique: true, maxlength: 20 },
  permissions: [String],
  createdAt: { type: Number, default: Date.now },
  createdBy: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true }
});

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, maxlength: 100 },
  details: { type: String, required: true, maxlength: 500 },
  performedBy: { type: String, required: true, maxlength: 50 },
  performedByType: { type: String, enum: ['admin', 'manager', 'team'], required: true },
  timestamp: { type: Number, default: Date.now },
  tournamentId: String,
  targetTeam: String,
  metadata: mongoose.Schema.Types.Mixed
});

// Models
const Tournament = mongoose.model('Tournament', tournamentSchema);
const Team = mongoose.model('Team', teamSchema);
const Match = mongoose.model('Match', matchSchema);
const PendingSubmission = mongoose.model('PendingSubmission', pendingSubmissionSchema);
const ScoreAdjustment = mongoose.model('ScoreAdjustment', scoreAdjustmentSchema);
const Manager = mongoose.model('Manager', managerSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Add indexes for performance
tournamentSchema.index({ status: 1, createdAt: -1 });
teamSchema.index({ tournamentId: 1, code: 1 });
matchSchema.index({ tournamentId: 1, teamCode: 1 });
auditLogSchema.index({ timestamp: -1, tournamentId: 1 });

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id, ip: socket.handshake.address });
  
  socket.on('join-tournament', (tournamentId) => {
    if (typeof tournamentId === 'string' && tournamentId.length <= 50) {
      socket.join(`tournament-${tournamentId}`);
      logger.info('User joined tournament', { 
        socketId: socket.id, 
        tournamentId,
        ip: socket.handshake.address 
      });
    } else {
      logger.warn('Invalid tournament ID in join request', { 
        socketId: socket.id, 
        tournamentId 
      });
    }
  });
  
  socket.on('disconnect', (reason) => {
    logger.info('User disconnected', { 
      socketId: socket.id, 
      reason,
      ip: socket.handshake.address 
    });
  });

  socket.on('error', (error) => {
    logger.error('Socket error', { 
      socketId: socket.id, 
      error: error.message,
      ip: socket.handshake.address 
    });
  });
});

// =====================================
// API ROUTES - TOURNAMENTS
// =====================================

// Get all tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB not connected, returning empty tournaments list', { ip: req.ip });
      return res.json({ 
        success: true,
        tournaments: [],
        warning: 'Database not connected. Please check MongoDB configuration.'
      });
    }
    
    const tournaments = await Tournament.find({ status: { $ne: 'archived' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const formattedTournaments = tournaments.map(tournament => ({
      ...tournament,
      id: tournament._id.toString()
    }));
    
    logger.info('Tournaments fetched', { count: formattedTournaments.length, ip: req.ip });
    
    res.json({ 
      success: true,
      tournaments: formattedTournaments || [] 
    });
  } catch (error) {
    logger.error('Get tournaments error', { error: error.message, ip: req.ip });
    
    if (error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        success: false,
        error: 'Database connection timeout. Please check MongoDB configuration.',
        details: 'MongoDB connection is not established.'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tournaments' 
    });
  }
});

// Get tournament by ID
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await findTournamentById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const responseData = {
      ...tournament,
      id: tournament._id.toString()
    };
    
    res.json({ success: true, tournament: responseData });
  } catch (error) {
    logger.error('Get tournament error', { error: error.message, tournamentId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch tournament' });
  }
});

// Create tournament
app.post('/api/tournaments', tournamentValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('📝 Creating tournament...');
    console.log('📄 Request body:', JSON.stringify(req.body, null, 2));
    
    const { id, ...tournamentData } = req.body;
    
    const tournament = new Tournament(tournamentData);
    await tournament.save();
    
    const responseData = {
      ...tournament.toObject(),
      id: tournament._id.toString()
    };
    
    logger.info('Tournament created', { 
      tournamentId: tournament._id, 
      name: tournament.name,
      ip: req.ip 
    });
    
    io.emit('tournamentCreated', { tournament: responseData });
    
    res.json({ success: true, tournament: responseData });
  } catch (error) {
    console.error('❌ Tournament creation error:', error.message);
    logger.error('Create tournament error', { error: error.message, ip: req.ip });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create tournament',
      details: error.message
    });
  }
});

// Update tournament
app.put('/api/tournaments/:id', tournamentValidation, handleValidationErrors, async (req, res) => {
  try {
    let tournament;
    
    if (isValidObjectId(req.params.id)) {
      tournament = await Tournament.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      );
    } else {
      tournament = await Tournament.findOneAndUpdate(
        { id: req.params.id }, 
        req.body, 
        { new: true, runValidators: true }
      );
    }
    
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    logger.info('Tournament updated', { 
      tournamentId: tournament._id, 
      name: tournament.name,
      ip: req.ip 
    });
    
    const responseData = {
      ...tournament.toObject(),
      id: tournament._id.toString()
    };
    
    io.emit('tournamentUpdated', { tournament: responseData });
    
    res.json({ success: true, tournament: responseData });
  } catch (error) {
    logger.error('Update tournament error', { error: error.message, tournamentId: req.params.id, ip: req.ip });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update tournament',
      details: error.message
    });
  }
});

// Delete tournament
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    let tournament;
    
    if (isValidObjectId(req.params.id)) {
      tournament = await Tournament.findByIdAndDelete(req.params.id);
    } else {
      tournament = await Tournament.findOneAndDelete({ id: req.params.id });
    }
    
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    logger.info('Tournament deleted', { 
      tournamentId: tournament._id, 
      name: tournament.name,
      ip: req.ip 
    });
    
    io.emit('tournamentDeleted', { 
      tournamentId: tournament._id.toString(),
      tournamentName: tournament.name
    });
    
    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    logger.error('Delete tournament error', { error: error.message, tournamentId: req.params.id, ip: req.ip });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete tournament',
      details: error.message
    });
  }
});

// =====================================
// API ROUTES - TEAMS
// =====================================

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    console.log('📡 [API] GET /api/teams - Fetching all teams...');
    
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB not connected, returning empty teams list', { ip: req.ip });
      return res.json({ 
        success: true,
        teams: {},
        warning: 'Database not connected. Please check MongoDB configuration.'
      });
    }
    
    const teams = await Team.find({}).lean();
    console.log(`✅ [API] Found ${teams.length} teams in database`);
    
    // Convert array to object format expected by frontend
    const teamsObject = teams.reduce((acc, team) => {
      const key = team.slotId || 
                  team.lobby || 
                  team._id.toString() || 
                  `${team.tournamentId}-Lobby${team.lobbyNumber || 1}-Slot${team.slotNumber || 1}`;
      
      acc[key] = {
        ...team,
        id: team._id.toString(),
        slotId: team.slotId || key,
        lobby: team.lobby || key
      };
      return acc;
    }, {});
    
    logger.info('Teams fetched', { count: teams.length, ip: req.ip });
    
    res.json({ 
      success: true,
      teams: teamsObject 
    });
  } catch (error) {
    console.error('❌ [API] Error fetching teams:', error);
    logger.error('Get all teams error', { error: error.message, ip: req.ip });
    
    if (error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        success: false,
        error: 'Database connection timeout. Please check MongoDB configuration.'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch teams',
      details: error.message
    });
  }
});

// Get team by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    console.log('📡 [API] GET /api/teams/' + req.params.id);
    
    const team = await Team.findById(req.params.id).lean();
    
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    const responseData = {
      ...team,
      id: team._id.toString()
    };
    
    logger.info('Team fetched', { teamId: req.params.id, name: team.name, ip: req.ip });
    
    res.json({ success: true, team: responseData });
  } catch (error) {
    console.error('❌ [API] Error fetching team:', error);
    logger.error('Get team error', { error: error.message, teamId: req.params.id, ip: req.ip });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch team',
      details: error.message
    });
  }
});

// Get teams for tournament
app.get('/api/tournaments/:id/teams', async (req, res) => {
  try {
    console.log('📡 [API] GET /api/tournaments/' + req.params.id + '/teams');
    
    const tournament = await findTournamentById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const actualTournamentId = tournament._id.toString();
    
    const teams = await Team.find({
      $or: [
        { tournamentId: actualTournamentId },
        { tournamentId: req.params.id }
      ]
    }).lean();
    
    const formattedTeams = teams.map(team => ({
      ...team,
      id: team._id.toString()
    }));
    
    console.log(`✅ Found ${formattedTeams.length} teams for tournament`);
    
    res.json({ success: true, teams: formattedTeams });
  } catch (error) {
    console.error('❌ Get teams error:', error.message);
    logger.error('Get teams error', { error: error.message, tournamentId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch teams' });
  }
});

// Create team
app.post('/api/teams', teamValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('📝 Creating team...');
    console.log('📄 Request body:', JSON.stringify(req.body, null, 2));
    
    // Verify tournament exists
    const tournament = await findTournamentById(req.body.tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const actualTournamentId = tournament._id.toString();
    
    // Create team with enhanced data
    const teamData = {
      ...req.body,
      tournamentId: actualTournamentId,
      slotId: req.body.slotId || `${actualTournamentId}-Lobby${req.body.lobbyNumber || 1}-Slot${req.body.slotNumber || 1}`,
      lobby: req.body.lobby || req.body.slotId || `${actualTournamentId}-Lobby${req.body.lobbyNumber || 1}-Slot${req.body.slotNumber || 1}`
    };
    
    const team = new Team(teamData);
    await team.save();
    
    logger.info('Team created', { 
      teamId: team._id, 
      name: team.name,
      code: team.code,
      tournamentId: team.tournamentId,
      ip: req.ip 
    });
    
    const responseTeamData = {
      ...team.toObject(),
      id: team._id.toString(),
      slotId: team.slotId || team._id.toString(),
      lobby: team.lobby || team.slotId || team._id.toString()
    };
    
    io.to(`tournament-${actualTournamentId}`).emit('teamCreated', { team: responseTeamData });
    io.emit('teamCreated', { team: responseTeamData });
    
    res.json({ success: true, team: responseTeamData });
  } catch (error) {
    console.error('❌ Team creation error:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team code already exists',
        details: 'This team code is already in use'
      });
    }
    
    logger.error('Create team error', { error: error.message, ip: req.ip });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create team',
      details: error.message
    });
  }
});

// Update team
app.put('/api/teams/:id', teamValidation, handleValidationErrors, async (req, res) => {
  try {
    if (req.body.tournamentId) {
      const tournament = await findTournamentById(req.body.tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }
      req.body.tournamentId = tournament._id.toString();
    }
    
    const team = await Team.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    logger.info('Team updated', { 
      teamId: team._id, 
      name: team.name,
      code: team.code,
      ip: req.ip 
    });
    
    const teamData = {
      ...team.toObject(),
      id: team._id.toString()
    };
    io.to(`tournament-${team.tournamentId}`).emit('teamUpdated', { team: teamData });
    io.emit('teamUpdated', { team: teamData });
    
    res.json({ success: true, team: teamData });
  } catch (error) {
    logger.error('Update team error', { error: error.message, teamId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to update team' });
  }
});

// Delete team
app.delete('/api/teams/:id', async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    logger.info('Team deleted', { 
      teamId: req.params.id, 
      name: team.name,
      code: team.code,
      ip: req.ip 
    });
    
    io.to(`tournament-${team.tournamentId}`).emit('teamDeleted', { 
      teamId: req.params.id,
      teamCode: team.code,
      tournamentId: team.tournamentId
    });
    io.emit('teamDeleted', { 
      teamId: req.params.id,
      teamCode: team.code,
      tournamentId: team.tournamentId
    });
    
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    logger.error('Delete team error', { error: error.message, teamId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete team' });
  }
});

// Bulk create teams
app.post('/api/teams/bulk', async (req, res) => {
  try {
    const { teams } = req.body;
    
    if (!Array.isArray(teams)) {
      return res.status(400).json({ success: false, error: 'Teams must be an array' });
    }
    
    const results = [];
    const errors = [];
    
    for (const teamData of teams) {
      try {
        const tournament = await findTournamentById(teamData.tournamentId);
        if (!tournament) {
          errors.push({ teamData, error: 'Tournament not found' });
          continue;
        }
        
        const enhancedTeamData = {
          ...teamData,
          tournamentId: tournament._id.toString(),
          slotId: teamData.slotId || `${tournament._id}-Lobby${teamData.lobbyNumber || 1}-Slot${teamData.slotNumber || 1}`,
          lobby: teamData.lobby || teamData.slotId
        };
        
        const team = new Team(enhancedTeamData);
        await team.save();
        
        results.push({
          ...team.toObject(),
          id: team._id.toString()
        });
      } catch (error) {
        errors.push({ teamData, error: error.message });
      }
    }
    
    logger.info('Bulk team creation', { 
      successful: results.length, 
      failed: errors.length,
      ip: req.ip 
    });
    
    if (results.length > 0) {
      io.emit('bulkTeamsCreated', { teams: results });
    }
    
    res.json({ 
      success: errors.length === 0, 
      created: results.length,
      failed: errors.length,
      teams: results,
      errors: errors
    });
  } catch (error) {
    logger.error('Bulk team creation error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create teams in bulk' });
  }
});

// =====================================
// API ROUTES - MATCHES
// =====================================

// Get matches for tournament
app.get('/api/tournaments/:id/matches', async (req, res) => {
  try {
    const tournament = await findTournamentById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const actualTournamentId = tournament._id.toString();
    
    const matches = await Match.find({
      $or: [
        { tournamentId: actualTournamentId },
        { tournamentId: req.params.id }
      ]
    }).lean();
    
    const formattedMatches = matches.map(match => ({
      ...match,
      id: match._id.toString()
    }));
    
    res.json({ success: true, matches: formattedMatches });
  } catch (error) {
    logger.error('Get matches error', { error: error.message, tournamentId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

// Create match
app.post('/api/matches', matchValidation, handleValidationErrors, async (req, res) => {
  try {
    const tournament = await findTournamentById(req.body.tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const matchData = {
      ...req.body,
      tournamentId: tournament._id.toString()
    };
    
    const match = new Match(matchData);
    await match.save();
    
    logger.info('Match created', { 
      matchId: match._id, 
      teamCode: match.teamCode,
      position: match.position,
      kills: match.kills,
      tournamentId: match.tournamentId,
      ip: req.ip 
    });
    
    const matchResponseData = {
      ...match.toObject(),
      id: match._id.toString()
    };
    io.to(`tournament-${match.tournamentId}`).emit('matchCreated', { match: matchResponseData });
    io.emit('matchCreated', { match: matchResponseData });
    
    res.json({ success: true, match: matchResponseData });
  } catch (error) {
    logger.error('Create match error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create match' });
  }
});

// Update match
app.put('/api/matches/:id', matchValidation, handleValidationErrors, async (req, res) => {
  try {
    if (req.body.tournamentId) {
      const tournament = await findTournamentById(req.body.tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }
      req.body.tournamentId = tournament._id.toString();
    }
    
    const match = await Match.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }
    
    logger.info('Match updated', { 
      matchId: match._id, 
      teamCode: match.teamCode,
      status: match.status,
      ip: req.ip 
    });
    
    const matchData = {
      ...match.toObject(),
      id: match._id.toString()
    };
    io.to(`tournament-${match.tournamentId}`).emit('matchUpdated', { match: matchData });
    io.emit('matchUpdated', { match: matchData });
    
    res.json({ success: true, match: matchData });
  } catch (error) {
    logger.error('Update match error', { error: error.message, matchId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to update match' });
  }
});

// Delete match
app.delete('/api/matches/:id', async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }
    
    logger.info('Match deleted', { 
      matchId: req.params.id, 
      teamCode: match.teamCode,
      ip: req.ip 
    });
    
    io.to(`tournament-${match.tournamentId}`).emit('matchDeleted', { 
      matchId: req.params.id,
      teamCode: match.teamCode,
      tournamentId: match.tournamentId
    });
    io.emit('matchDeleted', { 
      matchId: req.params.id,
      teamCode: match.teamCode,
      tournamentId: match.tournamentId
    });
    
    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    logger.error('Delete match error', { error: error.message, matchId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete match' });
  }
});

// =====================================
// API ROUTES - OTHER ENTITIES
// =====================================

// Pending Submissions endpoints
app.get('/api/pending-submissions', async (req, res) => {
  try {
    const { tournamentId } = req.query;
    let filter = {};
    
    if (tournamentId) {
      const tournament = await findTournamentById(tournamentId);
      if (tournament) {
        filter = { 
          $or: [
            { tournamentId: tournament._id.toString() },
            { tournamentId: tournamentId }
          ]
        };
      } else {
        filter = { tournamentId };
      }
    }
    
    const submissions = await PendingSubmission.find(filter).lean();
    
    const formattedSubmissions = submissions.map(submission => ({
      ...submission,
      id: submission._id.toString()
    }));
    
    res.json({ success: true, pendingSubmissions: formattedSubmissions });
  } catch (error) {
    logger.error('Get pending submissions error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch pending submissions' });
  }
});

app.post('/api/pending-submissions', async (req, res) => {
  try {
    const tournament = await findTournamentById(req.body.tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const submissionData = {
      ...req.body,
      tournamentId: tournament._id.toString()
    };
    
    const submission = new PendingSubmission(submissionData);
    await submission.save();
    
    logger.info('Pending submission created', { 
      submissionId: submission._id, 
      teamCode: submission.teamCode,
      tournamentId: submission.tournamentId,
      ip: req.ip 
    });
    
    const submissionResponseData = {
      ...submission.toObject(),
      id: submission._id.toString()
    };
    io.to(`tournament-${submission.tournamentId}`).emit('pendingSubmissionCreated', { pendingSubmission: submissionResponseData });
    io.emit('pendingSubmissionCreated', { pendingSubmission: submissionResponseData });
    
    res.json({ success: true, pendingSubmission: submissionResponseData });
  } catch (error) {
    logger.error('Create pending submission error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create pending submission' });
  }
});

app.delete('/api/pending-submissions/:id', async (req, res) => {
  try {
    const submission = await PendingSubmission.findByIdAndDelete(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Pending submission not found' });
    }
    
    logger.info('Pending submission deleted', { 
      submissionId: req.params.id, 
      teamCode: submission.teamCode,
      ip: req.ip 
    });
    
    io.to(`tournament-${submission.tournamentId}`).emit('pendingSubmissionDeleted', { 
      submissionId: req.params.id,
      teamCode: submission.teamCode,
      tournamentId: submission.tournamentId
    });
    io.emit('pendingSubmissionDeleted', { 
      submissionId: req.params.id,
      teamCode: submission.teamCode,
      tournamentId: submission.tournamentId
    });
    
    res.json({ success: true, message: 'Pending submission deleted successfully' });
  } catch (error) {
    logger.error('Delete pending submission error', { error: error.message, submissionId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete pending submission' });
  }
});

// Score Adjustments endpoints
app.get('/api/score-adjustments', async (req, res) => {
  try {
    const { tournamentId } = req.query;
    let filter = {};
    
    if (tournamentId) {
      const tournament = await findTournamentById(tournamentId);
      if (tournament) {
        filter = { 
          $or: [
            { tournamentId: tournament._id.toString() },
            { tournamentId: tournamentId }
          ]
        };
      } else {
        filter = { tournamentId };
      }
    }
    
    const adjustments = await ScoreAdjustment.find(filter).lean();
    
    const formattedAdjustments = adjustments.map(adjustment => ({
      ...adjustment,
      id: adjustment._id.toString()
    }));
    
    res.json({ success: true, scoreAdjustments: formattedAdjustments });
  } catch (error) {
    logger.error('Get score adjustments error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch score adjustments' });
  }
});

app.post('/api/score-adjustments', async (req, res) => {
  try {
    const tournament = await findTournamentById(req.body.tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    
    const adjustmentData = {
      ...req.body,
      tournamentId: tournament._id.toString()
    };
    
    const adjustment = new ScoreAdjustment(adjustmentData);
    await adjustment.save();
    
    logger.info('Score adjustment created', { 
      adjustmentId: adjustment._id, 
      teamCode: adjustment.teamCode,
      points: adjustment.points,
      type: adjustment.type,
      tournamentId: adjustment.tournamentId,
      ip: req.ip 
    });
    
    const adjustmentResponseData = {
      ...adjustment.toObject(),
      id: adjustment._id.toString()
    };
    io.to(`tournament-${adjustment.tournamentId}`).emit('scoreAdjustmentCreated', { scoreAdjustment: adjustmentResponseData });
    io.emit('scoreAdjustmentCreated', { scoreAdjustment: adjustmentResponseData });
    
    res.json({ success: true, scoreAdjustment: adjustmentResponseData });
  } catch (error) {
    logger.error('Create score adjustment error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create score adjustment' });
  }
});

app.delete('/api/score-adjustments/:id', async (req, res) => {
  try {
    const adjustment = await ScoreAdjustment.findByIdAndDelete(req.params.id);
    
    if (!adjustment) {
      return res.status(404).json({ success: false, error: 'Score adjustment not found' });
    }
    
    logger.info('Score adjustment deleted', { 
      adjustmentId: req.params.id, 
      teamCode: adjustment.teamCode,
      ip: req.ip 
    });
    
    io.to(`tournament-${adjustment.tournamentId}`).emit('scoreAdjustmentDeleted', { 
      adjustmentId: req.params.id,
      teamCode: adjustment.teamCode,
      tournamentId: adjustment.tournamentId
    });
    io.emit('scoreAdjustmentDeleted', { 
      adjustmentId: req.params.id,
      teamCode: adjustment.teamCode,
      tournamentId: adjustment.tournamentId
    });
    
    res.json({ success: true, message: 'Score adjustment deleted successfully' });
  } catch (error) {
    logger.error('Delete score adjustment error', { error: error.message, adjustmentId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete score adjustment' });
  }
});

// Managers endpoints
app.get('/api/managers', async (req, res) => {
  try {
    const managers = await Manager.find().lean();
    
    const formattedManagers = managers.map(manager => ({
      ...manager,
      id: manager._id.toString()
    }));
    
    res.json({ success: true, managers: formattedManagers });
  } catch (error) {
    logger.error('Get managers error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch managers' });
  }
});

app.post('/api/managers', async (req, res) => {
  try {
    const manager = new Manager(req.body);
    await manager.save();
    
    logger.info('Manager created', { 
      managerId: manager._id, 
      name: manager.name,
      code: manager.code,
      ip: req.ip 
    });
    
    const managerData = {
      ...manager.toObject(),
      id: manager._id.toString()
    };
    io.emit('managerCreated', { manager: managerData });
    
    res.json({ success: true, manager: managerData });
  } catch (error) {
    logger.error('Create manager error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create manager' });
  }
});

app.put('/api/managers/:id', async (req, res) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found' });
    }
    
    logger.info('Manager updated', { 
      managerId: manager._id, 
      name: manager.name,
      code: manager.code,
      ip: req.ip 
    });
    
    const managerData = {
      ...manager.toObject(),
      id: manager._id.toString()
    };
    io.emit('managerUpdated', { manager: managerData });
    
    res.json({ success: true, manager: managerData });
  } catch (error) {
    logger.error('Update manager error', { error: error.message, managerId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to update manager' });
  }
});

app.delete('/api/managers/:id', async (req, res) => {
  try {
    const manager = await Manager.findByIdAndDelete(req.params.id);
    
    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found' });
    }
    
    logger.info('Manager deleted', { 
      managerId: req.params.id, 
      name: manager.name,
      code: manager.code,
      ip: req.ip 
    });
    
    io.emit('managerDeleted', { 
      managerId: req.params.id,
      managerCode: manager.code
    });
    
    res.json({ success: true, message: 'Manager deleted successfully' });
  } catch (error) {
    logger.error('Delete manager error', { error: error.message, managerId: req.params.id, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete manager' });
  }
});

// Audit Logs endpoints
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { tournamentId, limit = 100 } = req.query;
    let filter = {};
    
    if (tournamentId) {
      const tournament = await findTournamentById(tournamentId);
      if (tournament) {
        filter = { 
          $or: [
            { tournamentId: tournament._id.toString() },
            { tournamentId: tournamentId }
          ]
        };
      } else {
        filter = { tournamentId };
      }
    }
    
    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    const formattedAuditLogs = auditLogs.map(log => ({
      ...log,
      id: log._id.toString()
    }));
    
    res.json({ success: true, auditLogs: formattedAuditLogs });
  } catch (error) {
    logger.error('Get audit logs error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    if (req.body.tournamentId) {
      const tournament = await findTournamentById(req.body.tournamentId);
      if (tournament) {
        req.body.tournamentId = tournament._id.toString();
      }
    }
    
    const auditLog = new AuditLog(req.body);
    await auditLog.save();
    
    logger.info('Audit log created', { 
      auditLogId: auditLog._id, 
      action: auditLog.action,
      performedBy: auditLog.performedBy,
      ip: req.ip 
    });
    
    const auditLogData = {
      ...auditLog.toObject(),
      id: auditLog._id.toString()
    };
    io.emit('auditLogCreated', { auditLog: auditLogData });
    
    res.json({ success: true, auditLog: auditLogData });
  } catch (error) {
    logger.error('Create audit log error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create audit log' });
  }
});

// =====================================
// AUTHENTICATION
// =====================================

app.post('/api/auth/login', [
  body('code').trim().isLength({ min: 1, max: 50 }).escape(),
  body('type').isIn(['admin', 'manager', 'team'])
], handleValidationErrors, async (req, res) => {
  try {
    const { code, type } = req.body;
    
    logger.info('Login attempt', { type, ip: req.ip, userAgent: req.get('User-Agent') });
    
    if (type === 'admin') {
      if (code === process.env.ADMIN_CODE_1 || code === process.env.ADMIN_CODE_2 || 
          code === 'MISOKIETI' || code === 'MISOKIETI8') {
        logger.info('Admin login successful', { ip: req.ip });
        return res.json({ success: true, userType: 'admin', identifier: 'admin' });
      }
    } else if (type === 'manager') {
      const manager = await Manager.findOne({ code, isActive: true }).lean();
      if (manager) {
        logger.info('Manager login successful', { managerCode: code, ip: req.ip });
        return res.json({ success: true, userType: 'manager', identifier: code });
      }
    } else if (type === 'team') {
      const team = await Team.findOne({ code }).lean();
      if (team) {
        const tournament = await findTournamentById(team.tournamentId);
        if (tournament && tournament.status === 'active') {
          logger.info('Team login successful', { teamCode: code, tournamentId: team.tournamentId, ip: req.ip });
          return res.json({ 
            success: true, 
            userType: 'team', 
            identifier: code,
            tournamentId: tournament._id.toString()
          });
        }
      }
    }
    
    logger.warn('Login failed', { type, code: code.substring(0, 3) + '***', ip: req.ip });
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  } catch (error) {
    logger.error('Login error', { error: error.message, ip: req.ip });
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// =====================================
// UTILITY ENDPOINTS
// =====================================

// Homepage
app.get('/', (req, res) => {
  res.json({
    message: '🎮 Warzone Tournament API',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/api/health',
      auditLogs: '/api/audit-logs',
      login: '/api/auth/login'
    },
    documentation: 'API successfully deployed'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    console.log('🔍 Health check requested');
    console.log('📊 MongoDB state:', mongoose.connection.readyState);
    
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const healthData = {
      success: true,
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: mongoStates[mongoose.connection.readyState] || 'unknown',
      mongoState: mongoose.connection.readyState,
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      warnings: mongoose.connection.readyState !== 1 ? ['MongoDB not connected'] : []
    };
    
    console.log('✅ Health data prepared:', healthData.status);
    
    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed',
      details: error.message 
    });
  }
});

// =====================================
// ERROR HANDLING & 404
// =====================================

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  logger.error('Server error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip 
  });
  
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(500).json({ 
    success: false, 
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  logger.warn('API endpoint not found', { url: req.url, method: req.method, ip: req.ip });
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// =====================================
// SERVER STARTUP & SHUTDOWN
// =====================================

// Start server
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting server...');
console.log('📊 PORT:', PORT);
console.log('📊 NODE_ENV:', process.env.NODE_ENV);

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('✅ SERVER STARTED ON PORT', PORT);
  console.log('🌐 Server accessible on 0.0.0.0:' + PORT);
  console.log('📊 MongoDB state:', mongoose.connection.readyState);
  
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...',
    frontendUrl: process.env.FRONTEND_URL || 'Not set'
  });
}).on('error', (err) => {
  console.error('❌ SERVER ERROR:', err);
  process.exit(1);
});

console.log('📡 Server listen command executed');

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      logger.info('Server shutdown complete');
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});
