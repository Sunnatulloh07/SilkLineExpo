/**
 * Distributor Dashboard Routes
 * Professional distributor-specific routes with comprehensive business features
 * Role-based access with inventory, supplier, and sales management
 */

const express = require('express');
const { authenticate, distributorOnly } = require('../middleware/jwtAuth');
const { 
    distributorOnly: enhancedDistributorOnly, 
    preventCrossDashboardAccess,
    validateDistributorApiAccess,
    setSecurityHeaders 
} = require('../middleware/dashboardSecurity');

const router = express.Router();

// Enhanced security middleware for distributor dashboard
router.use(setSecurityHeaders);
router.use(enhancedDistributorOnly);
router.use(preventCrossDashboardAccess);

// Apply JWT authentication and distributor-only access (backward compatibility)
router.use(authenticate);
router.use(distributorOnly);

// ===== DASHBOARD VIEW ROUTES =====
router.get('/dashboard', (req, res) => {
    res.render('distributor/dashboard/index', {
        title: 'Distributor Dashboard - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

router.get('/inventory', (req, res) => {
    res.render('distributor/inventory/index', {
        title: 'Inventory Management - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

router.get('/suppliers', (req, res) => {
    res.render('distributor/suppliers/index', {
        title: 'Supplier Network - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

router.get('/sales', (req, res) => {
    res.render('distributor/sales/index', {
        title: 'Sales Management - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

router.get('/orders', (req, res) => {
    res.render('distributor/orders/index', {
        title: 'Order Management - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

router.get('/analytics', (req, res) => {
    res.render('distributor/analytics/index', {
        title: 'Distribution Analytics - SLEX',
        user: req.user,
        layout: 'distributor/layout'
    });
});

// ===== API ROUTES =====
router.get('/api/dashboard-stats', (req, res) => {
    // Mock data for distributor dashboard
    res.json({
        success: true,
        data: {
            totalInventory: 1247,
            activeSuppliers: 23,
            monthlyOrders: 89,
            revenueThisMonth: 125000,
            inventoryValue: 890000,
            pendingOrders: 12,
            deliveredOrders: 77,
            lowStockItems: 5
        }
    });
});

router.get('/api/inventory-overview', (req, res) => {
    res.json({
        success: true,
        data: {
            categories: [
                { name: 'Electronics', count: 245, value: 350000 },
                { name: 'Textiles', count: 189, value: 280000 },
                { name: 'Food & Beverages', count: 312, value: 160000 },
                { name: 'Chemicals', count: 98, value: 100000 }
            ],
            lowStock: [
                { name: 'Samsung Galaxy S23', current: 3, minimum: 10 },
                { name: 'Cotton Fabric Rolls', current: 5, minimum: 15 },
                { name: 'Organic Tea Leaves', current: 8, minimum: 20 }
            ]
        }
    });
});

router.get('/api/supplier-performance', (req, res) => {
    res.json({
        success: true,
        data: [
            { 
                name: 'TechCorp Industries',
                rating: 4.8,
                onTimeDelivery: 95,
                totalOrders: 45,
                category: 'Electronics'
            },
            { 
                name: 'Silk Road Textiles',
                rating: 4.6,
                onTimeDelivery: 92,
                totalOrders: 32,
                category: 'Textiles'
            },
            { 
                name: 'Fresh Foods Ltd',
                rating: 4.4,
                onTimeDelivery: 88,
                totalOrders: 28,
                category: 'Food'
            }
        ]
    });
});

router.get('/api/sales-analytics', (req, res) => {
    res.json({
        success: true,
        data: {
            monthlySales: [120000, 135000, 125000, 145000, 155000, 125000],
            topProducts: [
                { name: 'Electronics Bundle', sales: 25000, units: 120 },
                { name: 'Textile Package', sales: 18000, units: 85 },
                { name: 'Food Supplies', sales: 15000, units: 200 }
            ],
            salesChannels: [
                { channel: 'Online Store', percentage: 45, revenue: 56250 },
                { channel: 'Retail Partners', percentage: 35, revenue: 43750 },
                { channel: 'Direct Sales', percentage: 20, revenue: 25000 }
            ]
        }
    });
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('❌ Distributor route error:', error);
    
    const isAjax = req.get('Content-Type') === 'application/json' ||
                   req.get('X-Requested-With') === 'XMLHttpRequest';
    
    if (isAjax) {
        return res.status(500).json({
            success: false,
            message: 'Distributor service error',
            code: 'SERVICE_ERROR'
        });
    } else {
        return res.status(500).render('error', {
            title: 'Distributor Dashboard Error',
            message: 'Unable to load distributor dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;