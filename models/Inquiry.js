/**
 * Inquiry Model
 * Handles product inquiries and RFQs (Request for Quotation)
 */

const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  // Inquiry Identification
  inquiryNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Inquiry Type
  type: {
    type: String,
    enum: ['product_inquiry', 'quote_request', 'bulk_order', 'custom_order', 'partnership'],
    required: true
  },
  
  // Parties
  inquirer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Product Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  // Inquiry Details
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Product Requirements (Simplified for B2B)
  requestedQuantity: {
    type: Number,
    min: 1
  },
  
  unit: {
    type: String,
    enum: ['pieces', 'kg', 'tons', 'liters', 'meters', 'boxes', 'pallets'],
    default: 'pieces'
  },
  
  customSpecifications: {
    type: String,
    maxlength: 500
  },
  
  // Budget (Simplified)
  budgetMin: Number,
  budgetMax: Number,
  budgetCurrency: {
    type: String,
    enum: ['USD', 'UZS', 'EUR', 'CNY', 'KZT'],
    default: 'USD'
  },
  
  // Timeline (Simplified)
  urgency: {
    type: String,
    enum: ['flexible', 'within_month', 'within_week', 'immediate'],
    default: 'flexible'
  },
  
  requiredBy: Date,
  
  // Shipping (Simplified)
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'freight', 'pickup', 'custom'],
    default: 'standard'
  },
  
  incoterms: {
    type: String,
    enum: ['EXW', 'FCA', 'CPT', 'CIP', 'DAT', 'DAP', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF']
  },
  
  deliveryAddress: {
    type: String,
    maxlength: 300
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['open', 'responded', 'negotiating', 'quoted', 'accepted', 'rejected', 'expired', 'converted', 'archived'],
    default: 'open'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Communication Thread
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      name: String,
      url: String,
      type: String
    }],
    isQuote: {
      type: Boolean,
      default: false
    },
    quoteDetails: {
      unitPrice: Number,
      totalPrice: Number,
      currency: String,
      validUntil: Date,
      terms: String
    }
  }],
  
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'specification', 'drawing', 'other']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quote Information
  quotes: [{
    quotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['USD', 'UZS', 'EUR', 'CNY', 'KZT'],
      default: 'USD'
    },
    validUntil: Date,
    terms: String,
    notes: String,
    quotedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    }
  }],
  
  // Conversion
  convertedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Expiry
  expiresAt: Date,
  
  // Read Status
  readByManufacturer: {
    type: Boolean,
    default: false
  },
  readByBuyer: {
    type: Boolean,
    default: false
  },
  readAt: Date
  
}, {
  timestamps: true
});

// Indexes
inquirySchema.index({ inquiryNumber: 1 });
inquirySchema.index({ inquirer: 1, status: 1 });
inquirySchema.index({ supplier: 1, status: 1 });
inquirySchema.index({ product: 1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ expiresAt: 1 });

// Pre-save middleware
inquirySchema.pre('save', async function(next) {
  if (this.isNew && !this.inquiryNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.inquiryNumber = `INQ-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Set expiry date if not set
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

// Methods
inquirySchema.methods.addMessage = function(senderId, message, attachments = [], isQuote = false, quoteDetails = null) {
  const messageData = {
    sender: senderId,
    message,
    attachments,
    timestamp: new Date(),
    isQuote
  };
  
  if (isQuote && quoteDetails) {
    messageData.quoteDetails = quoteDetails;
  }
  
  this.messages.push(messageData);
  
  // Update status
  if (this.status === 'open') {
    this.status = 'responded';
  }
  
  return this.save();
};

inquirySchema.methods.addQuote = function(quotedBy, unitPrice, totalPrice, currency, validUntil, terms, notes) {
  this.quotes.push({
    quotedBy,
    unitPrice,
    totalPrice,
    currency,
    validUntil,
    terms,
    notes,
    quotedAt: new Date()
  });
  
  this.status = 'quoted';
  return this.save();
};

inquirySchema.methods.acceptQuote = function(quoteId) {
  const quote = this.quotes.id(quoteId);
  if (quote) {
    quote.status = 'accepted';
    this.status = 'accepted';
  }
  return this.save();
};

inquirySchema.methods.rejectQuote = function(quoteId) {
  const quote = this.quotes.id(quoteId);
  if (quote) {
    quote.status = 'rejected';
  }
  return this.save();
};

inquirySchema.methods.convertToOrder = function(orderId) {
  this.convertedOrder = orderId;
  this.status = 'converted';
  return this.save();
};

// Removed analytics and follow-up methods - these should be handled by separate systems

// Static methods
inquirySchema.statics.findByInquirer = function(inquirerId, options = {}) {
  const query = { inquirer: inquirerId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('supplier', 'companyName country')
    .populate('product', 'name category')
    .sort({ createdAt: -1 });
};

inquirySchema.statics.findBySupplier = function(supplierId, options = {}) {
  const query = { supplier: supplierId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('inquirer', 'companyName country')
    .populate('product', 'name category')
    .sort({ createdAt: -1 });
};

inquirySchema.statics.getExpiredInquiries = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $nin: ['converted', 'expired', 'rejected'] }
  });
};

module.exports = mongoose.model('Inquiry', inquirySchema);