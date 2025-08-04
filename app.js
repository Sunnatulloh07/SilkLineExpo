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
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com"], // Allow Google Maps
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
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
const data = require('./public/data.json');

// Make data available to all views
app.locals.data = data;

// Import routes
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const jwtAuthRoutes = require('./routes/jwtAuth');
const multiDashboardRoutes = require('./routes/multiDashboard');
// const authFixedRoutes = require('./routes/authFixed'); // Merged into main auth routes
const adminRoutes = require('./routes/admin');
const manufacturerRoutes = require('./routes/manufacturer');
const distributorRoutes = require('./routes/distributor');
const userRoutes = require('./routes/user');
const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');

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

// Language switching route (PUBLIC PAGES & DASHBOARD COMPATIBLE)
app.get('/language/:lng', (req, res) => {
  const lng = req.params.lng;
  const supportedLanguages = ['uz', 'en', 'ru', 'fa', 'tr', 'zh'];
  
  if (supportedLanguages.includes(lng)) {
    // Set multiple cookies for compatibility
    res.cookie('i18next', lng, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
      path: '/'
    });
    
    res.cookie('selectedLanguage', lng, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
      path: '/'
    });
    
    // Set session language
    req.session.language = lng;
    
    // Change i18next language
    i18next.changeLanguage(lng);
    
    console.log(`🌐 Language changed to ${lng} via route`);
  }
  
  // Check for explicit redirect parameter (for admin dashboard)
  const redirectTo = req.query.redirect;
  if (redirectTo) {
    const safeRedirect = decodeURIComponent(redirectTo);
    // Add language parameter to redirect URL
    const redirectUrl = new URL(safeRedirect, `${req.protocol}://${req.get('host')}`);
    redirectUrl.searchParams.set('lng', lng);
    return res.redirect(redirectUrl.toString());
  }
  
  // Redirect back to previous page or home
  const referer = req.get('Referer') || '/';
  res.redirect(referer);
});

// ===== ROUTES CONFIGURATION =====
// Order is important - more specific routes first

// ===== PROFESSIONAL DASHBOARD SECURITY SYSTEM =====
const {
    authenticationGuard,
    dashboardAccessControl,
    smartDashboardRouter,
    crossDashboardPrevention,
    dashboardSecurityHeaders
} = require('./middleware/dashboardRouting');

// ===== AUTHENTICATION ROUTES (PUBLIC) =====
// Enhanced Multi-Dashboard Authentication (Production)
app.use('/auth', multiDashboardRoutes);

// ===== LEGACY AUTHENTICATION ROUTES (Backward Compatibility) =====
// Keep for existing integrations and gradual migration
app.use('/auth-legacy', authRoutes);
app.use('/auth-old', jwtAuthRoutes);

// Authentication API routes (for API clients)
app.use('/api/auth', authRoutes);

// Public API routes  
app.use('/api', apiRoutes);

// Legacy route redirects
app.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

// Public pages (NO AUTHENTICATION REQUIRED)
app.use('/', publicRoutes);

// ===== PROTECTED DASHBOARD ROUTES =====
// Apply simplified authentication ONLY to protected routes

// Admin Dashboard (Super Admin, Admin, Moderator)
app.use('/admin', 
    dashboardSecurityHeaders,
    authenticationGuard,
    adminRoutes
);

// Company Dashboards (Company Admins)
app.use('/manufacturer', 
    dashboardSecurityHeaders,
    authenticationGuard,
    manufacturerRoutes
);    

app.use('/distributor', 
    dashboardSecurityHeaders,
    authenticationGuard,
    distributorRoutes
);      

// User Management Routes
app.use('/user', 
    dashboardSecurityHeaders,
    authenticationGuard,
    userRoutes
);

// Universal Dashboard Router (handles /dashboard requests)
app.use('/dashboard', 
    dashboardSecurityHeaders,
    authenticationGuard,
    smartDashboardRouter,
    dashboardRoutes
);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: '404 - Page Not Found - Silk Line Expo',
    data: data
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  
  // Check if it's an API request or AJAX request
  const isApiRequest = req.originalUrl.startsWith('/api/') || 
                      req.originalUrl.startsWith('/auth/') ||
                      req.originalUrl.startsWith('/admin/api/') ||
                      req.get('Content-Type') === 'application/json' ||
                      req.get('X-Requested-With') === 'XMLHttpRequest';
  
  if (isApiRequest) {
    // Return JSON error for API requests
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  
  // Get language preference for HTML responses
  const lng = req.session?.language || 
              req.cookies?.selectedLanguage || 
              req.cookies?.i18next ||
              req.query?.lng || 
              'uz';
  
  // Return HTML error page for regular requests
  res.status(500).render('pages/error', { 
    title: 'Error - Silk Line Expo',
    message: err.message || 'Server xatosi yuz berdi',
    data: data,
    error: process.env.NODE_ENV === 'development' ? err : {},
    user: req.user || null,
    admin: req.user || null,
    lng: lng,
    currentLang: lng,
    t: req.t || ((key) => key)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SLEX Server running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});