/**
 * Public Routes - Clean Architecture
 * Public pages and authentication UI only
 */

const express = require('express');
const AuthControllerClass = require('../controllers/AuthController');

const router = express.Router();

const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Services
const PublicProductsService = require('../services/PublicProductsService');

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
async function  getTopProductsForHomepage() {
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
    
    console.log('🏠 getTopProductsForHomepage: Database stats:', {
      totalProducts,
      activeProducts,
      publicProducts,
      publishedProducts
    });
    
    // Base filter for marketplace products - show all active public products regardless of publish status
    const marketplaceFilter = {
      status: 'active',
      visibility: 'public'
    };
    
    // Step 1: Try to get products with high rating AND high views (only from active suppliers)
    const topRatedViewedProducts = await Product.aggregate([
      {
        $match: {
          status: 'active',
          visibility: 'public',
          averageRating: { $gte: 4.0 },      // Rating 4.0+
          'analytics.views': { $gte: 100 }    // At least 100 views
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'manufacturer',
          foreignField: '_id',
          as: 'manufacturerInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      // Filter by supplier status - only show products from active suppliers
      {
        $match: {
          'manufacturerInfo.status': 'active'  // Only active suppliers
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          shortDescription: 1,
          images: 1,
          pricing: 1,
          averageRating: 1,
          totalReviews: 1,
          analytics: 1,
          isFeatured: 1,
          createdAt: 1,
          manufacturer: {
            _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
            companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
            country: { $arrayElemAt: ['$manufacturerInfo.country', 0] }
          },
          category: {
            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
            name: { $arrayElemAt: ['$categoryInfo.name', 0] },
            slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
          }
        }
      },
      {
        $sort: { 
      averageRating: -1,     // High rating first
      'analytics.views': -1,  // High views second
      'analytics.orders': -1  // High orders third
        }
      },
      {
        $limit: 20
      }
    ]);
    
    
    // If we have 6+ products, return them
    if (topRatedViewedProducts.length >= 6) {
      return topRatedViewedProducts;
    }
    
    // Step 2: If not enough, try high rating only (3.5+) - only from active suppliers
    const topRatedProducts = await Product.aggregate([
      {
        $match: {
          status: 'active',
          visibility: 'public',
      averageRating: { $gte: 3.5 }  // Rating 3.5+
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'manufacturer',
          foreignField: '_id',
          as: 'manufacturerInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      // Filter by supplier status - only show products from active suppliers
      {
        $match: {
          'manufacturerInfo.status': 'active'  // Only active suppliers
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          shortDescription: 1,
          images: 1,
          pricing: 1,
          averageRating: 1,
          totalReviews: 1,
          analytics: 1,
          isFeatured: 1,
          createdAt: 1,
          manufacturer: {
            _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
            companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
            country: { $arrayElemAt: ['$manufacturerInfo.country', 0] }
          },
          category: {
            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
            name: { $arrayElemAt: ['$categoryInfo.name', 0] },
            slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
          }
        }
      },
      {
        $sort: { 
      averageRating: -1,     // High rating first
      'analytics.views': -1,  // High views second
      totalReviews: -1,      // More reviews
      publishedAt: -1        // Most recently published
        }
      },
      {
        $limit: 20
      }
    ]);
    
    
    // If we have 6+ products, return them
    if (topRatedProducts.length >= 6) {
      return topRatedProducts;
    }
    
    // Step 3: If still not enough, get any active marketplace products (only from active suppliers)
    const allMarketplaceProducts = await Product.aggregate([
      {
        $match: {
          status: 'active',
          visibility: 'public',
      'inventory.availableStock': { $gt: 0 }  // In stock
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'manufacturer',
          foreignField: '_id',
          as: 'manufacturerInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      // Filter by supplier status - only show products from active suppliers
      {
        $match: {
          'manufacturerInfo.status': 'active'  // Only active suppliers
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          shortDescription: 1,
          images: 1,
          pricing: 1,
          averageRating: 1,
          totalReviews: 1,
          analytics: 1,
          isFeatured: 1,
          createdAt: 1,
          manufacturer: {
            _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
            companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
            country: { $arrayElemAt: ['$manufacturerInfo.country', 0] }
          },
          category: {
            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
            name: { $arrayElemAt: ['$categoryInfo.name', 0] },
            slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
          }
        }
      },
      {
        $sort: { 
      isFeatured: -1,        // Featured first
      'analytics.views': -1,  // Most viewed
      averageRating: -1,     // Higher rating
      publishedAt: -1        // Most recently published
        }
      },
      {
        $limit: 20
      }
    ]);
    
    // If still no marketplace products, try with relaxed filter (just active + public, only from active suppliers)
    if (allMarketplaceProducts.length === 0) {
      const anyActiveProducts = await Product.aggregate([
        {
          $match: {
        status: 'active',
        visibility: 'public'
          }
        },
        {
          $match: {
            $or: [
              // Products with publishedAt and not unpublished (new publishing system)
              {
                publishedAt: { $exists: true, $ne: null },
                unpublishedAt: { $exists: false }
              },
              {
                publishedAt: { $exists: true, $ne: null },
                unpublishedAt: null
              },
              // Products without publishedAt but active and public (legacy products)
              {
                publishedAt: { $exists: false }
              },
              {
                publishedAt: null
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'manufacturer',
            foreignField: '_id',
            as: 'manufacturerInfo'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $match: {
            'manufacturerInfo.status': 'active'  // Only active suppliers
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            shortDescription: 1,
            images: 1,
            pricing: 1,
            averageRating: 1,
            totalReviews: 1,
            analytics: 1,
            isFeatured: 1,
            createdAt: 1,
            manufacturer: {
              _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
              companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
              country: { $arrayElemAt: ['$manufacturerInfo.country', 0] }
            },
            category: {
              _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
              name: { $arrayElemAt: ['$categoryInfo.name', 0] },
              slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
            }
          }
        },
        {
          $sort: { 
        createdAt: -1,           // Most recently created
        isFeatured: -1,          // Featured first
        'analytics.views': -1    // Most viewed
          }
        },
        {
          $limit: 20
        }
      ]);
    
      return anyActiveProducts.slice(0, 20);
    }
    
    console.log('🏠 getTopProductsForHomepage: Final result:', allMarketplaceProducts?.length || 0, 'products');
    return allMarketplaceProducts;
    
  } catch (error) {
    console.error('🏠 getTopProductsForHomepage: Error:', error);
    return [];
  }
}

// Homepage
router.get('/', async (req, res) => {
  try {
    // Get top products for homepage
    let topProducts = await getTopProductsForHomepage();
    
    // Debug: Log product loading results
    console.log('🏠 Homepage: Products loaded from database:', topProducts?.length || 0);
    
    if (topProducts && topProducts.length > 0) {
      console.log('🏠 Homepage: Sample product:', {
        id: topProducts[0]._id,
        name: topProducts[0].name,
        manufacturer: topProducts[0].manufacturer?.companyName,
        price: topProducts[0].pricing?.basePrice
      });
    } else {
      console.log('🏠 Homepage: No products found in database');
    }
    
    res.render('pages/index', { 
      title: (res.locals.t('nav.home') || 'Home') + ' - Silk Line Expo',
      data: data,
      topProducts: topProducts
    });
  } catch (error) {
    console.error('🏠 Homepage: Error loading products:', error);
    res.render('pages/index', { 
      title: (res.locals.t('nav.home') || 'Home') + ' - Silk Line Expo',
      data: data,
      topProducts: []
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



    // Base filter for marketplace products - show all active public products regardless of publish status
    const marketplaceFilter = {
      status: 'active',
      visibility: 'public'
    };

    // Dynamic filters
    if (search) {
      marketplaceFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    // Category filter will be handled in aggregation pipeline after lookup
    // No need to resolve slug to ObjectId here since we use slug in pipeline
    // Manufacturer filter will be handled in aggregation pipeline after lookup
    // No need to add to marketplaceFilter since we use manufacturerInfo in pipeline
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

    // Build aggregation pipeline for products (only from active suppliers)
    const pipeline = [
      {
        $match: {
          status: 'active',
          visibility: 'public',
          // Add search filter
          ...(search && {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }),
          // Add price filter
          ...(typeof priceMin === 'number' || typeof priceMax === 'number' ? {
            'pricing.basePrice': {
              ...(typeof priceMin === 'number' && { $gte: priceMin }),
              ...(typeof priceMax === 'number' && { $lte: priceMax })
            }
          } : {}),
          // Add rating filter
          ...(typeof rating === 'number' && { averageRating: { $gte: rating } })
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'manufacturer',
          foreignField: '_id',
          as: 'manufacturerInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      // Filter by supplier status - only show products from active suppliers
      {
        $match: {
          'manufacturerInfo.status': 'active'  // Only active suppliers
        }
      }
    ];

    // Add category filter after lookup (since we filter by slug, not ObjectId)
    if (category && category !== 'all') {
      pipeline.push({
        $match: {
          'categoryInfo.slug': category
        }
      });
    }

    // Add manufacturer filter after lookup
    if (manufacturer && manufacturer.match(/^[0-9a-fA-F]{24}$/)) {
      pipeline.push({
        $match: {
          'manufacturerInfo._id': new mongoose.Types.ObjectId(manufacturer)
        }
      });
    }

    // Add project stage after filters
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        shortDescription: 1,
        images: 1,
        pricing: 1,
        averageRating: 1,
        totalReviews: 1,
        analytics: 1,
        isFeatured: 1,
        createdAt: 1,
        publishedAt: 1,
        manufacturer: {
          _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
          companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
          country: { $arrayElemAt: ['$manufacturerInfo.country', 0] },
          companyLogo: { $arrayElemAt: ['$manufacturerInfo.companyLogo', 0] }
        },
        category: {
          _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
          name: { $arrayElemAt: ['$categoryInfo.name', 0] },
          slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
        }
      }
    });

    // Add sorting
    pipeline.push({ $sort: sortOption });

    // Get total count (for pagination)
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    // Fetch products
    const products = await Product.aggregate(pipeline);

    // Debug: Log product loading results
    console.log('🛍️ All Products: Products loaded from database:', products?.length || 0);
    console.log('🛍️ All Products: Total products in database:', total);
    console.log('🛍️ All Products: Page:', page, 'Limit:', limit, 'Total Pages:', Math.max(Math.ceil(total / limit), 1));

    if (products && products.length > 0) {
      console.log('🛍️ All Products: Sample product:', {
        id: products[0]._id,
        name: products[0].name,
        manufacturer: products[0].manufacturer?.companyName,
        price: products[0].pricing?.basePrice
      });
    } else {
      console.log('🛍️ All Products: No products found in database');
    }
    
    // Render template
    res.render('pages/all-product', { 
      title: (res.locals.t('products.allProducts') || 'All Products') + ' - Silk Line Expo',
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
    console.error('🛍️ All Products: Error loading products:', error);
    res.render('pages/all-product', { 
      title: (res.locals.t('products.allProducts') || 'All Products') + ' - Silk Line Expo',
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
    title: (res.locals.t('nav.partnersCountries') || 'Partners by Countries') + ' - Silk Line Expo',
    data: data
  });
});

// Partners Agents
router.get('/partners-agents', (req, res) => {
  res.render('pages/partners-agents', {
    title: (res.locals.t('nav.partnersAgents') || 'Partners by Agents') + ' - Silk Line Expo',
    data: data
  });
});

// Product Country
router.get('/product-country', (req, res) => {
  const countryName = req.query.country;
  const country = data.countries.find(c => c.name === countryName);

  res.render('pages/product-country', {
    title: `${(res.locals.t('products.products') || 'Products')} ${countryName} - Silk Line Expo`,
    data: data,
    country: country,
    countryName: countryName
  });
});

// Contact
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: (res.locals.t('contact.contactUs') || 'Contact Us') + ' - Silk Line Expo',
    data: data
  });
});

// Blog
router.get('/blog', (req, res) => {
  res.render('pages/blog', {
    title: (res.locals.t('blog.news') || 'News') + ' - Silk Line Expo',
    data: data
  });
});

// Blog Details
router.get('/blog-details', (req, res) => {
  res.render('pages/blog-details', {
    title: (res.locals.t('blog.news') || 'News') + ' - Silk Line Expo',
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

    // Check if user is authenticated distributor and get product status
    let productStatus = null;
    try {
      // Check if user is authenticated via JWT tokens
      const TokenService = require('../services/TokenService');
      const tokens = TokenService.extractTokensFromRequest(req);
      
      if (tokens.accessToken) {
        const verification = TokenService.verifyAccessToken(tokens.accessToken);
        
        if (verification.valid && verification.payload.userType === 'user') {
          // Check localStorage equivalent - get user from database
          const User = require('../models/User');
          const user = await User.findById(verification.payload.userId);
          
          if (user && user.companyType === 'distributor') {
            // Get product status for distributor
            const BuyerService = require('../services/BuyerService');
            const buyerService = new BuyerService();
            productStatus = await buyerService.checkProductStatus(user._id, productId);
           }
        }
      }
    } catch (error) {
    }

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
      // Product status for authenticated distributors
      productStatus: productStatus,
      user: req.user || null,
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
      productStatus: null, // Add missing productStatus
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
  
  // Basic verification - based on actual backend status
  if (manufacturer.status === 'active' && manufacturer.approvedBy) {
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

// REMOVED: First duplicate supplier route - using the third one below

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

// REMOVED: Second duplicate supplier route - using the third one below
// router.get('/supplier/:supplierId', async (req, res) => {  
// try {
//     const { supplierId } = req.params;
    
//     // Validate supplier ID format
//     if (!mongoose.Types.ObjectId.isValid(supplierId)) {
//       return res.status(404).render('pages/supplier-profile', {
//         title: 'Supplier Not Found',
//         error: {
//           title: 'Invalid Supplier ID',
//           message: 'The supplier profile you are looking for cannot be found.',
//           code: 'INVALID_ID'
//         },
//         supplier: null,
//         products: [],
//         categories: [],
//         reviews: [],
//         verification: { score: 0, level: 'unverified', badges: [] }
//       });
//     }
    
//     // Fetch supplier data with comprehensive population
//     console.log('🔍 Debug: Fetching supplier data for ID:', supplierId);
    
//     const supplier = await User.findOne({
//       _id: supplierId,
//       companyType: { $in: ['manufacturer', 'both'] },
//       status: 'active'
//     })
//     .select({
//       // Company Information
//       companyName: 1,
//       companyType: 1,
//       activityType: 1,
//       description: 1,
//       companyLogo: 1,
//       establishedYear: 1,
//       employeeCount: 1,
//       annualRevenue: 1,
      
//       // Contact Information
//       email: 1,
//       phone: 1,
//       website: 1,
//       address: 1,
//       city: 1,
//       country: 1,
//       socialMedia: 1,
      
//       // Business Information
//       businessLicense: 1,
//       taxNumber: 1,
//       certifications: 1,
      
//       // Performance Metrics
//       totalProducts: 1,
//       totalOrders: 1,
//       completedOrders: 1,
//       averageRating: 1,
//       totalReviews: 1,
//       profileViews: 1,
      
//       // System fields
//       isVerified: 1,
//       status: 1,
//       createdAt: 1,
//       updatedAt: 1
//     })
//     .lean();
    
//     console.log('🔍 Debug: Supplier data fetched:', {
//       supplier: supplier ? 'exists' : 'null',
//       supplierId: supplier?._id,
//       companyName: supplier?.companyName,
//       companyType: supplier?.companyType,
//       status: supplier?.status,
//       totalProducts: supplier?.totalProducts,
//       totalOrders: supplier?.totalOrders,
//       averageRating: supplier?.averageRating,
//       profileViews: supplier?.profileViews
//     });
    
//     if (!supplier) {
//       return res.status(404).render('pages/supplier-profile', {
//         title: 'Supplier Not Found',
//         error: {
//           title: 'Supplier Not Found',
//           message: 'The supplier profile you are looking for does not exist or is not available.',
//           code: 'SUPPLIER_NOT_FOUND'
//         },
//         supplier: null,
//         products: [],
//         categories: [],
//         reviews: [],
//         verification: { score: 0, level: 'unverified', badges: [] }
//       });
//     }
    
//     // Increment profile views for this supplier
//     User.findByIdAndUpdate(supplierId, {
//       $inc: { profileViews: 1 }
//     }).catch(err => console.error('Error updating supplier profile views:', err));
    
//     // Fetch supplier's active products with categories
//     const products = await Product.find({
//       manufacturer: supplierId,
//       status: 'active',
//       visibility: 'public'
//     })
//     .populate('category', 'name slug')
//     .select({
//       name: 1,
//       shortDescription: 1,
//       description: 1,
//       images: 1,
//       pricing: 1,
//       inventory: 1,
//       averageRating: 1,
//       totalReviews: 1,
//       analytics: 1,
//       category: 1,
//       createdAt: 1,
//       updatedAt: 1
//     })
//     .sort({ createdAt: -1 })
//     .limit(20)
//     .lean();
    
//     // Get product categories for filtering
//     const categories = await Product.aggregate([
//       {
//         $match: {
//           manufacturer: new mongoose.Types.ObjectId(supplierId),
//           status: 'active',
//           visibility: 'public'
//         }
//       },
//       {
//         $group: {
//           _id: '$category',
//           count: { $sum: 1 },
//           totalValue: { $sum: '$pricing.basePrice' }
//         }
//       },
//       {
//         $lookup: {
//           from: 'categories',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'categoryInfo'
//         }
//       },
//       {
//         $unwind: '$categoryInfo'
//       },
//       {
//         $project: {
//           _id: 1,
//           name: '$categoryInfo.name',
//           slug: '$categoryInfo.slug',
//           count: 1,
//           totalValue: 1
//         }
//       },
//       {
//         $sort: { count: -1 }
//       }
//     ]);
    
//     // Calculate supplier verification and badges
//     const verification = calculateSupplierVerification(supplier);
    
//     // Calculate business metrics
//     const businessMetrics = {
//       totalProducts: products.length,
//       activeOrders: supplier.totalOrders - supplier.completedOrders,
//       completionRate: supplier.totalOrders > 0 ? Math.round((supplier.completedOrders / supplier.totalOrders) * 100) : 0,
//       averageRating: supplier.averageRating || 0,
//       totalReviews: supplier.totalReviews || 0,
//       experienceYears: supplier.establishedYear ? new Date().getFullYear() - supplier.establishedYear : 0
//     };
    
//     // Real reviews data - will be fetched from Review model if needed
//     const reviews = [];
    
//     // Set page metadata
//     const pageTitle = `${supplier.companyName} - Professional B2B Supplier Profile | Silk Line Expo`;
//     const pageDescription = `Professional supplier profile for ${supplier.companyName}. ${supplier.description || `Established ${supplier.establishedYear || ''} supplier offering ${products.length} products with ${supplier.averageRating || 0} star rating.`}`;
    
//     res.render('pages/supplier-profile', {
//       title: pageTitle,
//       description: pageDescription,
//       keywords: [
//         'B2B supplier',
//         'manufacturer',
//         'wholesale',
//         supplier.companyName,
//         supplier.activityType,
//         supplier.country,
//         'professional supplier',
//         'verified supplier'
//       ].filter(Boolean).join(', '),
      
//       // Core data
//       supplier,
//       products,
//       categories,
//       reviews,
//       verification,
//       businessMetrics,
      
//       // Template data
//       currentPage: 'supplier-profile',
//       bodyClass: 'supplier-profile-page',
      
//       // SEO and metadata
//       canonicalUrl: `${req.protocol}://${req.get('host')}/supplier/${supplierId}`,
//       ogImage: supplier.companyLogo?.url || '/assets/images/logo/logo-two.png',
      
//       // Pagination (for products)
//       pagination: {
//         currentPage: 1,
//         totalPages: Math.ceil(products.length / 20),
//         hasMore: products.length >= 20
//       },
      
//       // Helper functions for template
//       helpers: {
//         formatDate: (date) => date ? new Date(date).toLocaleDateString() : '',
//         formatCurrency: (amount, currency = 'USD') => {
//           return new Intl.NumberFormat('en-US', {
//             style: 'currency',
//             currency: currency
//           }).format(amount);
//         },
//         truncateText: (text, limit = 150) => {
//           if (!text) return '';
//           return text.length > limit ? text.substring(0, limit) + '...' : text;
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ Supplier profile error:', error);
//     res.status(500).render('pages/supplier-profile', {
//       title: 'Error Loading Supplier Profile',
//       error: {
//         title: 'Server Error',
//         message: 'Unable to load supplier profile. Please try again later.',
//         code: 'SERVER_ERROR'
//       },
//       supplier: null,
//       products: [],
//       categories: [],
//       reviews: [],
//       verification: { score: 0, level: 'unverified', badges: [] }
//     });
//   }
// });

// Professional Supplier Profile Route - B2B Production Level
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const currentLanguage = req.language || 'en';
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(404).render('pages/404', {
        title: 'Supplier Not Found',
        message: 'Invalid supplier ID format',
        locale: currentLanguage,
        theme: req.cookies.theme || 'light'
      });
    }
    
    // Fetch supplier data with ALL real database fields
    const supplier = await User.findById(supplierId)
      .select('companyName businessName email phone country city address website '
             + 'companyLogo description activityType taxNumber status '
             + 'establishedYear employeeCount businessLicense '
             + 'totalProducts totalOrders completedOrders '
             + 'averageRating totalReviews profileViews '
             + 'createdAt updatedAt')
      .lean();
    
    // Debug: Log supplier data from database
    console.log('🔍 Supplier data from DB:', {
      companyName: supplier?.companyName,
      totalProducts: supplier?.totalProducts,
      totalOrders: supplier?.totalOrders,
      completedOrders: supplier?.completedOrders,
      averageRating: supplier?.averageRating,
      totalReviews: supplier?.totalReviews,
      profileViews: supplier?.profileViews,
      establishedYear: supplier?.establishedYear
    });
    
    // Debug: Log supplier data before metrics calculation
    console.log('🔍 Supplier data before metrics calculation:', {
      totalProducts: supplier?.totalProducts,
      totalOrders: supplier?.totalOrders,
      averageRating: supplier?.averageRating,
      profileViews: supplier?.profileViews,
      establishedYear: supplier?.establishedYear
    });
    
    // Update supplier metrics with real data (same as product details page)
    console.log('🔍 Debug: Supplier data before metrics update:', {
      supplier: supplier ? 'exists' : 'null',
      supplierId: supplier?._id,
      totalProducts: supplier?.totalProducts,
      totalOrders: supplier?.totalOrders,
      averageRating: supplier?.averageRating
    });
    
    if (supplier && supplier._id) {
      const PublicProductsService = require('../services/PublicProductsService');
      const publicProductsService = new PublicProductsService();
      
      console.log('🔄 Updating supplier metrics with real data...');
      await publicProductsService.updateManufacturerMetrics(supplier._id);
      
      // Re-fetch updated supplier data with all fields (same as product details page)
      const updatedSupplier = await User.findById(supplier._id)
        .select('companyName email phone country address website activityType companyLogo businessLicense establishedYear employeeCount description totalProducts totalOrders averageRating totalReviews profileViews status approvedBy approvedAt rejectedBy rejectedAt rejectionReason')
        .lean();
      
      if (updatedSupplier) {
        Object.assign(supplier, updatedSupplier);
        console.log('✅ Updated supplier data:', {
          totalProducts: supplier.totalProducts,
          totalOrders: supplier.totalOrders,
          completedOrders: supplier.completedOrders,
          averageRating: supplier.averageRating,
          totalReviews: supplier.totalReviews,
          profileViews: supplier.profileViews
        });
      }
    }
    
    if (!supplier) {
      return res.status(404).render('pages/404', {
        title: 'Supplier Not Found', 
        message: 'The supplier you are looking for could not be found.',
        locale: currentLanguage,
        theme: req.cookies.theme || 'light'
      });
    }
    
    // Only show active suppliers
    if (supplier.status !== 'active') {
      return res.status(404).render('pages/404', {
        title: 'Supplier Not Available',
        message: 'This supplier profile is not currently available.',
        locale: currentLanguage,
        theme: req.cookies.theme || 'light'
      });
    }
    
    // Increment profile views (this is the correct place for profile views increment)
    User.findByIdAndUpdate(supplierId, {
      $inc: { profileViews: 1 }
    }).catch(err => console.error('Error updating supplier profile views:', err));
    
    // Fetch supplier's products with proper filtering
    const supplierProducts = await Product.find({
      manufacturer: supplierId,
      status: 'active',
      visibility: 'public'
    })
    .select('name images pricing averageRating totalReviews analytics isFeatured '
           + 'category inventory.availableStock createdAt')
    .populate('category', 'name slug')
    .sort({ isFeatured: -1, 'analytics.views': -1, createdAt: -1 })
    .limit(50)
    .lean();
    
    // Fetch categories for the supplier's products
    const supplierCategories = await Product.aggregate([
      { $match: { manufacturer: new mongoose.Types.ObjectId(supplierId), status: 'active' } },
      { $group: { _id: '$category', productCount: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $project: { name: '$categoryInfo.name', slug: '$categoryInfo.slug', productCount: 1 } },
      { $sort: { productCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Calculate business metrics with REAL database data only - PROFESSIONAL IMPLEMENTATION
    // Use same approach as product details page - direct supplier data without parsing
    const businessMetrics = {
      // Core real data from database - Direct values (same as product details page)
      experienceYears: supplier.establishedYear 
        ? Math.max(0, new Date().getFullYear() - supplier.establishedYear)
        : 0,
      profileViews: supplier.profileViews || 0,
      totalProducts: supplier.totalProducts || 0,
      totalOrders: supplier.totalOrders || 0,
      completedOrders: supplier.completedOrders || 0,
      averageRating: supplier.averageRating || 0,
      totalReviews: supplier.totalReviews || 0,
      
      // Calculated metrics from real data - Direct values
      completionRate: (supplier.totalOrders && supplier.totalOrders > 0) 
        ? Math.round(((supplier.completedOrders || 0) / supplier.totalOrders) * 100) 
        : 0,
      
      // Success rate (same as completion rate for now, can be enhanced later)
      successRate: (supplier.totalOrders && supplier.totalOrders > 0) 
        ? Math.round(((supplier.completedOrders || 0) / supplier.totalOrders) * 100) 
        : 0,
      
      // Additional professional metrics
      activeOrders: Math.max(0, (supplier.totalOrders || 0) - (supplier.completedOrders || 0)),
      memberSince: supplier.createdAt ? new Date(supplier.createdAt).getFullYear() : null,
      lastActive: supplier.updatedAt || supplier.createdAt
    };
    
    // Debug: Log calculated business metrics
    console.log('📊 Calculated business metrics:', businessMetrics);
    console.log('🔍 Raw supplier data from DB:', {
        totalProducts: supplier.totalProducts,
        totalOrders: supplier.totalOrders,
        completedOrders: supplier.completedOrders,
        averageRating: supplier.averageRating,
        totalReviews: supplier.totalReviews,
        profileViews: supplier.profileViews
    });
    
    // Calculate supplier verification badge
    const verificationBadge = calculateSupplierVerification(supplier);
    supplier.verificationBadge = verificationBadge;
    
    // Increment profile view count (async, don't wait) - SINGLE INCREMENT
    User.findByIdAndUpdate(supplierId, {
      $inc: { profileViews: 1 }
    }).catch(err => console.error('Error updating profile views:', err));
    
    // Validate and sanitize supplier data for professional display
    const sanitizedSupplier = {
      ...supplier,
      companyName: supplier.companyName || supplier.businessName || 'Unknown Company',
      description: supplier.description || 'No description available',
      email: supplier.email || 'No email provided',
      phone: supplier.phone || 'No phone provided',
      website: supplier.website || null,
      address: supplier.address || 'No address provided',
      city: supplier.city || 'Unknown',
      country: supplier.country || 'Unknown',
      activityType: supplier.activityType || 'other',
      establishedYear: supplier.establishedYear || null,
      employeeCount: supplier.employeeCount || 0
    };
    
    // Prepare template data with professional B2B context
    const templateData = {
      title: `${sanitizedSupplier.companyName} - Supplier Profile | SLEX`,
      supplier: sanitizedSupplier,
      supplierProducts,
      supplierCategories,
      businessMetrics,
      totalProductsCount: businessMetrics.totalProducts, // Use real count, not frontend count
      locale: currentLanguage,
      theme: req.cookies.theme || 'light',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      error: null, 
      user: req.user || null,
      // SEO and metadata
      metaDescription: supplier.description || `${supplier.companyName} - Professional B2B supplier on SLEX marketplace`,
      metaKeywords: `${supplier.companyName}, B2B supplier, ${supplier.industry || 'business'}, ${supplier.country || 'international'} trade`,
      // Helper functions for template
      helpers: {
        formatDate: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        formatNumber: (num) => num ? num.toLocaleString() : '0',
        truncateText: (text, length = 150) => text && text.length > length ? text.substring(0, length) + '...' : text || '',
        getImageUrl: (imagePath) => imagePath ? (imagePath.startsWith('http') ? imagePath : `/uploads/${imagePath}`) : '/img/default-supplier.jpg'
      }
    };
    
    // Render professional supplier profile page
    res.render('pages/supplier-profile', templateData);
    
  } catch (error) {
    console.error('❌ Supplier profile error:', error);
    res.status(500).render('pages/500', {
      title: 'Server Error',
      message: 'Unable to load supplier profile at this time.',
      locale: req.language || 'en',
      theme: req.cookies.theme || 'light'
    });
  }
});

// Helper functions for business metrics calculation - REMOVED FAKE CALCULATIONS
// All metrics now use real database data only

function calculateSupplierVerification(supplier) {
  // Professional supplier verification calculation
  const verificationCriteria = {
    hasBusinessLicense: !!supplier.taxNumber,
    hasCompleteBriefInfo: !!(supplier.companyName && supplier.description && supplier.activityType),
    hasContactInfo: !!(supplier.email && supplier.phone),
    hasAddress: !!(supplier.country && supplier.city),
    hasLogo: !!supplier.companyLogo,
    isActive: supplier.status === 'active',
    hasBusinessDate: !!supplier.businessStartDate
  };
  
  const verifiedCount = Object.values(verificationCriteria).filter(Boolean).length;
  const totalCriteria = Object.keys(verificationCriteria).length;
  const verificationPercentage = (verifiedCount / totalCriteria) * 100;
  
  return {
    isVerified: verificationPercentage >= 70,
    percentage: Math.round(verificationPercentage),
    criteria: verificationCriteria,
    verifiedCount,
    totalCriteria
  };
}

// API Endpoint: Supplier Contact Form
router.post('/api/supplier/contact', async (req, res) => {
  try {
    const { supplierId, name, company, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!supplierId || !name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: supplierId, name, email, subject, message'
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
    
    // Validate supplier ID
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid supplier ID'
      });
    }
    
    // Get supplier information
    const supplier = await User.findById(supplierId).select('companyName email status');
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    if (supplier.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Supplier is not currently accepting inquiries'
      });
    }
    
    // Create inquiry record
    const inquiryData = {
      id: new mongoose.Types.ObjectId(),
      timestamp: new Date(),
      supplier: {
        id: supplierId,
        name: supplier.companyName,
        email: supplier.email
      },
      contact: {
        name,
        company: company || 'Not specified',
        email,
        phone: phone || 'Not provided'
      },
      inquiry: {
        subject,
        message,
        type: 'general_inquiry'
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        source: 'supplier-profile'
      }
    };
     
    res.json({
      success: true,
      message: 'Inquiry sent successfully. The supplier will contact you within 24-48 hours.',
      inquiryId: inquiryData.id,
      supplierName: supplier.companyName,
      estimatedResponseTime: '24-48 hours'
    });
    
  } catch (error) {
    console.error('❌ Supplier contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit inquiry. Please try again later.'
    });
  }
});

// API Endpoint: Product Specific Inquiry from Supplier Profile
router.post('/api/supplier/product-inquiry', async (req, res) => {
  try {
    const { supplierId, productId, name, email, quantity, unit, message } = req.body;
    
    // Validate required fields
    if (!supplierId || !productId || !name || !email || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: supplierId, productId, name, email, quantity'
      });
    }
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(supplierId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid supplier or product ID'
      });
    }
    
    // Get supplier and product information
    const [supplier, product] = await Promise.all([
      User.findById(supplierId).select('companyName email status'),
      Product.findById(productId).select('name pricing manufacturer')
    ]);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    if (product.manufacturer.toString() !== supplierId) {
      return res.status(400).json({
        success: false,
        error: 'Product does not belong to this supplier'
      });
    }
    
    // Create product inquiry record
    const inquiryData = {
      id: new mongoose.Types.ObjectId(),
      timestamp: new Date(),
      supplier: {
        id: supplierId,
        name: supplier.companyName,
        email: supplier.email
      },
      product: {
        id: productId,
        name: product.name,
        pricing: product.pricing
      },
      contact: {
        name,
        email,
        quantity: parseInt(quantity),
        unit: unit || 'pieces'
      },
      inquiry: {
        message: message || `Inquiry for ${quantity} ${unit || 'pieces'} of ${product.name}`,
        type: 'product_inquiry'
      },
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        source: 'supplier-profile-product'
      }
    };
  
    res.json({
      success: true,
      message: 'Product inquiry sent successfully!',
      inquiryId: inquiryData.id,
      productName: product.name,
      supplierName: supplier.companyName,
      estimatedResponseTime: '24-48 hours'
    });
    
  } catch (error) {
    console.error('❌ Product inquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit product inquiry. Please try again later.'
    });
  }
});

// API Endpoint: Add Supplier to Favorites
router.post('/api/supplier/favorite', async (req, res) => {
  try {
    const { supplierId } = req.body;
    
    if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid supplier ID is required'
      });
    }
    
    // Check if supplier exists
    const supplier = await User.findById(supplierId).select('companyName status');
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    // Here you would typically save to user's favorites
    // const userId = req.user?.id; // From authentication middleware
    // await UserFavorites.create({ userId, supplierId, type: 'supplier' });
    
    res.json({
      success: true,
      message: `${supplier.companyName} added to favorites!`,
      supplierName: supplier.companyName
    });
    
  } catch (error) {
    console.error('❌ Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to favorites'
    });
  }
});

// API Endpoint: Report Supplier
router.post('/api/supplier/report', async (req, res) => {
  try {
    const { supplierId, reason, description } = req.body;
    
    if (!supplierId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Supplier ID and reason are required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid supplier ID'
      });
    }
    
    const reportData = {
      id: new mongoose.Types.ObjectId(),
      timestamp: new Date(),
      supplierId,
      reason,
      description: description || '',
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        source: 'supplier-profile'
      }
    };
    
    // Here you would save the report to database
    
    res.json({
      success: true,
      message: 'Report submitted successfully. Thank you for your feedback.',
      reportId: reportData.id
    });
    
  } catch (error) {
    console.error('❌ Report supplier error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    });
  }
});

module.exports = router;