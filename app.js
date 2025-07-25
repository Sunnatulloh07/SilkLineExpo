const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const i18next = require('./config/i18n');
const middleware = require('i18next-http-middleware');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Database connection (optional - can work without MongoDB for now)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.log('🔧 Running without database (some features may be limited)');
  });
} else {
  console.log('🔧 MongoDB URI not found - running without database');
}

// Initialize services
const FileService = require('./services/FileService');
const EmailService = require('./services/EmailService');

// Initialize file service directories
FileService.initializeDirectories().catch(console.error);

// Initialize email service
EmailService.initialize().catch(console.error);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'slex-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// i18next middleware
app.use(middleware.handle(i18next));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));

// Load data
const data = require('./data.json');

// Make data available to all views
app.locals.data = data;

// Import routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const jwtAuthRoutes = require('./routes/jwtAuth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const apiRoutes = require('./routes/api');

// Make i18next available to all views
app.use((req, res, next) => {
  // Get current language from cookie or default to 'uz'
  const currentLang = req.cookies.i18next || 'uz';
  
  // Set i18next language for this request
  i18next.changeLanguage(currentLang);
  
  // Create translation function
  res.locals.t = (key, options = {}) => {
    try {
      return i18next.t(key, { lng: currentLang, ...options });
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return key;
    }
  };
  
  res.locals.lng = currentLang;
  res.locals.languages = ['uz', 'en', 'ru', 'fa', 'tr', 'zh'];
  
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html');
});

// Debug route for i18next
app.get('/debug', (req, res) => {
  const currentLang = req.cookies.i18next || 'uz';
  const testTranslation = i18next.t('nav.home', { lng: currentLang });
  
  res.json({
    currentLanguage: currentLang,
    testTranslation: testTranslation,
    availableLanguages: i18next.languages,
    isI18nextReady: i18next.isInitialized,
    cookies: req.cookies
  });
});

// Language switching route
app.get('/language/:lng', (req, res) => {
  const lng = req.params.lng;
  const supportedLanguages = ['uz', 'en', 'ru', 'fa', 'tr', 'zh'];
  
  if (supportedLanguages.includes(lng)) {
    // Set cookie with proper options
    res.cookie('i18next', lng, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
      path: '/'
    });
    
    // Change i18next language
    i18next.changeLanguage(lng);
  }
  
  // Redirect back to previous page or home
  const referer = req.get('Referer') || '/';
  res.redirect(referer);
});

// ===== ROUTES CONFIGURATION =====
// Order is important - more specific routes first

// JWT Authentication routes (modern)
app.use('/auth', jwtAuthRoutes);

// Authentication API routes (legacy)
app.use('/api/auth', authRoutes);

// Public API routes  
app.use('/api', apiRoutes);

// Admin panel routes (protected)
app.use('/admin', adminRoutes);

// User dashboard routes (protected)
app.use('/user', userRoutes);

// Legacy route redirects
app.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

// Public pages (must be last to catch all remaining routes)
app.use('/', publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: '404 - Page Not Found - Silk Line Expo',
    data: data
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Error - Silk Line Expo',
    data: data,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SLEX Server running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});