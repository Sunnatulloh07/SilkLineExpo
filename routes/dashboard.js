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
        
        
        // Log routing for security monitoring
       

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
    
    if (req.user) {
        const correctDashboard = determineUserDashboard(req.user);
        return res.redirect(correctDashboard);
    } else {
        return res.redirect('/auth/login');
    }
});

module.exports = router;