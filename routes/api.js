/**
 * Public API Routes - Clean Architecture
 * Optimized public data access endpoints
 */

const express = require('express');
const router = express.Router();

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

module.exports = router;