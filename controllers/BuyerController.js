/**
 * Buyer Profile Controller
 * Alibaba-style buyer profile for purchasing and supplier interaction
 * Simple profile system for individual buyers without complex dashboard
 */

const BuyerService = require('../services/BuyerService');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

class BuyerController {
    constructor() {
        this.logger = console;
        this.buyerService = new BuyerService();
    }

    /**
     * Get language preference from request
     */
    getLanguagePreference(req) {
        return req.lng || req.query.lng || req.body.lng || 'uz';
    }

    // ===============================================
    // VIEW RENDERING METHODS  
    // ===============================================

    /**
     * Render buyer profile page
     */
    async showProfile(req, res) {
        try {
            const buyerId = req.user.userId;


            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }

            // Get all profile data in parallel
            const [profileStats, cartItems, unreadMessagesCount, recentActivity] = await Promise.all([
                this.buyerService.getProfileStats(buyerId),
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId),
                this.buyerService.getRecentActivity(buyerId)
            ]);

            res.render('buyer/profile', {
                title: 'My Profile - SLEX',
                currentPage: 'profile',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                profileStats: profileStats,
                cartItemsCount: cartItems ? cartItems.length : 0,
                unreadMessages: unreadMessagesCount || 0,
                activeOrdersCount: profileStats?.activeOrders || 0,
                unreadMessagesCount: unreadMessagesCount || 0,
                recentActivity: recentActivity || []
            });

        } catch (error) {
            this.logger.error('❌ Buyer profile error:', error);
            this.renderErrorPage(res, req, error, 'Failed to load profile page');
        }
    }

    /**
     * Render error page helper
     */
    renderErrorPage(res, req, error, message) {
        const lng = this.getLanguagePreference(req);

        res.status(500).render('buyer/profile', {
            title: 'My Profile - SLEX',
                currentPage: 'profile',
            user: req.user || {},
            currentUser: req.user || {},
            currentUserRole: req.user?.companyType || 'distributor',
            lng: lng,
                profileStats: {
                    totalOrders: 0,
                    activeOrders: 0,
                totalSpent: 0,
                favoriteProducts: 0
            },
            cartItemsCount: 0,
            unreadMessages: 0,
            activeOrdersCount: 0,
            unreadMessagesCount: 0,
            recentActivity: [],
            errorMessage: message || 'An error occurred.'
        });
    }

    /**
     * Render settings error page helper
     */
    renderSettingsErrorPage(res, req, error, message) {
        const lng = this.getLanguagePreference(req);

        res.status(500).render('buyer/settings', {
            title: 'Settings - SLEX',
            currentPage: 'settings',
            user: req.user || {},
            currentUser: req.user || {},
            currentUserRole: req.user?.companyType || 'distributor',
            lng: lng,
            success: [],
            error: [message || 'An error occurred.'],
            cartItemsCount: 0,
            activeOrdersCount: 0,
            unreadMessagesCount: 0
        });
    }

    /**
     * Render orders management page
     */
    async showOrders(req, res) {
        try {
            const buyerId = req.user.userId;
            
            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }
            
            // Get sidebar data
            const [cartItems, unreadMessagesCount, profileStats] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId),
                this.buyerService.getProfileStats(buyerId)
            ]);

            res.render('buyer/orders', {
                title: 'My Orders - SLEX',
                currentPage: 'orders',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: profileStats?.activeOrders || 0,
                unreadMessagesCount: unreadMessagesCount || 0
            });

        } catch (error) {
            this.logger.error('❌ Orders page error:', error);
            return this.renderErrorPage(res, req, {
                statusCode: 500,
                title: 'Orders Page Error',
                message: 'Unable to load orders page. Please try again later.',
                error: error
            });
        }
    }

    /**
     * Render error page with all required variables
     */
    renderErrorPage(res, req, { statusCode = 500, title = 'Server Error', message = 'An unexpected error occurred', user = null, error = null } = {}) {
        const lng = this.getLanguagePreference(req);

        // Log error details for debugging
        if (error) {
            this.logger.error(`❌ Error ${statusCode}:`, {
                url: req.originalUrl,
                method: req.method,
                userId: req.user?.userId,
                error: error.message,
                stack: error.stack
            });
        }

        const templateData = {
            title: title,
            message: message,
            statusCode: statusCode, // Add statusCode for dynamic error display
            user: user || req.user || null,
            currentUser: user || req.user || null,
            currentUserRole: (user || req.user)?.companyType || 'distributor',
            admin: null, // This is required by error.ejs header
                lng: lng,
            error: error, // Pass error object for development mode
            req: req // Pass request object for debugging info
        };

        res.status(statusCode).render('pages/error', templateData);
    }

    /**
     * Render buyer order details page - Production Ready Implementation
     */
    async showOrderDetails(req, res) {
        const startTime = Date.now();
        let user = null;
        
        try {
            // 1. Validate request parameters
            const buyerId = req.user?.userId;
            const { orderId } = req.params;

            this.logger.info('🔍 Order details request:', {
                buyerId,
                orderId,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });

            // 2. Validate buyer ID
            if (!buyerId) {
                this.logger.warn('⚠️ No buyer ID in request');
                return this.renderErrorPage(res, req, {
                    statusCode: 401,
                    title: 'Authentication Required',
                    message: 'Please log in to view order details.'
                });
            }

            // 3. Validate order ID format
            if (!orderId) {
                this.logger.warn('⚠️ No order ID provided');
                return this.renderErrorPage(res, req, {
                    statusCode: 400,
                    title: 'Missing Order ID',
                    message: 'Order ID is required to view order details.'
                });
            }

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                this.logger.warn('⚠️ Invalid order ID format:', orderId);
                return this.renderErrorPage(res, req, {
                    statusCode: 400,
                    title: 'Invalid Order ID',
                    message: 'The provided order ID format is invalid.'
                });
            }

            // 4. Get user data with error handling
            try {
                const User = require('../models/User');
                user = await User.findById(buyerId).select('-password').lean();
                
                if (!user) {
                    this.logger.error('❌ User not found for buyerId:', buyerId);
                    return this.renderErrorPage(res, req, {
                        statusCode: 404,
                        title: 'User Not Found',
                        message: 'Your account could not be found. Please contact support.'
                    });
                }

                this.logger.info('✅ User retrieved:', {
                    userId: user._id,
                    companyName: user.companyName,
                    companyType: user.companyType
                });

            } catch (userError) {
                this.logger.error('❌ Database error fetching user:', userError);
                return this.renderErrorPage(res, req, {
                    statusCode: 500,
                    title: 'Database Error',
                    message: 'Unable to retrieve user information. Please try again.',
                    error: userError
                });
            }

            // 5. Get order details with comprehensive error handling
            let orderDetails;
            try {
                this.logger.info('📦 Fetching order details from service...');
                orderDetails = await this.buyerService.getOrderDetails(buyerId, orderId);
                
                this.logger.info('📦 Order details service response:', {
                    success: orderDetails.success,
                    hasOrder: !!orderDetails.order,
                    orderNumber: orderDetails.order?.orderNumber
                });

            } catch (serviceError) {
                this.logger.error('❌ Service error getting order details:', serviceError);
                return this.renderErrorPage(res, req, {
                    statusCode: 500,
                    title: 'Service Error',
                    message: 'Unable to retrieve order information. Please try again later.',
                    user: user,
                    error: serviceError
                });
            }

            // 6. Validate order details response
            if (!orderDetails || !orderDetails.success) {
                const errorMessage = orderDetails?.error?.message || 'Order not found or access denied.';
                this.logger.warn('⚠️ Order not found or access denied:', {
                    orderId,
                    buyerId,
                    errorMessage
                });

                return this.renderErrorPage(res, req, {
                    statusCode: 404,
                    title: 'Order Not Found',
                    message: errorMessage,
                    user: user
                });
            }

            // 7. Validate order data integrity
            if (!orderDetails.order) {
                this.logger.error('❌ Invalid service response - missing order data');
                return this.renderErrorPage(res, req, {
                    statusCode: 500,
                    title: 'Invalid Response',
                    message: 'Invalid order data received. Please contact support.',
                    user: user
                });
            }

            // 8. Prepare template data with complete validation
            const templateData = {
                title: `Order ${orderDetails.order.orderNumber || 'Unknown'} - SLEX`,
                currentPage: 'orders',
                user: user,
                currentUser: user,
                currentUserRole: user?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                order: orderDetails.order,
                // Additional data for enhanced functionality
                cartItemsCount: 0, // This should be fetched if needed
                activeOrdersCount: 0, // This should be fetched if needed  
                unreadMessagesCount: 0, // This should be fetched if needed
                statusCode: 200, // Success status
                admin: null // Required for header partials
            };

            // 9. Log successful render
            const duration = Date.now() - startTime;
            this.logger.info('✅ Order details page rendered successfully:', {
                orderId: orderDetails.order._id,
                orderNumber: orderDetails.order.orderNumber,
                buyerId,
                duration: `${duration}ms`
            });

            // 10. Render the page with error handling
            try {
                res.render('buyer/order-details', templateData);
            } catch (renderError) {
                this.logger.error('❌ Template rendering failed:', renderError);
                return this.renderErrorPage(res, req, {
                    statusCode: 500,
                    title: 'Template Error',
                    message: 'Failed to render order details page. Please refresh and try again.',
                    user: user,
                    error: renderError
                });
            }

        } catch (error) {
            // 11. Handle unexpected errors
            const duration = Date.now() - startTime;
            this.logger.error('❌ Unexpected error in showOrderDetails:', {
                error: error.message,
                stack: error.stack,
                buyerId: req.user?.userId,
                orderId: req.params?.orderId,
                duration: `${duration}ms`
            });

            // Return error page with proper variables
            return this.renderErrorPage(res, req, {
                statusCode: 500,
                title: 'Server Error',
                message: 'An unexpected error occurred while loading the order details. Please try again later.',
                user: user,
                error: error
            });
        }
    }

    /**
     * Render messages page with manufacturer parameter support
     */
    async showMessages(req, res) {
        try {
            const buyerId = req.user.userId;
            const manufacturerId = req.query.manufacturer; // Get manufacturer ID from URL parameter
            
            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }
            
            // Get sidebar data
            const [cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            // Validate manufacturer ID if provided
            let manufacturerDetails = null;
            if (manufacturerId) {
                try {
                    manufacturerDetails = await this.buyerService.getManufacturerDetails(manufacturerId);
                } catch (manufacturerError) {
                    this.logger.warn(`Invalid manufacturer ID: ${manufacturerId}`, manufacturerError);
                    // Continue rendering page but without manufacturer details
                }
            }

            const renderData = {
                title: manufacturerDetails ? 
                    `${manufacturerDetails.companyName} - Messages - SLEX` : 
                    'Messages - SLEX',
                currentPage: 'messages',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: 0, // Will be fetched dynamically
                unreadMessagesCount: unreadMessagesCount || 0,
                manufacturerId: manufacturerId || null,
                manufacturerDetails: manufacturerDetails || null
            };

            res.render('buyer/messages', renderData);

        } catch (error) {
            this.logger.error('❌ Messages page error:', error);
            const lng = req.session?.language || 
                        req.cookies?.selectedLanguage || 
                        req.cookies?.i18next ||
                        req.query?.lng || 
                        'uz';
            
            res.status(500).render('pages/error', {
                title: 'Messages Page Error - Silk Line Expo',
                message: 'Failed to load messages page',
                error: process.env.NODE_ENV === 'development' ? error : {},
                user: req.user || null,
                admin: req.user || null,
                lng: lng,
                currentLang: lng
            });
        }
    }

    /**
     * Render inquiries page
     */
    async showInquiries(req, res) {
        try {
            const buyerId = req.user.userId;
            
            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }
            
            res.render('buyer/inquiries', {
                title: 'Product Inquiries - SLEX',
                currentPage: 'inquiries',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                lng: this.getLanguagePreference(req)
            });

        } catch (error) {
            this.logger.error('❌ Inquiries page error:', error);
            const lng = req.session?.language || 
                        req.cookies?.selectedLanguage || 
                        req.cookies?.i18next ||
                        req.query?.lng || 
                        'uz';
            
            res.status(500).render('pages/error', {
                title: 'Inquiries Page Error - Silk Line Expo',
                message: 'Failed to load inquiries page',
                error: process.env.NODE_ENV === 'development' ? error : {},
                user: req.user || null,
                admin: req.user || null,
                lng: lng,
                currentLang: lng
            });
        }
    }

    /**
     * Render settings page
     */
    async showSettings(req, res) {
        try {
            const buyerId = req.user.userId;
            
            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }
            
            // Fetch sidebar data in parallel (similar to showProfile)
            const [
                cartItems,
                profileStats,
                unreadMessagesCount
            ] = await Promise.all([
                this.buyerService.getCartItems(buyerId).catch(() => []),
                this.buyerService.getProfileStats(buyerId).catch(() => ({ activeOrders: 0 })),
                this.buyerService.getUnreadMessagesCount(buyerId).catch(() => 0)
            ]);

            const cartItemsCount = cartItems.length || 0;
            const activeOrdersCount = profileStats.activeOrders || 0;

            res.render('buyer/settings', {
                title: 'Settings - SLEX',
                currentPage: 'settings',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                success: req.flash('success') || [],
                error: req.flash('error') || [],
                // Sidebar data
                cartItemsCount,
                activeOrdersCount,
                unreadMessagesCount
            });

        } catch (error) {
            this.logger.error('❌ Settings page error:', error);
            this.renderSettingsErrorPage(res, req, error, 'Failed to load settings page');
        }
    }

    // ===============================================
    // SETTINGS API METHODS
    // ===============================================

    /**
     * Update profile information
     */
    async updateProfile(req, res) {
        try {
            const buyerId = req.user.userId;
            const updateData = {
                companyName: req.body.companyName,
                contactPerson: req.body.contactPerson,
                email: req.body.email,
                phone: req.body.phone,
                country: req.body.country,
                address: req.body.address
            };

            // Update user in database
            const updatedUser = await this.buyerService.updateProfile(buyerId, updateData);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    user: updatedUser
                });
            }

            req.flash('success', 'Profile updated successfully');
            res.redirect('/buyer/settings#profile');

        } catch (error) {
            this.logger.error('❌ Profile update error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update profile'
                });
            }

            req.flash('error', error.message || 'Failed to update profile');
            res.redirect('/buyer/settings#profile');
        }
    }

    /**
     * Update buyer avatar/profile picture
     */
    async updateAvatar(req, res) {
        try {
            const buyerId = req.user.userId;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasm fayli yuklanmadi'
                });
            }



            // Process and save company logo
            const logoUrl = await this.buyerService.updateCompanyLogo(buyerId, file);

            res.json({
                success: true,
                data: { 
                    avatarUrl: logoUrl,
                    message: 'Avatar muvaffaqiyatli yangilandi'
                },
                message: 'Avatar muvaffaqiyatli yangilandi'
            });

        } catch (error) {
            this.logger.error('❌ Avatar update error:', error);
            
            // Clean up uploaded file on error
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    this.logger.error('Failed to clean up file:', unlinkError);
                }
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Avatar yangilashda xatolik'
            });
        }
    }

    /**
     * Delete buyer avatar
     */
    async deleteAvatar(req, res) {
        try {
            const buyerId = req.user.userId;



            await this.buyerService.deleteCompanyLogo(buyerId);

            res.json({
                success: true,
                message: 'Avatar muvaffaqiyatli o\'chirildi'
            });

        } catch (error) {
            this.logger.error('❌ Avatar delete error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Avatar o\'chirishda xatolik'
            });
        }
    }

    /**
     * Update notifications settings
     */
    async updateNotifications(req, res) {
        try {
            const buyerId = req.user.userId;
            const notificationSettings = {
                emailNotifications: req.body.emailNotifications === 'on',
                orderUpdates: req.body.orderUpdates === 'on',
                marketingEmails: req.body.marketingEmails === 'on',
                priceAlerts: req.body.priceAlerts === 'on',
                weeklyDigest: req.body.weeklyDigest === 'on'
            };

            // this.logger.log(`🔔 Updating notifications for buyer: ${buyerId}`);

            // Update notifications in database
            const updatedUser = await this.buyerService.updateNotifications(buyerId, notificationSettings);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: 'Notification settings updated successfully',
                    user: updatedUser
                });
            }

            req.flash('success', 'Notification settings updated successfully');
            res.redirect('/buyer/settings#notifications');

        } catch (error) {
            this.logger.error('❌ Notifications update error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update notifications'
                });
            }

            req.flash('error', error.message || 'Failed to update notifications');
            res.redirect('/buyer/settings#notifications');
        }
    }

    /**
     * Update preferences settings
     */
    async updatePreferences(req, res) {
        try {
            const buyerId = req.user.userId;
            const preferences = {
                language: req.body.language || 'uz',
                theme: req.body.theme || 'light',
                currency: req.body.currency || 'USD',
                timezone: req.body.timezone || 'Asia/Tashkent',
                compactView: req.body.compactView === 'on',
                itemsPerPage: parseInt(req.body.itemsPerPage) || 20
            };

            this.logger.log(`⚙️ Updating preferences for buyer: ${buyerId}`);

            // Update preferences in database
            const updatedUser = await this.buyerService.updatePreferences(buyerId, preferences);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: 'Preferences updated successfully',
                    user: updatedUser
                });
            }

            req.flash('success', 'Preferences updated successfully');
            res.redirect('/buyer/settings#preferences');

        } catch (error) {
            this.logger.error('❌ Preferences update error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update preferences'
                });
            }

            req.flash('error', error.message || 'Failed to update preferences');
            res.redirect('/buyer/settings#preferences');
        }
    }

    /**
     * Update password
     */
    async updatePassword(req, res) {
        try {
            const buyerId = req.user.userId;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validate passwords
            if (newPassword !== confirmPassword) {
                throw new Error('Yangi parollar mos kelmaydi');
            }

            if (newPassword.length < 6) {
                throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
            }

            this.logger.log(`🔒 Password update request from buyer: ${buyerId}`);

            // Update password using service
            const result = await this.buyerService.updatePassword(buyerId, currentPassword, newPassword);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: result.message || 'Parol muvaffaqiyatli yangilandi'
                });
            }

            req.flash('success', result.message || 'Parol muvaffaqiyatli yangilandi');
            res.redirect('/buyer/settings#security');

        } catch (error) {
            this.logger.error('❌ Password update error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Parol yangilashda xatolik'
                });
            }

            req.flash('error', error.message || 'Parol yangilashda xatolik');
            res.redirect('/buyer/settings#security');
        }
    }

    /**
     * Update notification preferences
     */
    async updateNotifications(req, res) {
        try {
            const buyerId = req.user.userId;
            const notificationSettings = {
                emailNotifications: req.body.emailNotifications === 'on',
                marketingEmails: req.body.marketingEmails === 'on'
            };

            // Update notifications in database
            await this.buyerService.updateNotifications(buyerId, notificationSettings);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({
                    success: true,
                    message: 'Notification preferences updated successfully'
                });
            }

            req.flash('success', 'Notification preferences updated successfully');
            res.redirect('/buyer/settings#notifications');

        } catch (error) {
            this.logger.error('❌ Notifications update error:', error);

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update notification preferences'
                });
            }

            req.flash('error', error.message || 'Failed to update notification preferences');
            res.redirect('/buyer/settings#notifications');
        }
    }

    /**
     * Render cart page (Alibaba-style)
     */
    async showCart(req, res) {
        try {
            const buyerId = req.user.userId;

            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }

            // Get cart and sidebar data with full population
            const [cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            // getCartItems() returns array directly, not an object with items property

            res.render('buyer/cart', {
                title: 'Shopping Cart - SLEX',
                currentPage: 'cart',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                cartItems: cartItems,
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: 0, // Will be fetched dynamically
                unreadMessagesCount: unreadMessagesCount || 0
            });

        } catch (error) {
            this.logger.error('❌ Cart page error:', error);
            this.renderErrorPage(res, req, error, 'Failed to load cart');
        }
    }

    /**
     * Render favorites page  
     */
    async showFavorites(req, res) {
        try {
            const buyerId = req.user.userId;

            // Get fresh user data from database (includes latest companyLogo)
            const User = require('../models/User');
            const freshUser = await User.findById(buyerId).select('-password');
            
            if (!freshUser) {
                throw new Error('User not found');
            }

            // Get favorites and sidebar data
            const [favorites, cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getFavoriteProducts(buyerId),
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            res.render('buyer/favorites', {
                title: 'My Favorites - SLEX',
                currentPage: 'favorites',
                user: freshUser,  // Fresh data with latest companyLogo
                currentUser: freshUser,  // Fresh data for navigation
                currentUserRole: freshUser?.companyType || 'distributor',
                favorites: favorites,
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: 0, // Will be fetched dynamically
                unreadMessagesCount: unreadMessagesCount || 0
            });

        } catch (error) {
            this.logger.error('❌ Favorites page error:', error);
            this.renderErrorPage(res, req, error, 'Failed to load favorites');
        }
    }

    // ===============================================
    // API METHODS
    // ===============================================

    /**
     * API: Get buyer profile statistics
     */
    async getProfileStats(req, res) {
        try {
            const buyerId = req.user.userId;
            const stats = await this.buyerService.getProfileStats(buyerId);
            
            this.sendSuccess(res, stats, 'Profile statistics retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get profile statistics');
        }
    }

    /**
     * API: Get buyer orders with pagination and filters
     */
    async getBuyerOrders(req, res) {
        try {
            const buyerId = req.user.userId;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                status: req.query.status,
                supplier: req.query.supplier,
                search: req.query.search,
                dateFilter: req.query.date
            };
            
            const result = await this.buyerService.getBuyerOrders(buyerId, options);
            
            // Check if the service returned an error response
            if (!result.success) {
                return res.status(500).json(result);
            }
            
            // Return the successful result directly (it already has the proper structure)
            res.json(result);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get orders');
        }
    }

    /**
     * API: Get buyer RFQs
     */
    async getBuyerRFQs(req, res) {
        try {
            const buyerId = req.user.userId;
            // Use the buyer service to get real RFQ data
            const rfqs = await this.buyerService.getBuyerRFQs(buyerId);
            
            this.sendSuccess(res, rfqs, 'RFQs retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get RFQs');
        }
    }

    /**
     * API: Send message to supplier - Professional Implementation with Enhanced Validation
     */
    async sendMessage(req, res) {
        try {
            const buyerId = req.user.userId;
            
            
            const { orderId, message } = req.body;
            const uploadedFiles = req.files || [];
            
            // Enhanced input validation
            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    }
                });
            }

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Order ID kerak',
                        code: 'VALIDATION_ERROR',
                        details: {
                            orderId: 'Order ID is required'
                        }
                    }
                });
            }

            // Allow sending if either message OR files exist
            if (!message?.trim() && uploadedFiles.length === 0) {
                
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Xabar yoki fayl kerak',
                        code: 'VALIDATION_ERROR',
                        details: {
                            content: 'Xabar yoki fayl kerak'
                        }
                    }
                });
            }

            // Validate message length if provided
            if (message && message.trim().length > 10000) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Message content is too long (max 10,000 characters)',
                        code: 'MESSAGE_TOO_LONG'
                    }
                });
            }
            
            // Process uploaded files
            let processedAttachments = [];
            if (uploadedFiles.length > 0) {
                try {
                    processedAttachments = await this.processUploadedFiles(uploadedFiles);
                   } catch (fileError) {
                    console.error('❌ File processing error:', fileError);
                    return res.status(400).json({
                        success: false,
                        error: {
                            message: 'Fayllarni qayta ishlashda xatolik',
                            code: 'FILE_PROCESSING_ERROR'
                        }
                    });
                }
            }
            
            // Send message with or without text content
            const messageContent = message?.trim() || null; // null if no text
            const result = await this.buyerService.sendMessage(buyerId, orderId, messageContent, processedAttachments);
            
            this.sendSuccess(res, result, 'Message sent successfully');

        } catch (error) {
            this.logger.error('❌ Send message error:', error);
            
            // Enhanced error handling
            if (error.message.includes('Order not found')) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Order not found or access denied',
                        code: 'ORDER_NOT_FOUND'
                    }
                });
            }

            if (error.message.includes('access denied')) {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied to this order',
                        code: 'ACCESS_DENIED'
                    }
                });
            }

            this.handleAPIError(res, error, 'Failed to send message');
        }
    }

    /**
     * Process uploaded files for message attachments
     */
    async processUploadedFiles(files) {
        try {
            const processedFiles = [];
            
            for (const file of files) {
                // Generate unique filename
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const fileExtension = path.extname(file.originalname);
                const filename = `message_attachment_${timestamp}_${randomString}${fileExtension}`;
                
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(__dirname, '../public/uploads/messages');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                // Move file to uploads directory
                const destinationPath = path.join(uploadsDir, filename);
                await fs.promises.copyFile(file.path, destinationPath);
                
                // Clean up temp file
                await fs.promises.unlink(file.path);
                
                // Create attachment object
                const attachment = {
                    filename: filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: `/uploads/messages/${filename}`,
                    uploadedAt: new Date()
                };
                
                processedFiles.push(attachment);
                console.log('✅ Created attachment:', attachment);
                }
            
            return processedFiles;
            
        } catch (error) {
            this.logger.error('❌ File processing error:', error);
            throw new Error('Fayllarni qayta ishlashda xatolik');
        }
    }

    /**
     * API: Get buyer conversations with enhanced validation
     */
    async getBuyerConversations(req, res) {
        try {
            const buyerId = req.user.userId;
            
            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    }
                });
            }

            const filters = {
                search: req.query.search ? req.query.search.trim() : '',
                filter: req.query.filter || 'all'
            };

            // Validate filter parameter
            const validFilters = ['all', 'unread', 'active'];
            if (!validFilters.includes(filters.filter)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid filter parameter',
                        code: 'INVALID_FILTER',
                        validFilters
                    }
                });
            }
            
            const conversations = await this.buyerService.getBuyerConversations(buyerId, filters);
            
            this.sendSuccess(res, { 
                conversations,
                count: conversations.length,
                filters
            }, 'Conversations retrieved successfully');

        } catch (error) {
            this.logger.error('❌ Get conversations error:', error);
            this.handleAPIError(res, error, 'Failed to get conversations');
        }
    }

    /**
     * API: Get buyer conversations with current manufacturer at top
     */
    async getBuyerConversationsWithCurrent(req, res) {
        try {
            const buyerId = req.user.userId;
            const currentManufacturerId = req.query.manufacturer || null;
            
            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    }
                });
            }

            const filters = {
                search: req.query.search ? req.query.search.trim() : '',
                filter: req.query.filter || 'all'
            };

            // Validate filter parameter
            const validFilters = ['all', 'unread', 'active'];
            if (!validFilters.includes(filters.filter)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid filter parameter',
                        code: 'INVALID_FILTER',
                        validFilters
                    }
                });
            }
            
            const conversations = await this.buyerService.getBuyerConversationsWithCurrent(buyerId, currentManufacturerId, filters);
            
            this.sendSuccess(res, { 
                conversations,
                count: conversations.length,
                filters,
                currentManufacturerId
            }, 'Conversations with current manufacturer retrieved successfully');

        } catch (error) {
            this.logger.error('❌ Get conversations with current error:', error);
            this.handleAPIError(res, error, 'Failed to get conversations with current manufacturer');
        }
    }

    /**
     * API: Get order messages
     */
    async getOrderMessages(req, res) {
        try {
            const buyerId = req.user.userId;
            const { orderId } = req.params;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 50
            };
            
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Order ID is required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            
            const result = await this.buyerService.getOrderMessages(buyerId, orderId, options);
            
            this.sendSuccess(res, result, 'Messages retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get messages');
        }
    }

    /**
     * API: Get manufacturer details for direct messaging
     */
    async getManufacturerDetails(req, res) {
        try {
            const buyerId = req.user.userId;
            const { manufacturerId } = req.params;
            
            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    }
                });
            }

            if (!manufacturerId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Manufacturer ID is required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            
            const manufacturer = await this.buyerService.getManufacturerDetails(manufacturerId);
            
            this.sendSuccess(res, { manufacturer }, 'Manufacturer details retrieved successfully');

        } catch (error) {
            this.logger.error('❌ Get manufacturer details error:', error);
            
            if (error.message.includes('Manufacturer not found')) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Manufacturer not found',
                        code: 'MANUFACTURER_NOT_FOUND'
                    }
                });
            }

            this.handleAPIError(res, error, 'Failed to get manufacturer details');
        }
    }

    /**
     * API: Get or create conversation with manufacturer
     */
    async getManufacturerConversation(req, res) {
        try {
            const buyerId = req.user.userId;
            const { manufacturerId } = req.params;
            
            if (!buyerId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    }
                });
            }

            if (!manufacturerId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Manufacturer ID is required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }
            
            const conversation = await this.buyerService.getOrCreateManufacturerConversation(buyerId, manufacturerId);
            
            this.sendSuccess(res, conversation, 'Manufacturer conversation retrieved successfully');

        } catch (error) {
            this.logger.error('❌ Get manufacturer conversation error:', error);
            
            if (error.message.includes('Manufacturer not found')) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Manufacturer not found',
                        code: 'MANUFACTURER_NOT_FOUND'
                    }
                });
            }

            this.handleAPIError(res, error, 'Failed to get manufacturer conversation');
        }
    }

    /**
     * API: Create RFQ
     */
    async createRFQ(req, res) {
        try {
            const buyerId = req.user.userId;
            const rfqData = req.body;
            
            const rfq = await this.buyerService.createRFQ(buyerId, rfqData);
            
            this.sendSuccess(res, rfq, 'RFQ created and sent successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to create RFQ');
        }
    }

    /**
     * API: Cancel buyer order
     */
    async cancelOrder(req, res) {
        try {
            const buyerId = req.user.userId;
            const { orderId, reason } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Order ID is required'
                    }
                });
            }

            const result = await this.buyerService.cancelOrder(buyerId, orderId, reason);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to cancel order');
        }
    }

    /**
     * API: Track buyer order
     */
    async trackOrder(req, res) {
        try {
            const buyerId = req.user.userId;
            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Order ID is required'
                }
                });
            }

            const result = await this.buyerService.trackOrder(buyerId, orderId);
            res.json(result);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to track order');
        }
    }

    // ===============================================
    // UTILITY METHODS
    // ===============================================

    /**
     * Send successful API response
     */
    sendSuccess(res, data, message = 'Success') {
        res.json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send error API response
     */
    sendError(res, message, statusCode = 400) {
        res.status(statusCode).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle API errors consistently
     */
    handleAPIError(res, error, message = 'An error occurred') {
        this.logger.error(`❌ API Error: ${message}`, error);
        
        res.status(500).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }

    // ===============================================
    // CART API METHODS
    // ===============================================

    /**
     * Add product to cart
     */
    async addToCart(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId, manufacturerId, quantity, unitPrice, selectedSpecs, notes } = req.body;

            const cart = await Cart.getOrCreateCart(buyerId);
            await cart.addItem({ productId, manufacturerId, quantity, unitPrice, selectedSpecs, notes });

            res.json({ success: true, message: 'Product added to cart' });
        } catch (error) {
            this.logger.error('❌ Error adding to cart:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update cart item
     */
    async updateCartItem(req, res) {
        try {
            const buyerId = req.user.userId;
            const { itemId, quantity } = req.body;

            const cart = await Cart.findOne({ buyerId });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            await cart.updateItem(itemId, quantity);
            res.json({ success: true, message: 'Cart updated successfully' });
        } catch (error) {
            this.logger.error('❌ Error updating cart:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Remove cart item
     */
    async removeFromCart(req, res) {
        try {
            const buyerId = req.user.userId;
            const { itemId } = req.params;

            const cart = await Cart.findOne({ buyerId });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            await cart.removeItem(itemId);
            res.json({ success: true, message: 'Item removed from cart' });
        } catch (error) {
            this.logger.error('❌ Error removing from cart:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ===============================================
    // FAVORITES API METHODS
    // ===============================================

    /**
     * Check if product is in favorites
     */
    async checkFavoriteStatus(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

            const favorite = await this.buyerService.checkFavoriteStatus(buyerId, productId);
            
            res.json({
                success: true,
                isFavorite: !!favorite,
                data: favorite
            });

        } catch (error) {
            this.logger.error('❌ Check favorite status error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check favorite status'
            });
        }
    }

    /**
     * Add product to favorites
     */
    async addToFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId, manufacturerId, notes } = req.body;

            const favorites = await Favorite.getOrCreateFavorites(buyerId);
            const result = await favorites.addProduct(productId, manufacturerId, notes);

            if (result) {
                res.json({ success: true, message: 'Product added to favorites' });
            } else {
                res.json({ success: false, message: 'Product already in favorites' });
            }
        } catch (error) {
            this.logger.error('❌ Error adding to favorites:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Remove product from favorites
     */
    async removeFromFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId } = req.params;

            const favorites = await Favorite.findOne({ buyerId });
            if (!favorites) {
                return res.status(404).json({ success: false, message: 'Favorites not found' });
            }

            const result = await favorites.removeProduct(productId);
            if (result) {
                res.json({ success: true, message: 'Product removed from favorites' });
            } else {
                res.json({ success: false, message: 'Product not found in favorites' });
            }
        } catch (error) {
            this.logger.error('❌ Error removing from favorites:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Add supplier to favorites
     */
    async addSupplierToFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { supplierId, notes, tags } = req.body;

            const favorites = await Favorite.getOrCreateFavorites(buyerId);
            const result = await favorites.addSupplier(supplierId, notes, tags);

            if (result) {
                res.json({ success: true, message: 'Supplier added to favorites' });
            } else {
                res.json({ success: false, message: 'Supplier already in favorites' });
            }
        } catch (error) {
            this.logger.error('❌ Error adding supplier to favorites:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // ===============================================
    // CART API METHODS
    // ===============================================

    /**
     * API: Update cart item quantity
     */
    async updateCartItem(req, res) {
        try {
            const buyerId = req.user.userId;
            const { itemId, quantity } = req.body;

            if (!itemId || !quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid item ID or quantity'
                });
            }

            const result = await this.buyerService.updateCartItem(buyerId, itemId, quantity);

            res.json({
                success: true,
                message: 'Cart item updated successfully',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Update cart item error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart item'
            });
        }
    }

    /**
     * API: Remove item from cart
     */
    async removeCartItem(req, res) {
        try {
            const buyerId = req.user.userId;
            const { itemId } = req.body;

            if (!itemId) {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required'
                });
            }

            await this.buyerService.removeFromCart(buyerId, itemId);

            res.json({
                success: true,
                message: 'Item removed from cart successfully'
            });

        } catch (error) {
            this.logger.error('❌ Remove cart item error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart'
            });
        }
    }

    /**
     * API: Remove multiple items from cart
     */
    async removeMultipleCartItems(req, res) {
        try {
            const buyerId = req.user.userId;
            const { itemIds } = req.body;

            if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Item IDs are required'
                });
            }

            await this.buyerService.removeMultipleFromCart(buyerId, itemIds);

            res.json({
                success: true,
                message: `${itemIds.length} items removed from cart successfully`
            });

        } catch (error) {
            this.logger.error('❌ Remove multiple cart items error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove items from cart'
            });
        }
    }





    /**
     * API: Check product status (cart and favorites)
     */
    async checkProductStatus(req, res) {
        try {
            const { productId } = req.params;
            console.log('🔍 CheckProductStatus API called with:', { productId, user: req.user });

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

            // Check if user is authenticated
            if (!req.user) {
                console.log('❌ No user in request');
                return res.json({
                    success: true,
                    data: {
                        isInCart: false,
                        cartQuantity: 0,
                        isFavorite: false
                    }
                });
            }

            // Handle different user object structures
            let buyerId = null;
            if (req.user.userId) {
                buyerId = req.user.userId;
            } else if (req.user.id) {
                buyerId = req.user.id;
            } else if (req.user._id) {
                buyerId = req.user._id;
            }

            console.log('🆔 Extracted buyerId:', buyerId);

            if (!buyerId) {
                console.log('❌ No buyerId found in user object');
                return res.json({
                    success: true,
                    data: {
                        isInCart: false,
                        cartQuantity: 0,
                        isFavorite: false
                    }
                });
            }

            console.log('📞 Calling buyerService.checkProductStatus with:', { buyerId, productId });
            const result = await this.buyerService.checkProductStatus(buyerId, productId);
            console.log('📊 Service result:', result);

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Check product status error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check product status'
            });
        }
    }

    // ===============================================
    // FAVORITES API METHODS
    // ===============================================

    /**
     * API: Get buyer favorites
     */
    async getFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            
            // Get favorites data
            const favorites = await this.buyerService.getFavoriteProducts(buyerId);
            const suppliers = await this.buyerService.getFavoriteSuppliers(buyerId);
            
            this.sendSuccess(res, {
                products: favorites,
                suppliers: suppliers
            }, 'Favorites retrieved successfully');
            
        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get favorites');
        }
    }

    /**
     * API: Add product to favorites
     */
    async addToFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId, notes } = req.body;
            
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }
            
            const result = await this.buyerService.addToFavorites(buyerId, productId, notes);
            
            if (result.success) {
                this.sendSuccess(res, result, result.message || 'Added to favorites successfully');
            } else {
                this.sendError(res, result.message || 'Failed to add to favorites', 400);
            }
            
        } catch (error) {
            this.logger.error('❌ Add to favorites error:', error);
            this.sendError(res, error.message || 'Failed to add to favorites', 500);
        }
    }

    /**
     * API: Remove product from favorites
     */
    async removeFromFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId } = req.body;
            
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }
            
            const result = await this.buyerService.removeFromFavorites(buyerId, productId);
            
            if (result.success) {
                this.sendSuccess(res, result, result.message || 'Removed from favorites successfully');
            } else {
                this.sendError(res, result.message || 'Failed to remove from favorites', 400);
            }
            
        } catch (error) {
            this.logger.error('❌ Remove from favorites error:', error);
            this.sendError(res, error.message || 'Failed to remove from favorites', 500);
        }
    }

    /**
     * API: Add supplier to favorites
     */
    async addSupplierToFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { supplierId, notes, tags } = req.body;
            
            if (!supplierId) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier ID is required'
                });
            }
            
            const result = await this.buyerService.addFavoriteSupplier(buyerId, supplierId, notes, tags);
            
            if (result.success) {
                this.sendSuccess(res, result, result.message || 'Supplier added to favorites successfully');
            } else {
                this.sendError(res, result.message || 'Failed to add supplier to favorites', 400);
            }
            
        } catch (error) {
            this.logger.error('❌ Add supplier to favorites error:', error);
            this.sendError(res, error.message || 'Failed to add supplier to favorites', 500);
        }
    }

    /**
     * API: Remove supplier from favorites
     */
    async removeSupplierFromFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { supplierId } = req.body;
            
            if (!supplierId) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier ID is required'
                });
            }
            
            const result = await this.buyerService.removeFavoriteSupplier(buyerId, supplierId);
            
            if (result.success) {
                this.sendSuccess(res, result, result.message || 'Supplier removed from favorites successfully');
            } else {
                this.sendError(res, result.message || 'Failed to remove supplier from favorites', 400);
            }
            
        } catch (error) {
            this.logger.error('❌ Remove supplier from favorites error:', error);
            this.sendError(res, error.message || 'Failed to remove supplier from favorites', 500);
        }
    }

    // ===============================================
    // CHECKOUT AND ORDER API METHODS
    // ===============================================

    /**
     * API: Process checkout and create order
     */
    /**
     * Sanitize input string to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Basic XSS prevention
        return input
            .replace(/[<>"'&]/g, function(match) {
                const entityMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                    '&': '&amp;'
                };
                return entityMap[match];
            })
            .trim()
            .substring(0, 1000); // Limit length
    }

    /**
     * Validate checkout input parameters
     */
    validateCheckoutInput(data) {
        const errors = [];
        
        // Validate selectedItemIds
        if (!data.selectedItemIds || !Array.isArray(data.selectedItemIds)) {
            errors.push('selectedItemIds must be an array');
        } else if (data.selectedItemIds.length === 0) {
            errors.push('At least one item must be selected');
        } else if (data.selectedItemIds.length > 50) {
            errors.push('Too many items selected (max 50)');
        }
        
        // Validate deliveryMethod
        const validDeliveryMethods = ['delivery', 'pickup'];
        if (!data.deliveryMethod || !validDeliveryMethods.includes(data.deliveryMethod)) {
            errors.push('Invalid delivery method');
        }
        
        // Validate paymentMethod
        const validPaymentMethods = ['bank_transfer', 'cash_on_delivery', 'cash_on_pickup'];
        if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
            errors.push('Invalid payment method');
        }
        
        // Validate deliveryService if delivery method is 'delivery'
        if (data.deliveryMethod === 'delivery') {
            const validDeliveryServices = ['standard', 'express', 'economy'];
            if (data.deliveryService && !validDeliveryServices.includes(data.deliveryService)) {
                errors.push('Invalid delivery service');
            }
        }
        
        // Validate specialInstructions length
        if (data.specialInstructions && data.specialInstructions.length > 500) {
            errors.push('Special instructions must be less than 500 characters');
        }
        
        // Validate currency
        const validCurrencies = ['USD', 'UZS', 'EUR'];
        if (data.currency && !validCurrencies.includes(data.currency)) {
            errors.push('Invalid currency');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Calculate estimated delivery date
     */
    calculateEstimatedDelivery(deliveryService) {
        const now = new Date();
        let days;
        
        switch (deliveryService) {
            case 'express':
                days = 2;
                break;
            case 'economy':
                days = 10;
                break;
            case 'standard':
            default:
                days = 5;
                break;
        }
        
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    async processCheckout(req, res) {
        try {
            const buyerId = req.user.userId;
            const rawData = req.body;

            // Validate and sanitize input
            const validation = this.validateCheckoutInput(rawData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors
                });
            }

            // Sanitize input data
            const {
                selectedItemIds,
                deliveryMethod,
                deliveryAddress,
                deliveryService = 'standard',
                paymentMethod,
                specialInstructions = '',
                currency = 'USD'
            } = {
                ...rawData,
                specialInstructions: this.sanitizeInput(rawData.specialInstructions || ''),
                deliveryAddress: rawData.deliveryAddress ? {
                    ...rawData.deliveryAddress,
                    fullAddress: this.sanitizeInput(rawData.deliveryAddress.fullAddress || ''),
                    city: this.sanitizeInput(rawData.deliveryAddress.city || ''),
                    district: this.sanitizeInput(rawData.deliveryAddress.district || ''),
                    name: this.sanitizeInput(rawData.deliveryAddress.name || ''),
                    phoneNumber: this.sanitizeInput(rawData.deliveryAddress.phoneNumber || '')
                } : null
            };

            this.logger.log(`🛒 Processing checkout for buyer: ${buyerId}`);

            // Rate limiting check (could be implemented with redis)
            // TODO: Implement rate limiting for checkout attempts

            // Get fresh user data following project specifications
            const User = require('../models/User');
            const buyer = await User.findById(buyerId).select('-password');
            if (!buyer) {
                return res.status(404).json({
                    success: false,
                    message: 'Buyer not found'
                });
            }

            // Get cart and validate selected items
            const cart = await Cart.findOne({ buyerId })
                .populate('items.productId', 'title name images price pricing inventory category')
                .populate('items.manufacturerId', 'companyName businessName');

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            // Filter selected items
            const selectedItems = cart.items.filter(item => 
                selectedItemIds.includes(item._id.toString())
            );

            if (selectedItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected items not found in cart'
                });
            }

            // Group items by manufacturer (B2B orders are per manufacturer)
            const itemsByManufacturer = {};
            selectedItems.forEach(item => {
                const manufacturerId = item.manufacturerId._id.toString();
                if (!itemsByManufacturer[manufacturerId]) {
                    itemsByManufacturer[manufacturerId] = {
                        manufacturer: item.manufacturerId,
                        items: [],
                        subtotal: 0
                    };
                }
                itemsByManufacturer[manufacturerId].items.push(item);
                itemsByManufacturer[manufacturerId].subtotal += item.totalPrice;
            });

            // Calculate shipping cost
            let shippingCost = 0;
            if (deliveryMethod === 'delivery') {
                switch (deliveryService) {
                    case 'standard':
                        shippingCost = 8.00;
                        break;
                    case 'express':
                        shippingCost = 15.00;
                        break;
                    case 'economy':
                        shippingCost = 3.00;
                        break;
                    default:
                        shippingCost = 8.00;
                }
            }

            // Create orders for each manufacturer
            const createdOrders = [];
            const Order = require('../models/Order');

            for (const [manufacturerId, manufacturerData] of Object.entries(itemsByManufacturer)) {
                // Calculate order totals
                const subtotal = manufacturerData.subtotal;
                const taxAmount = subtotal * 0.1; // 10% tax
                const totalAmount = subtotal + shippingCost + taxAmount;

                // Prepare order items
                const orderItems = manufacturerData.items.map(item => ({
                    product: item.productId._id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    specifications: item.selectedSpecs ? Object.entries(item.selectedSpecs).map(([name, value]) => ({ name, value })) : [],
                    customRequirements: item.notes || ''
                }));

                // Prepare shipping information
                const shippingInfo = {
                    method: deliveryMethod === 'delivery' ? deliveryService : 'pickup',
                    estimatedDelivery: this.calculateEstimatedDelivery(deliveryService),
                    shippingNotes: deliveryMethod === 'pickup' ? 'Customer will pickup from warehouse' : ''
                };

                // Add delivery address if applicable
                if (deliveryMethod === 'delivery' && deliveryAddress) {
                    shippingInfo.address = {
                        street: deliveryAddress.fullAddress || '',
                        city: deliveryAddress.city || '',
                        state: deliveryAddress.district || '',
                        country: deliveryAddress.country || 'Uzbekistan',
                        postalCode: deliveryAddress.postalCode || '',
                        contactPerson: deliveryAddress.name || buyer.contactPerson || buyer.companyName,
                        contactPhone: deliveryAddress.phoneNumber || buyer.phone || ''
                    };
                }

                // Prepare payment information
                const paymentInfo = {
                    method: paymentMethod,
                    terms: paymentMethod === 'cash_on_delivery' ? 'immediate' : 'net_30',
                    status: 'pending',
                    dueDate: paymentMethod === 'cash_on_delivery' ? 
                        shippingInfo.estimatedDelivery : 
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
                };

                // Add bank details for bank transfer
                if (paymentMethod === 'bank_transfer') {
                    paymentInfo.bankDetails = {
                        bankName: 'National Bank of Uzbekistan',
                        accountNumber: 'UZ86 0000 0000 0000 0000 0000 0000',
                        swiftCode: 'NBUZUZGX',
                        routingNumber: '860000001'
                    };
                }

                // Create order
                const order = new Order({
                    buyer: buyerId,
                    seller: manufacturerId,
                    items: orderItems,
                    subtotal,
                    taxAmount,
                    shippingCost,
                    totalAmount,
                    currency,
                    shipping: shippingInfo,
                    payment: paymentInfo,
                    specialInstructions: specialInstructions || '',
                    requestedDeliveryDate: shippingInfo.estimatedDelivery
                });

                // Save order
                const savedOrder = await order.save();
                await savedOrder.populate([
                    { path: 'buyer', select: 'companyName email phone' },
                    { path: 'seller', select: 'companyName email phone' },
                    { path: 'items.product', select: 'title name images category' }
                ]);

                createdOrders.push(savedOrder);
                this.logger.log(`✅ Order created: ${savedOrder.orderNumber} for manufacturer: ${manufacturerId}`);
            }

            // Remove selected items from cart
            cart.items = cart.items.filter(item => 
                !selectedItemIds.includes(item._id.toString())
            );
            await cart.save();

            this.logger.log(`🗑️ Removed ${selectedItemIds.length} items from cart for buyer: ${buyerId}`);

            // Return success response
            res.json({
                success: true,
                message: `${createdOrders.length} order(s) created successfully`,
                data: {
                    orders: createdOrders.map(order => ({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        manufacturer: order.seller.companyName,
                        totalAmount: order.totalAmount,
                        currency: order.currency,
                        status: order.status,
                        paymentMethod: order.payment.method,
                        estimatedDelivery: order.shipping.estimatedDelivery
                    })),
                    redirectUrl: '/buyer/orders'
                }
            });

        } catch (error) {
            this.logger.error('❌ Checkout processing error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process checkout',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    /**
     * Calculate estimated delivery date based on service type
     */
    calculateEstimatedDelivery(deliveryService) {
        const now = new Date();
        let daysToAdd = 5; // default

        switch (deliveryService) {
            case 'express':
                daysToAdd = 2;
                break;
            case 'standard':
                daysToAdd = 5;
                break;
            case 'economy':
                daysToAdd = 10;
                break;
            case 'pickup':
                daysToAdd = 1; // Next day pickup
                break;
        }

        return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    /**
     * Process checkout - create order and save to database
     */
    async processCheckout(req, res) {
        try {
            const buyerId = req.user.userId;
            const {
                selectedItemIds,
                deliveryMethod,
                paymentMethod,
                deliveryAddress,
                deliveryService,
                specialInstructions,
                currency = 'USD'
            } = req.body;

            // Validation
            if (!selectedItemIds || !Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No items selected for checkout'
                });
            }

            if (!deliveryMethod || !['delivery', 'pickup'].includes(deliveryMethod)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid delivery method'
                });
            }

            if (!paymentMethod || !['bank_transfer', 'cash_on_delivery', 'cash_on_pickup'].includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment method'
                });
            }

            // Get cart items
            const cartItems = await this.buyerService.getCartItems(buyerId);
            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Filter selected items
            const selectedItems = cartItems.filter(item => 
                selectedItemIds.includes(item._id.toString())
            );

            if (selectedItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected items not found in cart'
                });
            }

            // Group items by manufacturer (B2B orders per manufacturer)
            const ordersByManufacturer = {};
            
            selectedItems.forEach(item => {
                const manufacturerId = item.manufacturerId?.toString() || 'unknown';
                if (!ordersByManufacturer[manufacturerId]) {
                    ordersByManufacturer[manufacturerId] = {
                        seller: item.manufacturerId,
                        items: [],
                        subtotal: 0
                    };
                }
                
                const unitPrice = item.productId.pricing?.basePrice || item.unitPrice || 0;
                const itemTotal = unitPrice * item.quantity;
                ordersByManufacturer[manufacturerId].items.push({
                    product: item.productId._id,
                    quantity: item.quantity,
                    unitPrice: unitPrice,
                    totalPrice: itemTotal,
                    specifications: item.selectedSpecs ? Object.entries(item.selectedSpecs).map(([name, value]) => ({ name, value })) : []
                });
                ordersByManufacturer[manufacturerId].subtotal += itemTotal;
            });

            // Create orders
            const createdOrders = [];
            const Order = require('../models/Order');

            for (const [manufacturerId, orderData] of Object.entries(ordersByManufacturer)) {
                const taxAmount = orderData.subtotal * 0.1; // 10% tax
                const shippingCost = deliveryMethod === 'delivery' ? 8.00 : 0;
                const totalAmount = orderData.subtotal + taxAmount + shippingCost;

                // Generate unique order number
                const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                const order = new Order({
                    orderNumber,
                    buyer: buyerId,
                    seller: orderData.seller,
                    items: orderData.items,
                    subtotal: orderData.subtotal,
                    taxAmount,
                    shippingCost,
                    totalAmount,
                    currency,
                    status: 'pending',
                    statusHistory: [{
                        status: 'pending',
                        timestamp: new Date(),
                        notes: 'Order created via checkout'
                    }],
                    shipping: deliveryMethod === 'delivery' ? {
                        method: deliveryService || 'standard',
                        address: deliveryAddress ? {
                            street: deliveryAddress.fullAddress,
                            city: deliveryAddress.city,
                            state: deliveryAddress.district,
                            country: deliveryAddress.country || 'Uzbekistan',
                            contactPerson: deliveryAddress.name,
                            contactPhone: deliveryAddress.phoneNumber
                        } : null,
                        estimatedDelivery: this.calculateEstimatedDelivery(deliveryService || 'standard')
                    } : {
                        method: 'pickup',
                        address: null,
                        estimatedDelivery: this.calculateEstimatedDelivery('pickup')
                    },
                    payment: {
                        method: paymentMethod,
                        status: 'pending'
                    },
                    incoterms: {
                        term: 'FOB', // Default for B2B
                        location: 'Warehouse'
                    },
                    businessTerms: {
                        creditPeriod: 30,
                        minimumOrderValue: 100
                    },
                    specialInstructions: specialInstructions || '',
                    priority: 'normal'
                });

                const savedOrder = await order.save();
                createdOrders.push(savedOrder);
            }

            // Remove processed items from cart
            await this.buyerService.removeMultipleFromCart(buyerId, selectedItemIds);

            this.logger.log(`✅ Orders created successfully: ${createdOrders.length} orders for buyer ${buyerId}`);

            res.json({
                success: true,
                message: `Orders created successfully! ${createdOrders.length} order(s) placed.`,
                data: {
                    orders: createdOrders.map(order => ({
                        id: order._id,
                        orderNumber: order.orderNumber,
                        totalAmount: order.totalAmount,
                        currency: order.currency,
                        status: order.status
                    })),
                    redirectUrl: '/buyer/orders'
                }
            });

        } catch (error) {
            this.logger.error('❌ Checkout processing error:', error);
            
            // Different error types for better user experience
            let statusCode = 500;
            let message = 'Failed to process checkout';
            
            if (error.name === 'ValidationError') {
                statusCode = 400;
                message = 'Invalid order data provided';
            } else if (error.code === 11000) {
                statusCode = 409;
                message = 'Order number conflict. Please try again.';
            } else if (error.message.includes('Cart is empty')) {
                statusCode = 400;
                message = 'Your cart is empty';
            } else if (error.message.includes('not found')) {
                statusCode = 404;
                message = 'Required data not found';
            } else if (error.message) {
                message = error.message;
            }
            
            res.status(statusCode).json({
                success: false,
                message: message,
                code: error.code || 'CHECKOUT_ERROR'
            });
        }
    }
}

module.exports = BuyerController;