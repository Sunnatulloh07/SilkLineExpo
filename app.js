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
  mongoose.connect(process.env.MONGODB_URI)
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
const NotificationService = require('./services/NotificationService');

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

// Body parsing middleware - ENHANCED for B2B Image Management
app.use(bodyParser.urlencoded({ 
  extended: false,
  limit: '50mb' // Increased for base64 image data
}));
app.use(bodyParser.json({
  limit: '50mb' // Increased for base64 image data
}));
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

// Flash messages middleware
app.use((req, res, next) => {
  // Simple flash implementation
  if (!req.session.flash) {
    req.session.flash = {};
  }
  
  req.flash = function(type, message) {
    if (arguments.length === 1) {
      // Get flash message
      const messages = req.session.flash[type] || [];
      delete req.session.flash[type];
      return messages;
    }
    // Set flash message
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }
    req.session.flash[type].push(message);
  };
  
  next();
});

// i18next middleware
app.use(middleware.handle(i18next));

// Expose auth context to views (safe fallbacks)
app.use((req, res, next) => {
  res.locals.currentUser = req.user || req.session?.user || null;
  res.locals.currentUserRole = (req.session && req.session.role) || (req.user && req.user.role) || null;
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Image request rate limiting middleware
// const ImageRequestLimiter = require('./middleware/imageRequestLimiter');
// const imageRequestLimiter = new ImageRequestLimiter();
// app.use(imageRequestLimiter.middleware());

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
  // Unified language resolution: query -> selectedLanguage cookie -> i18next cookie -> detector -> default
  const resolvedLang = req.query.lng 
    || req.cookies.selectedLanguage 
    || req.cookies.i18next 
    || req.language 
    || 'uz';

  // Persist resolved language into detector cookie for consistency
  if (resolvedLang && req.cookies.i18next !== resolvedLang) {
    res.cookie('i18next', resolvedLang, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false, path: '/' });
  }
  if (resolvedLang && req.cookies.selectedLanguage !== resolvedLang) {
    res.cookie('selectedLanguage', resolvedLang, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false, path: '/' });
  }

  // Set i18next language for this request
  req.language = resolvedLang;
  
  // Change language for i18next instance
  if (i18next.changeLanguage) {
    i18next.changeLanguage(resolvedLang);
  }

  // Create translation function with error handling
  const createTranslationFunction = (lng) => {
    return (key, options = {}) => {
      try {
        // Try with the specific language first
        const translation = i18next.t(key, { lng: lng, ...options });
        
        // If translation returns the key itself, it means translation was not found
        if (translation === key) {
          console.warn(`Missing translation for key: ${key} in language: ${lng}`);
          return key; // Return the key as fallback
        }
        
        return translation;
      } catch (error) {
        console.error('Translation error for key:', key, 'Language:', lng, error);
        return key; // Return the key as fallback
      }
    };
  };

  // Set translation function for both req and res.locals
  const translationFunction = createTranslationFunction(resolvedLang);
  req.t = translationFunction;
  res.locals.t = translationFunction;

  res.locals.lng = resolvedLang;
  res.locals.languages = ['uz', 'en', 'ru', 'fa', 'tr', 'zh'];
  // Expose current URL for language redirect links
  res.locals.currentUrl = req.originalUrl;

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

// ===== PUBLIC API ROUTES FIRST (NO AUTHENTICATION) =====
// Request timing middleware for performance monitoring
const requestTiming = require('./middleware/requestTiming');
app.use('/api/public', requestTiming);

// Public Products API routes (NO AUTHENTICATION REQUIRED)
const publicProductsRoutes = require('./routes/api/public-products');
app.use('/api/public', publicProductsRoutes);

// Countries API routes (Public)
app.use('/api/countries', require('./routes/api/countries'));

// ===== PROTECTED API ROUTES =====
// Authentication API routes (for API clients)
app.use('/api/auth', authRoutes);

// Manufacturer Products API routes (Protected)
app.use('/api/manufacturer/products', require('./routes/api/manufacturer-products'));

// Manufacturer Orders API routes (Protected)
app.use('/api/manufacturer/orders', require('./routes/api/manufacturer-orders'));
app.use('/api/manufacturer/orders', require('./routes/api/manufacturer-orders-detail'));

// Comments API routes (Protected)
// app.use('/api', require('./routes/api/comments'));
// app.use('/api', require('./routes/api/order-comments'));
app.use('/api/comments', require('./routes/api/comments'));
app.use('/api/order-comments', require('./routes/api/order-comments'));

// ===== PROTECTED API ROUTES =====
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

// Buyer Profile Routes (Same as distributor but with /buyer path)
app.use('/buyer', 
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