/**
 * Favorite Model for Buyer Favorite Products
 * Alibaba-style favorites/wishlist implementation
 */

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // Buyer who owns this favorites list
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Favorite products
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // When product was added to favorites
    addedAt: {
      type: Date,
      default: Date.now
    },
    
    // Optional notes about why this product is favorited
    notes: String
  }],
  
  // Favorite suppliers/manufacturers
  suppliers: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // When supplier was added to favorites
    addedAt: {
      type: Date,
      default: Date.now
    },
    
    // Optional notes about the supplier
    notes: String,
    
    // Tags for organization
    tags: [String]
  }],
  
  // Summary counts
  totalProducts: {
    type: Number,
    default: 0
  },
  
  totalSuppliers: {
    type: Number,
    default: 0
  },
  
  // Last activity
  lastActivity: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// Indexes
favoriteSchema.index({ buyerId: 1 });
favoriteSchema.index({ 'products.productId': 1 });
favoriteSchema.index({ 'suppliers.supplierId': 1 });
favoriteSchema.index({ lastActivity: -1 });

// Compound index for checking if product is favorited
favoriteSchema.index({ buyerId: 1, 'products.productId': 1 });
favoriteSchema.index({ buyerId: 1, 'suppliers.supplierId': 1 });

// Pre-save middleware to calculate totals
favoriteSchema.pre('save', function(next) {
  this.totalProducts = this.products.length;
  this.totalSuppliers = this.suppliers.length;
  this.lastActivity = new Date();
  next();
});

// Static method to get or create favorites for buyer
favoriteSchema.statics.getOrCreateFavorites = async function(buyerId) {
  let favorites = await this.findOne({ buyerId })
    .populate('products.productId', 'name images pricing inventory')
    .populate('products.manufacturerId', 'companyName country')
    .populate('suppliers.supplierId', 'companyName country averageRating');
  
  if (!favorites) {
    favorites = new this({ buyerId, products: [], suppliers: [] });
    await favorites.save();
  }
  
  return favorites;
};

// Method to add product to favorites
favoriteSchema.methods.addProduct = function(productId, manufacturerId, notes = '') {
  // Check if product already exists
  const existingProduct = this.products.find(p => 
    p.productId.toString() === productId.toString()
  );
  
  if (existingProduct) {
    return false; // Already in favorites
  }
  
  this.products.push({
    productId,
    manufacturerId,
    notes
  });
  
  return this.save();
};

// Method to remove product from favorites
favoriteSchema.methods.removeProduct = function(productId) {
  const initialLength = this.products.length;
  this.products = this.products.filter(p => 
    p.productId.toString() !== productId.toString()
  );
  
  if (this.products.length < initialLength) {
    return this.save();
  }
  
  return false; // Product not found
};

// Method to add supplier to favorites
favoriteSchema.methods.addSupplier = function(supplierId, notes = '', tags = []) {
  // Check if supplier already exists
  const existingSupplier = this.suppliers.find(s => 
    s.supplierId.toString() === supplierId.toString()
  );
  
  if (existingSupplier) {
    return false; // Already in favorites
  }
  
  this.suppliers.push({
    supplierId,
    notes,
    tags
  });
  
  return this.save();
};

// Method to remove supplier from favorites
favoriteSchema.methods.removeSupplier = function(supplierId) {
  const initialLength = this.suppliers.length;
  this.suppliers = this.suppliers.filter(s => 
    s.supplierId.toString() !== supplierId.toString()
  );
  
  if (this.suppliers.length < initialLength) {
    return this.save();
  }
  
  return false; // Supplier not found
};

// Method to check if product is favorited
favoriteSchema.methods.isProductFavorited = function(productId) {
  return this.products.some(p => 
    p.productId.toString() === productId.toString()
  );
};

// Method to check if supplier is favorited
favoriteSchema.methods.isSupplierFavorited = function(supplierId) {
  return this.suppliers.some(s => 
    s.supplierId.toString() === supplierId.toString()
  );
};

// Method to get recent favorites
favoriteSchema.methods.getRecentProducts = function(limit = 10) {
  return this.products
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, limit);
};

// Method to get recent favorite suppliers
favoriteSchema.methods.getRecentSuppliers = function(limit = 10) {
  return this.suppliers
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, limit);
};

// Static method to check if product is favorited by buyer
favoriteSchema.statics.isProductFavorited = async function(buyerId, productId) {
  const favorites = await this.findOne({ 
    buyerId, 
    'products.productId': productId 
  });
  
  return !!favorites;
};

// Static method to check if supplier is favorited by buyer
favoriteSchema.statics.isSupplierFavorited = async function(buyerId, supplierId) {
  const favorites = await this.findOne({ 
    buyerId, 
    'suppliers.supplierId': supplierId 
  });
  
  return !!favorites;
};

// Static method to get favorite products for buyer
favoriteSchema.statics.getFavoriteProducts = async function(buyerId, limit = 20) {
  const favorites = await this.findOne({ buyerId })
    .populate({
      path: 'products.productId',
      select: 'name images pricing inventory status',
      match: { status: 'active' }
    })
    .populate('products.manufacturerId', 'companyName country averageRating');
  
  if (!favorites) {
    return [];
  }
  
  // Filter out any products that might be null due to populate match
  const validProducts = favorites.products.filter(p => p.productId && p.productId.status === 'active');
  
  return validProducts
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, limit);
};

// Static method to get favorite suppliers for buyer
favoriteSchema.statics.getFavoriteSuppliers = async function(buyerId, limit = 20) {
  const favorites = await this.findOne({ buyerId })
    .populate({
      path: 'suppliers.supplierId',
      select: 'companyName country averageRating totalReviews status',
      match: { status: 'active' }
    });
  
  if (!favorites) {
    return [];
  }
  
  // Filter out any suppliers that might be null due to populate match
  const validSuppliers = favorites.suppliers.filter(s => s.supplierId && s.supplierId.status === 'active');
  
  return validSuppliers
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .slice(0, limit);
};

module.exports = mongoose.model('Favorite', favoriteSchema);
