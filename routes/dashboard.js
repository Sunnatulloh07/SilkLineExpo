/**
 * Universal Dashboard Router
 * Professional routing for all dashboard types
 * Handles /dashboard requests and routes to appropriate dashboard
 */

const express = require('express');
const { determineUserDashboard } = require('../middleware/dashboardRouting');

const router = express.Router();

/**
 * GET /dashboard - Universal dashboard route
 * Automatically routes users to their appropriate dashboard
 */
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/auth/login?error=auth_required&message=Please login to access dashboard');
        }

        const correctDashboard = determineUserDashboard(req.user);
        
        console.log(`🧭 Universal Dashboard Route: ${req.user.email} -> ${correctDashboard}`);
        
        // Log routing for security monitoring
        console.log(`🔍 Dashboard Routing Debug:`, {
            userId: req.user.userId,
            userType: req.user.userType,
            role: req.user.role,
            companyType: req.user.companyType,
            targetDashboard: correctDashboard
        });

        return res.redirect(correctDashboard);

    } catch (error) {
        console.error('❌ Universal Dashboard Router error:', error);
        return res.redirect('/auth/login?error=routing_error&message=Dashboard routing failed');
    }
});

/**
 * Fallback route for unmatched dashboard paths
 */
router.get('*', (req, res) => {
    console.log(`⚠️ Dashboard 404: ${req.path} requested by ${req.user?.email || 'anonymous'}`);
    
    if (req.user) {
        const correctDashboard = determineUserDashboard(req.user);
        return res.redirect(correctDashboard);
    } else {
        return res.redirect('/auth/login');
    }
});

module.exports = router;