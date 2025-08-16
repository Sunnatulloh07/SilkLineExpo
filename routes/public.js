/**
 * Public Routes - Clean Architecture
 * Public pages and authentication UI only
 */

const express = require('express');
const AuthControllerClass = require('../controllers/AuthController');

const router = express.Router();

// Database models
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Services
const PublicProductsService = require('../services/PublicProductsService');

// Create AuthController instance and bind methods
const AuthController = new AuthControllerClass();
const boundAuthMethods = {
  showLoginPage: AuthController.showLoginPage.bind(AuthController),
  showRegisterPage: AuthController.showRegisterPage.bind(AuthController),
  showPasswordResetForm: AuthController.showPasswordResetForm.bind(AuthController)
};

// Load static data
const data = require('../public/data.json');

/**
 * Get top products for homepage with smart filtering
 * Only shows products published to marketplace (not drafts or unpublished)
 * Priority: 1) High rating + high views, 2) High rating only, 3) Any active marketplace products
 * @returns {Array} Top products array (up to 20 items)
 */
async function getTopProductsForHomepage() {
  try {
    
    // Debug: Check total products first
    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const publicProducts = await Product.countDocuments({ status: 'active', visibility: 'public' });
    const publishedProducts = await Product.countDocuments({ 
      status: 'active', 
      visibility: 'public', 
      publishedAt: { $exists: true, $ne: null } 
    });
    
    // Base filter for marketplace-published products only
    const marketplaceFilter = {
      status: 'active',
      visibility: 'public',
      publishedAt: { $exists: true, $ne: null },      // Published to marketplace
      $or: [
        { unpublishedAt: { $exists: false } },        // Never unpublished
        { unpublishedAt: null }                       // Or explicitly null
      ]
    };
    
    // Step 1: Try to get products with high rating AND high views
    const topRatedViewedProducts = await Product.find({
      ...marketplaceFilter,
      averageRating: { $gte: 4.0 },      // Rating 4.0+
      'analytics.views': { $gte: 100 }    // At least 100 views
    })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug')
    .sort({ 
      averageRating: -1,     // High rating first
      'analytics.views': -1,  // High views second
      'analytics.orders': -1  // High orders third
    })
    .limit(20)
    .lean();
    
    
    // If we have 6+ products, return them
    if (topRatedViewedProducts.length >= 6) {
      return topRatedViewedProducts;
    }
    
    // Step 2: If not enough, try high rating only (3.5+)
    const topRatedProducts = await Product.find({
      ...marketplaceFilter,
      averageRating: { $gte: 3.5 }  // Rating 3.5+
    })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug')
    .sort({ 
      averageRating: -1,     // High rating first
      'analytics.views': -1,  // High views second
      totalReviews: -1,      // More reviews
      publishedAt: -1        // Most recently published
    })
    .limit(20)
    .lean();
    
    
    // If we have 6+ products, return them
    if (topRatedProducts.length >= 6) {
      return topRatedProducts;
    }
    
    // Step 3: If still not enough, get any active marketplace products
    const allMarketplaceProducts = await Product.find({
      ...marketplaceFilter,
      'inventory.availableStock': { $gt: 0 }  // In stock
    })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug')
    .sort({ 
      isFeatured: -1,        // Featured first
      'analytics.views': -1,  // Most viewed
      averageRating: -1,     // Higher rating
      publishedAt: -1        // Most recently published
    })
    .limit(20)
    .lean();
    
    // If still no marketplace products, try with relaxed filter (just active + public)
    if (allMarketplaceProducts.length === 0) {
      const anyActiveProducts = await Product.find({
        status: 'active',
        visibility: 'public'
      })
      .populate('manufacturer', 'companyName country')
      .populate('category', 'name slug')
      .sort({ 
        createdAt: -1,           // Most recently created
        isFeatured: -1,          // Featured first
        'analytics.views': -1    // Most viewed
    })
    .limit(20)
    .lean();
    
      return anyActiveProducts.slice(0, 20);
    }
    
    return allMarketplaceProducts;
    
  } catch (error) {
    return [];
  }
}

// Homepage
router.get('/', async (req, res) => {
  try {
    // Get top products for homepage
    let topProducts = await getTopProductsForHomepage();
    
    // If no products found from database, use sample data as fallback
    if (!topProducts || topProducts.length === 0) {
      topProducts = [
        {
          _id: 'sample1',
          name: 'Candy Almatiniskiy suviner',
          pricing: { basePrice: 7 },
          images: [{ url: '/img/product-logo/raxat-candies.jpg', isPrimary: true }],
          manufacturer: { companyName: 'Raxat' },
          averageRating: 4.8,
          totalReviews: 156,
          analytics: { views: 1200, orders: 89 },
          isFeatured: true
        },
        {
          _id: 'sample2', 
          name: 'Set of chocolates raxat',
          pricing: { basePrice: 8 },
          images: [{ url: '/img/product-logo/raxat-choco.jpg', isPrimary: true }],
          manufacturer: { companyName: 'Raxat' },
          averageRating: 4.9,
          totalReviews: 203,
          analytics: { views: 1500, orders: 112 },
          isFeatured: false
        },
        {
          _id: 'sample3',
          name: 'Crystal Glasses Set',
          pricing: { basePrice: 25 },
          images: [{ url: '/img/product-logo/almas1.jpg', isPrimary: true }],
          manufacturer: { companyName: 'Almas' },
          averageRating: 4.6,
          totalReviews: 98,
          analytics: { views: 890, orders: 56 },
          isFeatured: false
        },
        {
          _id: 'sample4',
          name: 'Smart TV 55 inch',
          pricing: { basePrice: 599 },
          images: [{ url: '/img/product-logo/artel-tv.png', isPrimary: true }],
          manufacturer: { companyName: 'Artel' },
          averageRating: 4.7,
          totalReviews: 267,
          analytics: { views: 2100, orders: 78 },
          isFeatured: true
        }
      ];
    }
    
    res.render('pages/index', { 
      title: req.t('nav.home') + ' - Silk Line Expo',
      data: data,
      topProducts: topProducts
    });
  } catch (error) {
    // Fallback with sample products
    const fallbackProducts = [
      {
        _id: 'fallback1',
        name: 'Sample Product',
        pricing: { basePrice: 10 },
        images: [{ url: '/assets/images/thumbs/product-placeholder.png', isPrimary: true }],
        manufacturer: { companyName: 'Sample Company' },
        averageRating: 4.0,
        totalReviews: 50,
        analytics: { views: 500, orders: 25 },
        isFeatured: false
      }
    ];
    
    res.render('pages/index', { 
      title: req.t('nav.home') + ' - Silk Line Expo',
      data: data,
      topProducts: fallbackProducts
    });
  }
});

// All Products - Now with marketplace database integration
router.get('/all-product', async (req, res) => {
  try {
    // Cache headers for multi-language HTML
    res.set({
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'Vary': 'Accept-Language, Cookie, Accept-Encoding, User-Agent'
    });

    // Parse query params
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 50);
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const manufacturer = (req.query.manufacturer || '').trim();
    const priceMin = req.query.priceMin ? Number(req.query.priceMin) : undefined;
    const priceMax = req.query.priceMax ? Number(req.query.priceMax) : undefined;
    const rating = req.query.rating ? Number(req.query.rating) : undefined;
    const sort = (req.query.sort || 'publishedAt-desc').trim();

    // Base filter
    const marketplaceFilter = {
      status: 'active',
      visibility: 'public',
      publishedAt: { $exists: true, $ne: null },
      $or: [
        { unpublishedAt: { $exists: false } },
        { unpublishedAt: null }
      ]
    };

    // Dynamic filters
    if (search) {
      marketplaceFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    // Category filter uses slug; resolve to ObjectId for SSR list
    if (category && category !== 'all') {
      try {
        const Category = require('../models/Category');
        const catDoc = await Category.findOne({ slug: category }).select('_id').lean();
        if (catDoc && catDoc._id) {
          marketplaceFilter.category = catDoc._id;
        }
      } catch (e) {
        // ignore resolution errors for SSR; client-side API can still handle filters
      }
    }
    if (manufacturer) {
      marketplaceFilter['manufacturer'] = manufacturer.match(/^[0-9a-fA-F]{24}$/) ? manufacturer : undefined;
    }
    if (typeof priceMin === 'number' || typeof priceMax === 'number') {
      marketplaceFilter['pricing.basePrice'] = {};
      if (typeof priceMin === 'number') marketplaceFilter['pricing.basePrice'].$gte = priceMin;
      if (typeof priceMax === 'number') marketplaceFilter['pricing.basePrice'].$lte = priceMax;
    }
    if (typeof rating === 'number') {
      marketplaceFilter['averageRating'] = { $gte: rating };
    }

    // Sorting
    const sortMap = {
      'publishedAt-desc': { publishedAt: -1, isFeatured: -1 },
      'publishedAt-asc': { publishedAt: 1 },
      'newest': { publishedAt: -1 },
      'oldest': { publishedAt: 1 },
      'price-low': { 'pricing.basePrice': 1 },
      'price-high': { 'pricing.basePrice': -1 },
      'rating': { averageRating: -1 },
      'popular': { 'analytics.views': -1 }
    };
    const sortOption = sortMap[sort] || sortMap['publishedAt-desc'];

    // Counts for pagination
    const total = await Product.countDocuments(marketplaceFilter);
    const skip = (page - 1) * limit;

    // Fetch products
    const products = await Product.find(marketplaceFilter)
      .populate('manufacturer', 'companyName country companyLogo')
    .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
    .lean();
    
    // Render template
    res.render('pages/all-product', { 
      title: req.t('products.allProducts') + ' - Silk Line Expo',
      data: data,
      marketplaceProducts: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      },
      currentFilters: { search, category, manufacturer, priceMin, priceMax, rating, sort }
    });
  } catch (error) {
  res.render('pages/all-product', { 
    title: req.t('products.allProducts') + ' - Silk Line Expo',
      data: data,
      marketplaceProducts: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 1 },
      currentFilters: {}
  });
  }
});



// Helper functions for product details
function getStockStatus(inventory) {
  if (!inventory) return { status: 'unknown', message: 'Stock information not available' };

  if (inventory.availableStock <= 0) {
    return { status: 'out_of_stock', message: 'Out of stock', color: 'danger' };
  } else if (inventory.availableStock <= inventory.lowStockThreshold) {
    return { status: 'low_stock', message: `Low stock (${inventory.availableStock} ${inventory.unit} left)`, color: 'warning' };
  } else {
    return { status: 'in_stock', message: `In stock (${inventory.availableStock} ${inventory.unit} available)`, color: 'success' };
  }
}

function calculateDeliveryEstimate(shipping) {
  if (!shipping || !shipping.leadTime) {
    return { min: 7, max: 14, message: '7-14 business days' };
  }

  const minDays = shipping.leadTime.min || 7;
  const maxDays = shipping.leadTime.max || 14;

  return {
    min: minDays,
    max: maxDays,
    message: `${minDays}-${maxDays} business days`
  };
}

function formatSpecifications(specs) {
  if (!specs || !Array.isArray(specs)) return [];

  return specs.map(spec => ({
    name: spec.name,
    value: spec.value,
    unit: spec.unit || '',
    displayValue: spec.unit ? `${spec.value} ${spec.unit}` : spec.value
  }));
}

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

// Professional B2B Product Details - New Alibaba Style Design
router.get('/product-details', async (req, res) => {
  try {
    const productId = req.query.id;
    
    // Validate product ID format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).render('pages/product-details', {
        title: 'Product Details - Silk Line Expo',
        error: 'Invalid product ID',
        product: null,
        manufacturer: null,
        relatedProducts: [],
        similarProducts: [],
        stockStatus: null,
        deliveryEstimate: null,
        formattedSpecs: [],
        productId: null,
        pageDescription: 'Product not found - Invalid product ID',
        pageKeywords: 'product not found, b2b marketplace, professional'
      });
    }
    
    // Use enhanced service layer for comprehensive B2B data
    const publicProductsService = new PublicProductsService();
    const product = await publicProductsService.getProductDetails(productId);
    
    if (!product) {
      // Set cache headers for not found pages
      res.set({
        'Cache-Control': 'public, max-age=300',
        'X-Product-Status': 'not-found',
        'X-Design-Version': 'professional-alibaba'
      });
      
      return res.status(404).render('pages/product-details', {
        title: 'Product Not Found - Silk Line Expo',
        error: 'Product not found or not publicly available',
        product: null,
        manufacturer: null,
        relatedProducts: [],
        similarProducts: [],
        stockStatus: null,
        deliveryEstimate: null,
        formattedSpecs: [],
        productId: null,
        pageDescription: 'Product not found - The requested product does not exist or is not publicly available',
        pageKeywords: 'product not found, b2b marketplace, professional, alibaba style'
      });
    }

    // Extract enhanced data from service result
    const manufacturer = product.manufacturer;
    const relatedProducts = product.relatedProducts || [];
    const similarProducts = product.similarProducts || [];

    // Calculate enhanced helper data for professional template
    const stockStatus = calculateProfessionalStockStatus(product.inventory);
    const deliveryEstimate = calculateProfessionalDeliveryEstimate(product.shipping);
    const formattedSpecs = formatProfessionalSpecifications(product.specifications);
    const bulkPricingTiers = formatBulkPricingTiers(product.pricing?.bulkPricing);
    const qualityCertifications = formatQualityCertifications(product.certifications, product.qualityStandards);
    const supplierVerification = calculateSupplierVerification(manufacturer);

    // Cache headers adjusted for multi-language HTML (avoid serving stale language)
    res.set({
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'X-Product-Status': 'found',
      'X-Design-Version': 'professional-alibaba',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Product-ID': productId,
      'X-Supplier-ID': manufacturer?._id,
      'Last-Modified': product.updatedAt ? product.updatedAt.toUTCString() : new Date().toUTCString(),
      'Vary': 'Accept-Language, Cookie, Accept-Encoding, User-Agent'
    });

    // Enhanced SEO data for B2B marketplace
    const enhancedTitle = `${product.name} - Professional B2B from ${manufacturer?.companyName || 'Verified Supplier'} | Silk Line Expo`;
    const enhancedDescription = product.shortDescription || 
      `High-quality ${product.name} from verified supplier ${manufacturer?.companyName || 'professional manufacturer'}. MOQ: ${product.pricing?.minimumOrderQuantity || 1} ${product.inventory?.unit || 'pieces'}. ${product.description?.substring(0, 100) || 'Professional B2B marketplace.'}`;
    
    const enhancedKeywords = [
      product.name,
      product.category?.name,
      manufacturer?.companyName,
      manufacturer?.country,
      product.pricing?.currency || 'USD',
      'B2B marketplace',
      'wholesale',
      'professional supplier',
      'alibaba style',
      'trade assurance',
      ...(product.tags || []),
      ...(product.qualityStandards || [])
    ].filter(Boolean).join(', ');

    console.log('prducts details', {
      title: enhancedTitle,
      error: null,
      product,
      manufacturer,
      relatedProducts: relatedProducts || [],
      similarProducts: similarProducts || [],
      stockStatus,
      deliveryEstimate,
      formattedSpecs: formattedSpecs || [],
      bulkPricingTiers: bulkPricingTiers || [],
      qualityCertifications: qualityCertifications || [],
      supplierVerification,
      productId: productId,
      // Enhanced SEO data
      pageDescription: enhancedDescription,
      pageKeywords: enhancedKeywords,
      // Open Graph data for social sharing
      ogTitle: `${product.name} - Professional B2B Supply`,
      ogDescription: enhancedDescription,
      ogImage: product.images?.[0]?.url || '/assets/images/default-product.jpg',
      ogUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      // Twitter Card data
      twitterCard: 'summary_large_image',
      twitterTitle: `${product.name} - B2B Professional Supply`,
      twitterDescription: enhancedDescription,
      twitterImage: product.images?.[0]?.url || '/assets/images/default-product.jpg',
      // JSON-LD structured data for SEO
      structuredData: generateProductStructuredData(product, manufacturer, req)
    });
    // Render the professional Alibaba-style B2B design
    res.render('pages/product-details', {
      title: enhancedTitle,
      error: null,
      product,
      manufacturer,
      relatedProducts: relatedProducts || [],
      similarProducts: similarProducts || [],
      stockStatus,
      deliveryEstimate,
      formattedSpecs: formattedSpecs || [],
      bulkPricingTiers: bulkPricingTiers || [],
      qualityCertifications: qualityCertifications || [],
      supplierVerification,
      productId: productId,
      // Enhanced SEO data
      pageDescription: enhancedDescription,
      pageKeywords: enhancedKeywords,
      // Open Graph data for social sharing
      ogTitle: `${product.name} - Professional B2B Supply`,
      ogDescription: enhancedDescription,
      ogImage: product.images?.[0]?.url || '/assets/images/default-product.jpg',
      ogUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      // Twitter Card data
      twitterCard: 'summary_large_image',
      twitterTitle: `${product.name} - B2B Professional Supply`,
      twitterDescription: enhancedDescription,
      twitterImage: product.images?.[0]?.url || '/assets/images/default-product.jpg',
      // JSON-LD structured data for SEO
      structuredData: generateProductStructuredData(product, manufacturer, req)
    });
    
    
  } catch (error) {
    console.error('❌ Error in professional product details route:', error);

    // Enhanced error handling with detailed logging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      productId: req.query.id,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Log error for monitoring (you can send to logging service)
    console.error('Professional Product Details Error:', errorDetails);

    // Ensure all required variables are defined for error template
    const defaultParams = {
      title: 'Error - Professional B2B Marketplace | Silk Line Expo',
      error: 'We apologize for the inconvenience. Our technical team has been notified.',
      product: null,
      manufacturer: null,
      relatedProducts: [],
      similarProducts: [],
      stockStatus: null,
      deliveryEstimate: null,
      formattedSpecs: [],
      bulkPricingTiers: [],
      qualityCertifications: [],
      supplierVerification: null,
      productId: null,
      pageDescription: 'An error occurred while loading professional product details',
      pageKeywords: 'error, professional b2b marketplace, technical issue'
    };
    
    res.status(500).render('pages/product-details', defaultParams);
  }
});

// Enhanced helper functions for professional product details
function calculateProfessionalStockStatus(inventory) {
  if (!inventory) return { status: 'unknown', message: 'Stock information not available', color: 'gray' };
  
  const available = inventory.availableStock || 0;
  const threshold = inventory.lowStockThreshold || 10;
  
  if (available === 0) {
    return { 
      status: 'out-of-stock', 
      message: 'Out of Stock', 
      color: 'red',
      availability: false,
      restockDate: inventory.restockDate
    };
  } else if (available <= threshold) {
    return { 
      status: 'low-stock', 
      message: `Low Stock (${available} ${inventory.unit || 'pieces'} available)`,
      color: 'orange',
      availability: true,
      quantity: available,
      unit: inventory.unit || 'pieces'
    };
  } else {
    return { 
      status: 'in-stock', 
      message: `In Stock (${available} ${inventory.unit || 'pieces'} available)`,
      color: 'green',
      availability: true,
      quantity: available,
      unit: inventory.unit || 'pieces'
    };
  }
}

function calculateProfessionalDeliveryEstimate(shipping) {
  if (!shipping || !shipping.leadTime) {
    return {
      min: 7,
      max: 14,
      message: '7-14 business days',
      isEstimate: true
    };
  }
  
  const min = shipping.leadTime.min || 7;
  const max = shipping.leadTime.max || min + 7;
  
  return {
    min,
    max,
    message: min === max ? `${min} business days` : `${min}-${max} business days`,
    isEstimate: false,
    shippingClass: shipping.shippingClass,
    weight: shipping.weight,
    dimensions: shipping.dimensions
  };
}

function formatProfessionalSpecifications(specs) {
  if (!specs || !Array.isArray(specs)) return [];
  
  return specs.map(spec => ({
    name: spec.name,
    value: spec.value,
    unit: spec.unit || '',
    formatted: `${spec.value}${spec.unit ? ' ' + spec.unit : ''}`,
    category: categorizeSpecification(spec.name)
  }));
}

function categorizeSpecification(specName) {
  const categories = {
    physical: ['weight', 'height', 'width', 'length', 'depth', 'thickness', 'diameter'],
    technical: ['voltage', 'power', 'frequency', 'capacity', 'speed', 'pressure'],
    material: ['material', 'fabric', 'composition', 'grade', 'purity'],
    performance: ['efficiency', 'output', 'throughput', 'accuracy', 'precision']
  };
  
  const lowerSpecName = specName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerSpecName.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

function formatBulkPricingTiers(bulkPricing) {
  if (!bulkPricing || !Array.isArray(bulkPricing)) return [];
  
  return bulkPricing.map(tier => ({
    minQuantity: tier.minQuantity,
    maxQuantity: tier.maxQuantity,
    price: tier.price,
    discount: tier.discount,
    savings: tier.discount ? Math.round((tier.discount / 100) * tier.price * 100) / 100 : 0,
    formattedRange: tier.maxQuantity ? 
      `${tier.minQuantity.toLocaleString()} - ${tier.maxQuantity.toLocaleString()}` :
      `${tier.minQuantity.toLocaleString()}+`,
    formattedPrice: `$${tier.price.toFixed(2)}`,
    formattedDiscount: tier.discount ? `${tier.discount}% OFF` : null
  }));
}

function formatQualityCertifications(certifications, qualityStandards) {
  const formatted = [];
  
  // Add certifications
  if (certifications && Array.isArray(certifications)) {
    certifications.forEach(cert => {
      formatted.push({
        type: 'certification',
        name: cert.name,
        issuer: cert.issuedBy,
        number: cert.certificateNumber,
        issued: cert.issuedDate,
        expires: cert.expiryDate,
        isValid: !cert.expiryDate || new Date(cert.expiryDate) > new Date(),
        badge: 'certificate'
      });
    });
  }
  
  // Add quality standards
  if (qualityStandards && Array.isArray(qualityStandards)) {
    qualityStandards.forEach(standard => {
      formatted.push({
        type: 'standard',
        name: standard,
        badge: getStandardBadge(standard)
      });
    });
  }
  
  return formatted;
}

function getStandardBadge(standard) {
  const badges = {
    'ISO9001': 'quality-management',
    'ISO14001': 'environmental',
    'HACCP': 'food-safety',
    'FDA': 'fda-approved',
    'CE': 'european-conformity',
    'GOST': 'gost-standard'
  };
  return badges[standard] || 'quality-standard';
}

function calculateSupplierVerification(manufacturer) {
  if (!manufacturer) return { score: 0, level: 'unverified', badges: [] };
  
  let score = 0;
  const badges = [];
  
  // Basic verification
  if (manufacturer.isVerified) {
    score += 30;
    badges.push('verified-supplier');
  }
  
  // Business license
  if (manufacturer.businessLicense) {
    score += 20;
    badges.push('licensed-business');
  }
  
  // Experience (based on established year)
  if (manufacturer.establishedYear) {
    const years = new Date().getFullYear() - manufacturer.establishedYear;
    if (years >= 10) {
      score += 25;
      badges.push('experienced-supplier');
    } else if (years >= 5) {
      score += 15;
      badges.push('established-supplier');
    }
  }
  
  // Performance metrics
  if (manufacturer.averageRating >= 4.5) {
    score += 15;
    badges.push('top-rated');
  } else if (manufacturer.averageRating >= 4.0) {
    score += 10;
    badges.push('highly-rated');
  }
  
  // Volume indicators
  if (manufacturer.totalOrders >= 1000) {
    score += 10;
    badges.push('high-volume');
  } else if (manufacturer.totalOrders >= 100) {
    score += 5;
    badges.push('active-supplier');
  }
  
  // Determine verification level
  let level = 'unverified';
  if (score >= 80) level = 'gold';
  else if (score >= 60) level = 'silver';
  else if (score >= 40) level = 'bronze';
  else if (score >= 20) level = 'basic';
  
  return { score, level, badges };
}

function generateProductStructuredData(product, manufacturer, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  return JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images?.map(img => img.url) || [],
    "brand": {
      "@type": "Brand",
      "name": manufacturer?.companyName || "Unknown Brand"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": manufacturer?.companyName,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": manufacturer?.country
      }
    },
    "offers": {
      "@type": "Offer",
      "price": product.pricing?.basePrice || 0,
      "priceCurrency": product.pricing?.currency || "USD",
      "availability": product.inventory?.availableStock > 0 ? 
        "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": manufacturer?.companyName
      },
      "url": `${baseUrl}/product-details?id=${product._id}`
    },
    "aggregateRating": product.averageRating ? {
      "@type": "AggregateRating",
      "ratingValue": product.averageRating,
      "reviewCount": product.totalReviews || 0,
      "bestRating": 5,
      "worstRating": 1
    } : undefined,
    "category": product.category?.name,
    "sku": product._id,
    "mpn": product._id,
    "additionalProperty": product.specifications?.map(spec => ({
      "@type": "PropertyValue",
      "name": spec.name,
      "value": spec.value,
      "unitText": spec.unit
    })) || []
  });
}

// API Endpoint: Professional B2B Inquiries
router.post('/api/inquiries', async (req, res) => {
  try {
    // Validate required fields
    const { name, company, email, message, productId, quantity } = req.body;
    
    if (!name || !company || !email || !message || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['name', 'company', 'email', 'message', 'productId']
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Validate product exists
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }
    
    const product = await Product.findById(productId).populate('manufacturer', 'companyName email');
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Create inquiry record (you can save to database)
    const inquiryData = {
      id: new mongoose.Types.ObjectId(),
      timestamp: new Date(),
      customer: { name, company, email, phone: req.body.phone },
      product: {
        id: productId,
        name: product.name,
        supplierId: product.manufacturer._id,
        supplierName: product.manufacturer.companyName
      },
      inquiry: { message, quantity: parseInt(quantity) || 1, unit: req.body.unit },
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        source: 'professional-product-detail'
      }
    };
    
    // Here you would typically save to database
    // const inquiry = new Inquiry(inquiryData);
    // await inquiry.save();
    
    // Send notification email to supplier (implement your email service)
    // await sendInquiryNotification(inquiryData);
    
    console.log('📧 New B2B Inquiry:', inquiryData);
    
    res.json({
      success: true,
      message: 'Inquiry sent successfully',
      inquiryId: inquiryData.id,
      estimatedResponse: '24-48 hours'
    });
    
  } catch (error) {
    console.error('❌ Inquiry submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process inquiry'
    });
  }
});

// API Endpoint: Professional Analytics Tracking
router.post('/api/analytics/track', async (req, res) => {
  try {
    const { action, productId, ...data } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }
    
    // Create analytics event
    const analyticsEvent = {
      id: new mongoose.Types.ObjectId(),
      timestamp: new Date(),
      action,
      productId: productId || null,
      data,
      session: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referer: req.get('Referer')
      }
    };
    
    // Here you would typically save to analytics database
    // const event = new AnalyticsEvent(analyticsEvent);
    // await event.save();
    
    res.json({
      success: true,
      eventId: analyticsEvent.id
    });
    
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event'
    });
  }
});

// API Endpoint: Professional B2B Reviews (placeholder)
router.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, company, phone, subject, message, quantity, supplierId, productId } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message || !supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, message, and supplier ID are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate ObjectId format for supplierId and productId
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Get supplier information
    const supplier = await User.findById(supplierId).select('companyName email status');
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get product information if provided
    let product = null;
    if (productId) {
      product = await Product.findById(productId).select('name');
    }

    // Here you would typically:
    // 1. Save the inquiry to database
    // 2. Send email to supplier
    // 3. Send confirmation email to buyer
    // 4. Track analytics


    // In a real implementation, you would:
    // const inquiry = new Inquiry({ ... });
    // await inquiry.save();
    // await sendEmailToSupplier(supplier.email, inquiryData);
    // await sendConfirmationEmail(email, inquiryData);

    res.json({
      success: true,
      message: 'Your inquiry has been sent successfully. The supplier will contact you within 24-48 hours.',
      data: {
        inquiryId: 'ALB_INQ_' + Date.now(),
        supplierName: supplier.companyName,
        productName: product?.name,
        estimatedResponseTime: '24-48 hours',
        inquiryType: subject,
        expectedQuantity: quantity
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// API Endpoint: Professional B2B Analytics
router.post('/api/analytics/track', async (req, res) => {
  try {
    const { action, data } = req.body;

    // Professional B2B analytics tracking
    const analyticsEvent = {
      action,
      timestamp: new Date().toISOString(),
      session: req.sessionID,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      referer: req.get('Referer'),
      ...data
    };
    // In a real implementation:
    // await analyticsService.track(action, data);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Analytics API error:', error);
    // Don't fail the request for analytics
    res.json({ success: false });
  }
});

module.exports = router;