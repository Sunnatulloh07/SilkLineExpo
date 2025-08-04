/**
 * Public Routes - Clean Architecture
 * Public pages and authentication UI only
 */

const express = require('express');
const AuthControllerClass = require('../controllers/AuthController');

const router = express.Router();

// Create AuthController instance and bind methods
const AuthController = new AuthControllerClass();
const boundAuthMethods = {
  showLoginPage: AuthController.showLoginPage.bind(AuthController),
  showRegisterPage: AuthController.showRegisterPage.bind(AuthController),
  showPasswordResetForm: AuthController.showPasswordResetForm.bind(AuthController)
};

// Load static data
const data = require('../public/data.json');

// Homepage
router.get('/', (req, res) => {
  res.render('pages/index', { 
    title: req.t('nav.home') + ' - Silk Line Expo',
    data: data
  });
});

// All Products
router.get('/all-product', (req, res) => {
  res.render('pages/all-product', { 
    title: req.t('products.allProducts') + ' - Silk Line Expo',
    data: data
  });
});

// Product Details
router.get('/product-details', (req, res) => {
  const productId = req.query.id;
  const countryName = req.query.country;
  const companyName = req.query.company;
  
  let product = null;
  let company = null;
  let country = null;
  
  // Find product in data
  if (productId && countryName && companyName) {
    country = data.countries.find(c => c.name === countryName);
    if (country) {
      company = country.companies.find(comp => comp.name === companyName);
      if (company) {
        product = company.products.find(prod => prod.id == productId);
      }
    }
  }
  
  res.render('pages/product-details', { 
    title: product ? `${product.title} - Silk Line Expo` : req.t('products.productDetails') + ' - Silk Line Expo',
    data: data,
    product: product,
    company: company,
    country: country
  });
});

// Partner Countries
router.get('/partner-countries', (req, res) => {
  res.render('pages/partner-countries', { 
    title: req.t('nav.partnersCountries') + ' - Silk Line Expo',
    data: data
  });
});

// Partners Agents
router.get('/partners-agents', (req, res) => {
  res.render('pages/partners-agents', { 
    title: req.t('nav.partnersAgents') + ' - Silk Line Expo',
    data: data
  });
});

// Product Country
router.get('/product-country', (req, res) => {
  const countryName = req.query.country;
  const country = data.countries.find(c => c.name === countryName);
  
  res.render('pages/product-country', { 
    title: `${req.t('products.products')} ${countryName} - Silk Line Expo`,
    data: data,
    country: country,
    countryName: countryName
  });
});

// Contact
router.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    title: req.t('contact.contactUs') + ' - Silk Line Expo',
    data: data
  });
});

// Blog
router.get('/blog', (req, res) => {
  res.render('pages/blog', { 
    title: req.t('blog.news') + ' - Silk Line Expo',
    data: data
  });
});

// Blog Details
router.get('/blog-details', (req, res) => {
  res.render('pages/blog-details', { 
    title: req.t('blog.news') + ' - Silk Line Expo',
    data: data
  });
});

// Authentication UI pages
router.get('/auth/login', boundAuthMethods.showLoginPage);
router.get('/auth/register', boundAuthMethods.showRegisterPage);

// Legacy admin login redirect (for backward compatibility)
router.get('/admin/login', (req, res) => {
  res.redirect('/login?type=admin');
});

// Password reset UI page
router.get('/reset-password', boundAuthMethods.showPasswordResetForm);

module.exports = router;