/**
 * Analytics API Test Script
 * Tests all analytics endpoints to ensure they're working correctly
 */

const mongoose = require('mongoose');
const axios = require('axios').default || require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test user credentials (you'll need to create an admin user first)
const TEST_ADMIN = {
  email: 'admin@test.com',
  password: 'admin123'
};

class AnalyticsTestSuite {
  constructor() {
    this.authToken = null;
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      return false;
    }
  }

  async authenticateAdmin() {
    try {
      const response = await this.axiosInstance.post('/auth/login', TEST_ADMIN);
      
      if (response.data.success && response.data.data.accessToken) {
        this.authToken = response.data.data.accessToken;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
        console.log('✅ Admin authentication successful');
        return true;
      } else {
        console.log('❌ Admin authentication failed - invalid response');
        return false;
      }
    } catch (error) {
      console.log('❌ Admin authentication failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testEndpoint(name, url, expectedFields = []) {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      console.log(`📡 URL: ${url}`);
      
      const response = await this.axiosInstance.get(url);
      
      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${name} - SUCCESS`);
        
        // Check for expected fields
        if (expectedFields.length > 0) {
          const missingFields = expectedFields.filter(field => 
            !this.hasNestedProperty(response.data.data, field)
          );
          
          if (missingFields.length > 0) {
            console.log(`⚠️  Missing expected fields: ${missingFields.join(', ')}`);
          } else {
            console.log(`✅ All expected fields present`);
          }
        }
        
        // Log data structure
        console.log(`📊 Data structure:`, this.summarizeObject(response.data.data));
        
        return { success: true, data: response.data.data };
      } else {
        console.log(`❌ ${name} - FAILED: Invalid response structure`);
        return { success: false, error: 'Invalid response structure' };
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.log(`❌ ${name} - FAILED (${status}): ${message}`);
      return { success: false, error: message, status };
    }
  }

  hasNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    return true;
  }

  summarizeObject(obj, maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth || typeof obj !== 'object' || obj === null) {
      return typeof obj;
    }
    
    if (Array.isArray(obj)) {
      return `Array(${obj.length})`;
    }
    
    const summary = {};
    for (const [key, value] of Object.entries(obj)) {
      summary[key] = this.summarizeObject(value, maxDepth, currentDepth + 1);
    }
    return summary;
  }

  async runAllTests() {
    console.log('🚀 Starting Analytics API Test Suite\n');
    
    // Test database connection
    const dbConnected = await this.connectDatabase();
    if (!dbConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Test authentication
    const authenticated = await this.authenticateAdmin();
    if (!authenticated) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    const tests = [
      {
        name: 'Overview Analytics',
        url: '/admin/api/analytics/overview',
        expectedFields: ['totalRevenue', 'activeUsers', 'totalOrders', 'conversionRate', 'trends']
      },
      {
        name: 'Revenue Analytics',
        url: '/admin/api/analytics/revenue',
        expectedFields: ['series', 'timeRange']
      },
      {
        name: 'User Analytics',
        url: '/admin/api/analytics/users',
        expectedFields: ['series', 'labels', 'timeSeries']
      },
      {
        name: 'Product Analytics',
        url: '/admin/api/analytics/products',
        expectedFields: ['products']
      },
      {
        name: 'Geographic Analytics',
        url: '/admin/api/analytics/geographic',
        expectedFields: ['countries', 'totalUsers']
      },
      {
        name: 'Realtime Analytics',
        url: '/admin/api/analytics/realtime',
        expectedFields: ['onlineUsers', 'activeSessions', 'recentActivities']
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const result = await this.testEndpoint(test.name, test.url, test.expectedFields);
      results.push({ ...test, result });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.result.success).length;
    const total = results.length;
    
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    if (total - successful > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.result.success).forEach(test => {
        console.log(`  - ${test.name}: ${test.result.error}`);
      });
    }
    
    console.log('\n🎯 All analytics API endpoints have been tested!');
    
    // Close database connection
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AnalyticsTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = AnalyticsTestSuite;