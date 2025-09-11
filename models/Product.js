/**
 * Product Model
 * Handles manufacturer products and inventory
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  shortDescription: {
    type: String,
    maxlength: 500
  },
  
  // Manufacturer Information
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Product Classification - Updated to use Category references
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  
  // Legacy category support for migration
  legacyCategory: {
    type: String,
    enum: [
      'food_beverages', 'textiles_clothing', 'electronics', 'machinery_equipment',
      'chemicals', 'agriculture', 'construction_materials', 'automotive', 
      'pharmaceuticals', 'other'
    ]
  },
  
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  // Additional category tags for flexible classification
  categoryTags: [{
    type: String,
    trim: true
  }],
  
  // Product Specifications
  specifications: [{
    name: String,
    value: String,
    unit: String
  }],
  
  // Pricing Information
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'UZS', 'EUR', 'CNY', 'KZT']
    },
    priceType: {
      type: String,
      enum: ['fixed', 'negotiable', 'quote_based'],
      default: 'fixed'
    },
    minimumOrderQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    maximumOrderQuantity: {
      type: Number
    },
    bulkPricing: [{
      minQuantity: Number,
      maxQuantity: Number,
      price: Number,
      discount: Number
    }]
  },
  
  // Inventory Management
  inventory: {
    totalStock: {
      type: Number,
      required: true,
      min: 0
    },
    availableStock: {
      type: Number,
      required: true,
      min: 0
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['pieces', 'kg', 'tons', 'liters', 'meters', 'boxes', 'pallets']
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    restockDate: Date
  },
  
  // Product Media
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean,
    uploadDate: Date
  }],
  
  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['datasheet', 'certificate', 'manual', 'brochure', 'other']
    },
    uploadDate: Date
  }],
  
  // Quality & Compliance
  qualityStandards: [{
    type: String,
    enum: ['ISO9001', 'ISO14001', 'HACCP', 'FDA', 'CE', 'GOST', 'other']
  }],
  
  certifications: [{
    name: String,
    issuedBy: String,
    certificateNumber: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  
  // Shipping & Logistics
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'inch'],
        default: 'cm'
      }
    },
    packagingType: String,
    shippingClass: {
      type: String,
      enum: ['standard', 'fragile', 'hazardous', 'perishable', 'oversized']
    },
    leadTime: {
      min: Number, // days
      max: Number  // days
    },
    methods: [{
      type: String,
      enum: ['standard', 'express', 'pickup', 'overnight', 'international']
    }]
  },
  
  // Business Information
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'discontinued', 'out_of_stock'],
    default: 'draft'
  },
  
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  
  // SEO & Marketing
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  tags: [String],
  
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    uniqueViewers: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Business Metrics for Category Analytics
  businessMetrics: {
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOrdersCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalQuantitySold: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyRevenue: [{
      month: String, // YYYY-MM format
      revenue: Number,
      orders: Number,
      quantity: Number
    }],
    lastSaleDate: Date,
    bestSellingMonth: String,
    popularityRank: {
      type: Number,
      default: 0
    }
  },
  
  // Reviews & Ratings
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Promotion
  isPromoted: {
    type: Boolean,
    default: false
  },
  
  promotionExpiry: Date,
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Marketplace Information
  publishedAt: {
    type: Date,
    index: true
  },
  
  unpublishedAt: {
    type: Date
  },
  
  marketplaceCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productSchema.index({ manufacturer: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'pricing.basePrice': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isPromoted: 1, isFeatured: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.inventory.availableStock === 0) return 'out_of_stock';
  if (this.inventory.availableStock <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for price range
productSchema.virtual('priceRange').get(function() {
  if (!this.pricing.bulkPricing || this.pricing.bulkPricing.length === 0) {
    return {
      min: this.pricing.basePrice,
      max: this.pricing.basePrice
    };
  }
  
  const prices = [this.pricing.basePrice, ...this.pricing.bulkPricing.map(bp => bp.price)];
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
});

// Virtual for rating compatibility (for backward compatibility)
productSchema.virtual('rating').get(function() {
  return this.averageRating;
});

// Methods
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.inventory.availableStock = Math.max(0, this.inventory.availableStock - quantity);
  } else if (operation === 'add') {
    this.inventory.availableStock += quantity;
  }
  
  // Update total stock if needed
  this.inventory.totalStock = this.inventory.availableStock + this.inventory.reservedStock;
  
  return this.save();
};

productSchema.methods.reserveStock = function(quantity) {
  if (this.inventory.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.inventory.availableStock -= quantity;
  this.inventory.reservedStock += quantity;
  
  return this.save();
};

productSchema.methods.releaseReservedStock = function(quantity) {
  const releaseAmount = Math.min(quantity, this.inventory.reservedStock);
  this.inventory.reservedStock -= releaseAmount;
  this.inventory.availableStock += releaseAmount;
  
  return this.save();
};

productSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

productSchema.methods.calculateBulkPrice = function(quantity) {
  if (!this.pricing.bulkPricing || this.pricing.bulkPricing.length === 0) {
    return this.pricing.basePrice;
  }
  
  // Find applicable bulk pricing
  const applicablePricing = this.pricing.bulkPricing
    .filter(bp => quantity >= bp.minQuantity && (!bp.maxQuantity || quantity <= bp.maxQuantity))
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  
  return applicablePricing ? applicablePricing.price : this.pricing.basePrice;
};

// Static methods
productSchema.statics.findByManufacturer = function(manufacturerId, options = {}) {
  const query = { manufacturer: manufacturerId };
  
  if (options.status) query.status = options.status;
  if (options.category) query.category = options.category;
  
  return this.find(query)
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug level')
    .populate('subcategory', 'name slug')
    .sort(options.sort || { createdAt: -1 });
};

productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    status: 'active'
  };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  if (filters.category) query.category = filters.category;
  if (filters.minPrice) query['pricing.basePrice'] = { $gte: filters.minPrice };
  if (filters.maxPrice) {
    query['pricing.basePrice'] = query['pricing.basePrice'] || {};
    query['pricing.basePrice'].$lte = filters.maxPrice;
  }
  if (filters.country) {
    // Need to populate manufacturer first, then filter
  }
  
  let sortCriteria = { createdAt: -1 };
  if (searchTerm) {
    sortCriteria = { score: { $meta: 'textScore' } };
  } else if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price_low':
        sortCriteria = { 'pricing.basePrice': 1 };
        break;
      case 'price_high':
        sortCriteria = { 'pricing.basePrice': -1 };
        break;
      case 'rating':
        sortCriteria = { averageRating: -1 };
        break;
      case 'popular':
        sortCriteria = { 'analytics.views': -1 };
        break;
    }
  }
  
  return this.find(query)
    .populate('manufacturer', 'companyName country averageRating')
    .populate('category', 'name slug level')
    .populate('subcategory', 'name slug')
    .sort(sortCriteria);
};

// Static method to get trending products
productSchema.statics.getTrendingProducts = function(limit = 10) {
  return this.find({ status: 'active' })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug level')
    .sort({ 'analytics.views': -1, 'analytics.orders': -1 })
    .limit(limit);
};

// Static method to get featured products
productSchema.statics.getFeaturedProducts = function(limit = 10) {
  return this.find({ 
    status: 'active', 
    isFeatured: true 
  })
    .populate('manufacturer', 'companyName country averageRating')
    .populate('category', 'name slug level')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get products by category
productSchema.statics.getByCategory = function(categoryId, limit = 20) {
  return this.find({ 
    status: 'active', 
    category: categoryId 
  })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug level')
    .sort({ averageRating: -1, 'analytics.views': -1 })
    .limit(limit);
};

// Static method to get products by category hierarchy (including subcategories)
productSchema.statics.getByCategoryHierarchy = async function(categoryId, limit = 20) {
  const Category = mongoose.model('Category');
  
  // First get the category to get its path info
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Build proper path pattern for subcategories
  const fullPath = category.path ? `${category.path}/${category.slug}` : category.slug;
  const escapedPath = fullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Get all subcategory IDs for this category
  const subcategoryIds = await Category.find({ 
    $or: [
      { _id: categoryId }, // Include the category itself
      { parentCategory: categoryId }, // Direct children
      { path: new RegExp(`^${escapedPath}/`) } // All descendants
    ]
  }).distinct('_id');
  
  return this.find({ 
    status: 'active', 
    category: { $in: subcategoryIds }
  })
    .populate('manufacturer', 'companyName country')
    .populate('category', 'name slug level parentCategory')
    .sort({ averageRating: -1, 'analytics.views': -1 })
    .limit(limit);
};

// Method to update business metrics
productSchema.methods.updateBusinessMetrics = function(orderData) {
  const { quantity, totalAmount, orderDate = new Date() } = orderData;
  
  // Update main metrics
  this.businessMetrics.totalRevenue += totalAmount;
  this.businessMetrics.totalOrdersCount += 1;
  this.businessMetrics.totalQuantitySold += quantity;
  this.businessMetrics.averageOrderValue = this.businessMetrics.totalRevenue / this.businessMetrics.totalOrdersCount;
  this.businessMetrics.lastSaleDate = orderDate;
  
  // Update monthly revenue tracking
  const month = orderDate.toISOString().substring(0, 7); // YYYY-MM format
  const monthlyRecord = this.businessMetrics.monthlyRevenue.find(m => m.month === month);
  
  if (monthlyRecord) {
    monthlyRecord.revenue += totalAmount;
    monthlyRecord.orders += 1;
    monthlyRecord.quantity += quantity;
  } else {
    this.businessMetrics.monthlyRevenue.push({
      month,
      revenue: totalAmount,
      orders: 1,
      quantity
    });
  }
  
  // Update best selling month
  const bestMonth = this.businessMetrics.monthlyRevenue.reduce((best, current) => 
    current.revenue > best.revenue ? current : best
  );
  this.businessMetrics.bestSellingMonth = bestMonth.month;
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);