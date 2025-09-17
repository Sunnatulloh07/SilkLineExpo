/**
 * Public API Routes - Clean Architecture
 * Optimized public data access endpoints
 */

const express = require('express');
const router = express.Router();

// Note: public-products routes are now mounted separately in app.js under /api/public
// const publicProductsRoutes = require('./api/public-products');

// Load static data
const data = require('../public/data.json');

// ===== PUBLIC DATA APIs =====

// Countries API
router.get('/countries', (req, res) => {
  try {
    res.json({
      success: true,
      data: data.countries,
      total: data.countries.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries'
    });
  }
});

// Unified Language & Translation API
router.get('/language/:lang', (req, res) => {
  try {
    const { lang } = req.params;
    const supportedLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
    
    if (!supportedLanguages.includes(lang)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }
    
    // Set language cookies
    res.cookie('i18next', lang, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
      path: '/'
    });
    
    res.cookie('selectedLanguage', lang, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
      path: '/'
    });
    
    // Set session language
    if (req.session) {
      req.session.language = lang;
    }
    
    // Load translations
    let translations = {};
    try {
      translations = require(`../locales/${lang}.json`);
    } catch (error) {
      // Load fallback translations
      translations = require(`../locales/uz.json`);
    }
    
    // Check if client wants JSON response (API call)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        data: translations,
        language: lang,
        message: 'Language changed successfully'
      });
    }
    
    // Otherwise redirect (browser navigation)
    const referer = req.get('Referer') || '/';
    // Remove any existing language parameters from referer to avoid conflicts
    const cleanReferer = referer.replace(/[?&]lng=[^&]*/g, '').replace(/[?&]lang=[^&]*/g, '');
    res.redirect(cleanReferer);
    
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to change language'
      });
    }
    
    // Redirect to error page for browser requests
    res.redirect('/?error=language_change_failed');
  }
});

// Products API with advanced filtering
router.get('/products', (req, res) => {
  try {
    const { country, company, category, search, limit = 50, page = 1 } = req.query;
    let products = [];
    
    // Get products based on filters
    if (country && company) {
      products = getProductsByCountryAndCompany(country, company);
    } else if (country) {
      products = getProductsByCountry(country);
    } else {
      products = getAllProducts();
    }
    
    // Apply additional filters
    products = applyProductFilters(products, { category, search });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        total: products.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(products.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Companies API
router.get('/companies', (req, res) => {
  try {
    const { country } = req.query;
    let companies = [];
    
    if (country) {
      const countryData = data.countries.find(c => c.name === country);
      companies = countryData?.companies || [];
    } else {
      companies = data.countries.flatMap(c => c.companies || []);
    }
    
    res.json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// ===== HELPER FUNCTIONS =====

function getProductsByCountryAndCompany(country, company) {
  const countryData = data.countries.find(c => c.name === country);
  if (!countryData) return [];
  
  const companyData = countryData.companies.find(comp => comp.name === company);
  return companyData?.products || [];
}

function getProductsByCountry(country) {
  const countryData = data.countries.find(c => c.name === country);
  if (!countryData) return [];
  
  return countryData.companies.flatMap(comp => comp.products || []);
}

function getAllProducts() {
  return data.countries.flatMap(country => 
    country.companies.flatMap(comp => comp.products || [])
  );
}

function applyProductFilters(products, { category, search }) {
  let filtered = products;
  
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.title?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
  }
  
  return filtered;
}

// ===== PROFESSIONAL PUBLIC PRODUCTS API =====
// NOTE: Public products routes are now mounted directly in app.js under /api/public
// This was moved to prevent authentication middleware conflicts

module.exports = router;