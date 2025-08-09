/**
 * Dark Mode Implementation Test Script
 * Tests all dark mode functionality on products page
 * Run in browser console: testDarkMode()
 */

window.testDarkMode = function() {
    console.log('🧪 Starting Dark Mode Implementation Tests...');
    
    const tests = [];
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0
    };
    
    // Test 1: Check if theme variables are defined
    function testThemeVariables() {
        const root = getComputedStyle(document.documentElement);
        const darkTheme = document.documentElement.setAttribute('data-theme', 'dark');
        
        const variables = [
            '--color-primary',
            '--bg-primary', 
            '--text-primary',
            '--border-color'
        ];
        
        let passed = true;
        variables.forEach(variable => {
            const value = root.getPropertyValue(variable);
            if (!value) {
                console.error(`❌ Missing CSS variable: ${variable}`);
                passed = false;
            }
        });
        
        return passed;
    }
    
    // Test 2: Check if dashboard-init.js is loaded
    function testDashboardInit() {
        return typeof window.sidebarInitialized !== 'undefined';
    }
    
    // Test 3: Check if theme toggle works
    function testThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return false;
        
        const initialTheme = document.documentElement.getAttribute('data-theme');
        
        // Simulate click
        toggle.click();
        
        const newTheme = document.documentElement.getAttribute('data-theme');
        return newTheme !== initialTheme;
    }
    
    // Test 4: Check if localStorage works
    function testLocalStorage() {
        try {
            localStorage.setItem('test-theme', 'dark');
            const value = localStorage.getItem('test-theme');
            localStorage.removeItem('test-theme');
            return value === 'dark';
        } catch (e) {
            return false;
        }
    }
    
    // Test 5: Check if products components exist
    function testProductsComponents() {
        const components = [
            '.products-header',
            '.products-stats-grid', 
            '.products-filters-container',
            '.products-main-container'
        ];
        
        let passed = true;
        components.forEach(selector => {
            if (!document.querySelector(selector)) {
                console.warn(`⚠️ Component not found: ${selector}`);
                passed = false;
            }
        });
        
        return passed;
    }
    
    // Run all tests
    const testSuite = [
        { name: 'Theme Variables', test: testThemeVariables },
        { name: 'Dashboard Init', test: testDashboardInit },
        { name: 'Theme Toggle', test: testThemeToggle },
        { name: 'LocalStorage', test: testLocalStorage },
        { name: 'Products Components', test: testProductsComponents }
    ];
    
    console.log('\n📋 Running Test Suite:');
    console.log('═'.repeat(50));
    
    testSuite.forEach(({ name, test }) => {
        try {
            const result = test();
            if (result) {
                console.log(`✅ ${name}: PASSED`);
                results.passed++;
            } else {
                console.log(`❌ ${name}: FAILED`);
                results.failed++;
            }
        } catch (error) {
            console.log(`⚠️ ${name}: ERROR - ${error.message}`);
            results.warnings++;
        }
    });
    
    // Results summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️ Warnings: ${results.warnings}`);
    
    const total = results.passed + results.failed + results.warnings;
    const successRate = Math.round((results.passed / total) * 100);
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (successRate >= 80) {
        console.log('🎉 Dark Mode Implementation: EXCELLENT');
    } else if (successRate >= 60) {
        console.log('👍 Dark Mode Implementation: GOOD');
    } else {
        console.log('⚠️ Dark Mode Implementation: NEEDS IMPROVEMENT');
    }
    
    return results;
};

// Auto-run if in development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    console.log('🔧 Development mode detected. Dark mode test available via: testDarkMode()');
}