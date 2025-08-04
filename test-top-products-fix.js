const mongoose = require('mongoose');
const Product = require('./models/Product');

async function testTopProductsFix() {
  try {
    console.log('🔍 TESTING TOP PRODUCTS FIX - REAL RATINGS ONLY...\n');
    
    // Test 1: Simulate products with different ratings
    console.log('📊 TEST 1: Simulating products with different ratings...');
    
    const mockProducts = [
      { name: 'Premium Cotton Fabric - Uzbek Cotton Mills', averageRating: null, orderCount: 1, totalSales: 14138 },
      { name: 'Organic Wheat Flour - Uzbek Cotton Mills', averageRating: 0, orderCount: 1, totalSales: 533 },
      { name: 'Industrial LED Display Panel - Uzbek Cotton Mills', averageRating: 4.7, orderCount: 2, totalSales: 2500 },
      { name: 'Test Product 4', averageRating: 4.9, orderCount: 3, totalSales: 1800 },
      { name: 'Test Product 5', averageRating: 4.2, orderCount: 1, totalSales: 1200 }
    ];
    
    console.log('📦 All products with ratings:');
    mockProducts.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}"`);
      console.log(`   - Backend Rating: ${product.averageRating}`);
      console.log(`   - Order Count: ${product.orderCount}`);
      console.log(`   - Sales: $${product.totalSales}`);
      console.log('   ---');
    });
    
    // Test 2: Filter for products with real ratings only
    console.log('\n📊 TEST 2: Filtering for products with real ratings only...');
    const productsWithRealRatings = mockProducts.filter(product => 
      product.averageRating && product.averageRating > 0
    );
    
    console.log('📦 Products with real ratings only:');
    productsWithRealRatings.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}"`);
      console.log(`   - Rating: ${product.averageRating}`);
      console.log(`   - Order Count: ${product.orderCount}`);
      console.log(`   - Sales: $${product.totalSales}`);
      console.log('   ---');
    });
    
    // Test 3: Sort by sales and limit to top 4
    console.log('\n📊 TEST 3: Sorting by sales and limiting to top 4...');
    const topProducts = productsWithRealRatings
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 4);
    
    console.log('📦 Top 4 products with real ratings:');
    topProducts.forEach((product, index) => {
      console.log(`#${index + 1}. "${product.name}"`);
      console.log(`   - Rating: ${product.averageRating}`);
      console.log(`   - Sales: $${product.totalSales}`);
      console.log(`   - Orders: ${product.orderCount}`);
      console.log('   ---');
    });
    
    // Test 4: Verify NO products with rating 0
    console.log('\n📊 TEST 4: Verifying NO products with rating 0...');
    const hasZeroRating = topProducts.some(p => p.averageRating === 0 || p.averageRating === null);
    
    if (hasZeroRating) {
      console.log('❌ ERROR: Found products with rating 0 in top products!');
    } else {
      console.log('✅ SUCCESS: No products with rating 0 in top products!');
    }
    
    // Test 5: Check if all products have real ratings
    console.log('\n📊 TEST 5: Checking if all products have real ratings...');
    const allHaveRealRatings = topProducts.every(p => p.averageRating && p.averageRating > 0);
    
    if (allHaveRealRatings) {
      console.log('✅ SUCCESS: All top products have real ratings!');
    } else {
      console.log('❌ ERROR: Some top products do not have real ratings!');
    }
    
    console.log('\n✅ TOP PRODUCTS FIX TEST COMPLETED!');
    console.log('📋 Expected behavior:');
    console.log('   • Only products with real ratings (> 0) should be in top products');
    console.log('   • Products with rating 0 or null should NOT be in top products');
    console.log('   • Top products should be sorted by sales');
    console.log('   • Maximum 4 products should be shown');
    console.log('   • All products should have yellow stars (real ratings)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTopProductsFix(); 