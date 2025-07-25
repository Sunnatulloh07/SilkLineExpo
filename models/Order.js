/**
 * Order Model
 * Handles B2B orders between distributors and manufacturers
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties Involved
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
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
    specifications: [{
      name: String,
      value: String
    }],
    customRequirements: String
  }],
  
  // Order Totals
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'UZS', 'EUR', 'CNY', 'KZT'],
    default: 'USD'
  },
  
  // Order Status Management
  status: {
    type: String,
    enum: [
      'draft', 'pending', 'confirmed', 'processing', 'manufacturing',
      'ready_to_ship', 'shipped', 'in_transit', 'delivered', 
      'completed', 'cancelled', 'refunded', 'disputed'
    ],
    default: 'pending'
  },
  
  // Status History
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // Shipping Information
  shipping: {
    method: {
      type: String,
      enum: ['standard', 'express', 'freight', 'pickup', 'custom']
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      contactPerson: String,
      contactPhone: String
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    carrier: String,
    shippingNotes: String
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['bank_transfer', 'letter_of_credit', 'cash_on_delivery', 'escrow', 'crypto'],
      required: true
    },
    terms: {
      type: String,
      enum: ['immediate', 'net_15', 'net_30', 'net_60', 'net_90', 'custom'],
      default: 'net_30'
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
      default: 'pending'
    },
    dueDate: Date,
    paidDate: Date,
    paidAmount: {
      type: Number,
      default: 0
    },
    paymentReference: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String,
      swiftCode: String
    }
  },
  
  // Communication
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
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      name: String,
      url: String,
      type: String
    }]
  }],
  
  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['invoice', 'proforma', 'packing_list', 'certificate', 'customs', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quality Control
  qualityControl: {
    inspectionRequired: {
      type: Boolean,
      default: false
    },
    inspectionDate: Date,
    inspectionResults: String,
    inspectedBy: String,
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Delivery Confirmation
  delivery: {
    deliveredDate: Date,
    receivedBy: String,
    deliveryNotes: String,
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryPhotos: [String]
  },
  
  // Important Dates
  requestedDeliveryDate: Date,
  confirmedDeliveryDate: Date,
  
  // Special Instructions
  specialInstructions: String,
  internalNotes: String,
  
  // Cancellation
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledDate: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed']
    }
  },
  
  // Analytics
  analytics: {
    processingTime: Number, // hours
    deliveryTime: Number,   // hours
    customerSatisfaction: Number
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1, 'payment.dueDate': 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Virtual for is overdue
orderSchema.virtual('isOverdue').get(function() {
  return this.payment.dueDate && this.payment.dueDate < new Date() && this.payment.status !== 'paid';
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discountAmount;
  
  next();
});

// Methods
orderSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    updatedBy,
    notes
  });
  
  this.status = newStatus;
  return this.save();
};

orderSchema.methods.addMessage = function(senderId, message, attachments = []) {
  this.messages.push({
    sender: senderId,
    message,
    attachments,
    timestamp: new Date()
  });
  
  return this.save();
};

orderSchema.methods.calculateDeliveryTime = function() {
  if (this.delivery.deliveredDate && this.createdAt) {
    return Math.floor((this.delivery.deliveredDate - this.createdAt) / (1000 * 60 * 60)); // hours
  }
  return null;
};

orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  return cancellableStatuses.includes(this.status);
};

// Static methods
orderSchema.statics.findByBuyer = function(buyerId, options = {}) {
  const query = { buyer: buyerId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('seller', 'companyName country')
    .populate('items.product', 'name category')
    .sort({ createdAt: -1 });
};

orderSchema.statics.findBySeller = function(sellerId, options = {}) {
  const query = { seller: sellerId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('buyer', 'companyName country')
    .populate('items.product', 'name category')
    .sort({ createdAt: -1 });
};

orderSchema.statics.getOrderStats = function(userId, userType = 'buyer') {
  const matchField = userType === 'buyer' ? 'buyer' : 'seller';
  
  return this.aggregate([
    { $match: { [matchField]: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' }
      }
    }
  ]);
};

// Static method to get platform order statistics
orderSchema.statics.getPlatformStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get monthly order trends
orderSchema.statics.getMonthlyTrends = function(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        orderCount: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' },
        averageValue: { $avg: '$totalAmount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);