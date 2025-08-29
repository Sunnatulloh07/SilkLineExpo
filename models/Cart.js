/**
 * Cart Model for Buyer Shopping Cart
 * Alibaba-style shopping cart implementation
 */

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  // Buyer who owns this cart
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // One cart per buyer
    index: true
  },
  
  // Cart items
  items: [{
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
    
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Selected specifications (color, size, etc.)
    selectedSpecs: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Custom requirements or notes
    notes: String,
    
    // When item was added to cart
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cart summary
  totalItems: {
    type: Number,
    default: 0
  },
  
  totalAmount: {
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
cartSchema.index({ buyerId: 1 });
cartSchema.index({ 'items.productId': 1 });
cartSchema.index({ lastActivity: -1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.lastActivity = new Date();
  next();
});

// Static method to get or create cart for buyer
cartSchema.statics.getOrCreateCart = async function(buyerId) {
  let cart = await this.findOne({ buyerId })
    .populate({
      path: 'items.productId',
      select: 'name title description images pricing inventory category manufacturer status',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .populate('items.manufacturerId', 'companyName businessName');
  
  if (!cart) {
    cart = new this({ buyerId, items: [] });
    await cart.save();
  }
  
  return cart;
};

// Method to add item to cart
cartSchema.methods.addItem = function(itemData) {
  const {
    productId, manufacturerId, quantity, unitPrice, selectedSpecs = {}, notes = ''
  } = itemData;
  
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(item => 
    item.productId.toString() === productId.toString() &&
    JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs)
  );
  
  if (existingItemIndex !== -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].quantity * this.items[existingItemIndex].unitPrice;
  } else {
    // Add new item
    this.items.push({
      productId,
      manufacturerId,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      selectedSpecs,
      notes
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItem = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }
  
  if (quantity <= 0) {
    return this.removeItem(itemId);
  }
  
  item.quantity = quantity;
  item.totalPrice = quantity * item.unitPrice;
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items.pull(itemId);
  return this.save();
};

// Method to clear entire cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
  const summary = {
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    itemsByManufacturer: {}
  };
  
  // Group items by manufacturer for checkout organization
  this.items.forEach(item => {
    const manufacturerId = item.manufacturerId.toString();
    if (!summary.itemsByManufacturer[manufacturerId]) {
      summary.itemsByManufacturer[manufacturerId] = {
        items: [],
        totalAmount: 0,
        totalItems: 0
      };
    }
    
    summary.itemsByManufacturer[manufacturerId].items.push(item);
    summary.itemsByManufacturer[manufacturerId].totalAmount += item.totalPrice;
    summary.itemsByManufacturer[manufacturerId].totalItems += item.quantity;
  });
  
  return summary;
};

module.exports = mongoose.model('Cart', cartSchema);
