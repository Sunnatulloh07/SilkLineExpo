/**
 * Analytics Data Model
 * Stores pre-computed analytics data for performance
 */

const mongoose = require('mongoose');

const analyticsDataSchema = new mongoose.Schema({
  // Time period identifier
  period: {
    type: String, // 'daily', 'weekly', 'monthly', 'yearly'
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  
  // Date for the analytics period
  date: {
    type: Date,
    required: true
  },
  
  // User metrics
  userMetrics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    blockedUsers: { type: Number, default: 0 },
    suspendedUsers: { type: Number, default: 0 },
    approvedUsers: { type: Number, default: 0 },
    rejectedUsers: { type: Number, default: 0 }
  },
  
  // Revenue metrics (simulated for B2B platform)
  revenueMetrics: {
    totalRevenue: { type: Number, default: 0 },
    subscriptionRevenue: { type: Number, default: 0 },
    transactionFees: { type: Number, default: 0 },
    premiumFeatures: { type: Number, default: 0 }
  },
  
  // Order metrics (simulated)
  orderMetrics: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  
  // Geographic distribution
  geographicData: [{
    country: String,
    users: Number,
    revenue: Number,
    percentage: Number
  }],
  
  // Activity type distribution
  activityData: [{
    activityType: String,
    users: Number,
    percentage: Number
  }],
  
  // Company type distribution
  companyTypeData: [{
    companyType: String,
    users: Number,
    percentage: Number
  }],
  
  // Performance metrics
  performanceMetrics: {
    conversionRate: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
    churnRate: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 }
  },
  
  // System metrics
  systemMetrics: {
    uptime: { type: Number, default: 99.9 },
    responseTime: { type: Number, default: 50 },
    errorRate: { type: Number, default: 0.1 },
    activeConnections: { type: Number, default: 0 }
  },
  
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// Compound unique index covers both period and date queries efficiently
analyticsDataSchema.index({ period: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('AnalyticsData', analyticsDataSchema);