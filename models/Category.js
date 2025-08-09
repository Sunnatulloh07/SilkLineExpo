/**
 * Category Model - Professional B2B Marketplace
 * Senior Software Engineer Level Implementation
 * 
 * Features:
 * - Hierarchical category structure (parent/child)
 * - Multi-language support
 * - Rich metadata and SEO fields
 * - Product count tracking
 * - Advanced business metrics
 * - Professional validation
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    index: true
  },
  
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-_]+$/, 'Slug can only contain lowercase letters, numbers, hyphens and underscores'],
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },

  // Multi-language Support
  translations: {
    uz: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    },
    en: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    },
    ru: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    },
    tr: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    },
    fa: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    },
    zh: {
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      shortDescription: { type: String, trim: true }
    }
  },

  // Hierarchical Structure
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative'],
    max: [5, 'Maximum category depth is 5'],
    index: true
  },
  
  path: {
    type: String,
    default: '',
    index: true
  },
  
  // Visual Representation
  icon: {
    type: String,
    trim: true,
    default: 'las la-folder'
  },
  
  color: {
    type: String,
    trim: true,
    match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'],
    default: '#3B82F6'
  },
  
  image: {
    url: { type: String, trim: true },
    alt: { type: String, trim: true },
    publicId: { type: String, trim: true }
  },
  
  banner: {
    url: { type: String, trim: true },
    alt: { type: String, trim: true },
    publicId: { type: String, trim: true }
  },

  // Business Metrics & Analytics
  metrics: {
    totalProducts: { type: Number, default: 0, min: 0 },
    activeProducts: { type: Number, default: 0, min: 0 },
    totalManufacturers: { type: Number, default: 0, min: 0 },
    totalDistributors: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    averageProductPrice: { type: Number, default: 0, min: 0 },
    totalSubcategories: { type: Number, default: 0, min: 0 },
    topSellingProducts: [{ 
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      sales: { type: Number, default: 0 }
    }],
    monthlyGrowth: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0, min: 0, max: 100 }
  },

  // SEO & Marketing
  seo: {
    metaTitle: { type: String, trim: true, maxlength: 60 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    metaKeywords: [{ type: String, trim: true }],
    canonicalUrl: { type: String, trim: true },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImage: { type: String, trim: true }
  },

  // Category Configuration
  settings: {
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    allowProducts: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    maxProductsPerPage: { type: Number, default: 20, min: 5, max: 100 }
  },

  // Business Rules
  businessRules: {
    allowedCompanyTypes: [{
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer'],
      default: ['manufacturer', 'distributor']
    }],
    minimumOrderQuantity: { type: Number, default: 1, min: 1 },
    supportedCurrencies: [{
      type: String,
      enum: ['USD', 'EUR', 'UZS', 'KZT', 'CNY', 'RUB'],
      default: ['USD', 'UZS']
    }],
    requireCertifications: { type: Boolean, default: false },
    restrictedCountries: [{ type: String, trim: true }]
  },

  // Content Management
  content: {
    buyingGuide: { type: String, trim: true },
    qualityStandards: { type: String, trim: true },
    pricingInformation: { type: String, trim: true },
    shippingGuidelines: { type: String, trim: true },
    customFields: [{
      name: { type: String, required: true, trim: true },
      type: { 
        type: String, 
        enum: ['text', 'number', 'boolean', 'select', 'multiselect', 'textarea'],
        required: true 
      },
      required: { type: Boolean, default: false },
      options: [{ type: String, trim: true }]
    }]
  },

  // Administrative Fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'active',
    index: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required'],
    index: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  approvedAt: {
    type: Date,
    index: true
  },

  // Audit Trail
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'activated', 'deactivated', 'archived', 'deleted'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    reason: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for Performance
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ slug: 1, status: 1 });
categorySchema.index({ parentCategory: 1, level: 1 });
categorySchema.index({ 'settings.isActive': 1, 'settings.isVisible': 1 });
categorySchema.index({ 'metrics.totalProducts': -1 });
categorySchema.index({ 'metrics.popularityScore': -1 });
categorySchema.index({ createdAt: -1 });
categorySchema.index({ updatedAt: -1 });
// Additional indexes for better query performance  
categorySchema.index({ level: 1, 'settings.sortOrder': 1 });
categorySchema.index({ status: 1, 'settings.isFeatured': -1 });
categorySchema.index({ createdBy: 1, status: 1 });

// Virtual Fields
categorySchema.virtual('childCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

categorySchema.virtual('fullPath').get(function() {
  return this.path ? `${this.path}/${this.slug}` : this.slug;
});

categorySchema.virtual('isRootCategory').get(function() {
  return this.level === 0 && !this.parentCategory;
});

categorySchema.virtual('hasChildren').get(function() {
  return this.metrics.totalSubcategories > 0;
});

// Pre-save Middleware
categorySchema.pre('save', async function(next) {
  try {
    // Generate slug if not provided
    if (!this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Set level and path based on parent
    if (this.parentCategory) {
      const parent = await this.constructor.findById(this.parentCategory);
      if (parent) {
        this.level = parent.level + 1;
        this.path = parent.path ? `${parent.path}/${parent.slug}` : parent.slug;
        
        // Validate maximum depth
        if (this.level > 5) {
          throw new Error('Maximum category depth of 5 levels exceeded');
        }
      }
    } else {
      this.level = 0;
      this.path = '';
    }

    // Set default translations
    if (!this.translations.en.name) {
      this.translations.en.name = this.name;
      this.translations.en.description = this.description;
      this.translations.en.shortDescription = this.shortDescription;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static Methods
categorySchema.statics.findActive = function(conditions = {}) {
  return this.find({
    ...conditions,
    status: 'active',
    'settings.isActive': true
  });
};

categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'active' });
};

categorySchema.statics.findRootCategories = function() {
  return this.find({
    level: 0,
    parentCategory: null,
    status: 'active',
    'settings.isVisible': true
  }).sort({ 'settings.sortOrder': 1, name: 1 });
};

categorySchema.statics.buildHierarchy = async function(parentId = null, level = 0) {
  const categories = await this.find({
    parentCategory: parentId,
    status: 'active',
    'settings.isVisible': true
  }).sort({ 'settings.sortOrder': 1, name: 1 });

  const result = [];
  for (const category of categories) {
    const categoryObj = category.toObject();
    categoryObj.children = await this.buildHierarchy(category._id, level + 1);
    result.push(categoryObj);
  }
  
  return result;
};

// Instance Methods
categorySchema.methods.updateMetrics = async function() {
  try {
    const Product = mongoose.model('Product');
    
    // Count products in this category and all subcategories
    const subcategoryIds = await this.getSubcategoryIds();
    const allCategoryIds = [this._id, ...subcategoryIds];
    
    // Get comprehensive product statistics
    const [productStats, manufacturerStats, subcategoryCount] = await Promise.all([
      // Basic product statistics
      Product.aggregate([
        { $match: { category: { $in: allCategoryIds } } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            averagePrice: { $avg: '$pricing.basePrice' },
            totalRevenue: { $sum: '$businessMetrics.totalRevenue' },
            totalOrders: { $sum: '$businessMetrics.totalOrdersCount' }
          }
        }
      ]),
      
      // Manufacturer statistics
      Product.aggregate([
        { $match: { category: { $in: allCategoryIds } } },
        { $group: { _id: '$manufacturer' } },
        { $count: 'totalManufacturers' }
      ]),
      
      // Subcategory count
      this.constructor.countDocuments({ parentCategory: this._id })
    ]);

    // Update metrics
    if (productStats.length > 0) {
      const stats = productStats[0];
      this.metrics.totalProducts = stats.totalProducts || 0;
      this.metrics.activeProducts = stats.activeProducts || 0;
      this.metrics.averageProductPrice = stats.averagePrice || 0;
      this.metrics.totalRevenue = stats.totalRevenue || 0;
      this.metrics.totalOrders = stats.totalOrders || 0;
    } else {
      // Reset metrics if no products
      this.metrics.totalProducts = 0;
      this.metrics.activeProducts = 0;
      this.metrics.averageProductPrice = 0;
      this.metrics.totalRevenue = 0;
      this.metrics.totalOrders = 0;
    }
    
    // Update manufacturer count
    this.metrics.totalManufacturers = manufacturerStats[0]?.totalManufacturers || 0;
    
    // Update subcategory count
    this.metrics.totalSubcategories = subcategoryCount;
    
    // Calculate popularity score based on products, views, and revenue
    this.metrics.popularityScore = Math.min(100, Math.round(
      (this.metrics.totalProducts * 2) + 
      (this.metrics.totalRevenue / 1000) + 
      (this.metrics.totalOrders * 5)
    ));

    await this.save();
  } catch (error) {
    console.error('Error updating category metrics:', error);
    throw error;
  }
};

categorySchema.methods.getSubcategoryIds = async function() {
  // Escape special regex characters and build proper path pattern
  const fullPath = this.path ? `${this.path}/${this.slug}` : this.slug;
  const escapedPath = fullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const subcategories = await this.constructor.find(
    { 
      $or: [
        { path: new RegExp(`^${escapedPath}/`) }, // Direct children
        { path: new RegExp(`^${escapedPath}$`) }   // This category itself
      ]
    },
    '_id'
  );
  return subcategories.map(cat => cat._id);
};

categorySchema.methods.addAuditLog = function(action, performedBy, changes = {}, reason = '') {
  this.auditLog.push({
    action,
    performedBy,
    changes,
    reason,
    performedAt: new Date()
  });
};

// Post-save Middleware - Update parent category metrics
categorySchema.post('save', async function(doc) {
  try {
    if (doc.parentCategory) {
      const parent = await this.constructor.findById(doc.parentCategory);
      if (parent) {
        await parent.updateMetrics();
      }
    }
  } catch (error) {
    console.error('Error updating parent category metrics:', error);
    // Don't throw error to avoid breaking the save operation
  }
});

// Pre-remove Middleware
categorySchema.pre('remove', async function(next) {
  try {
    // Check if category has products
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });
    
    if (productCount > 0) {
      throw new Error('Cannot delete category that contains products');
    }

    // Check if category has subcategories
    const subcategoryCount = await this.constructor.countDocuments({ 
      parentCategory: this._id 
    });
    
    if (subcategoryCount > 0) {
      throw new Error('Cannot delete category that has subcategories');
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Export Model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;