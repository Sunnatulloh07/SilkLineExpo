/**
 * Buyer Profile Controller
 * Alibaba-style buyer profile for purchasing and supplier interaction
 * Simple profile system for individual buyers without complex dashboard
 */

const BuyerService = require('../services/BuyerService');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const { validationResult } = require('express-validator');

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
            
            // Get sidebar data
            const [cartItems, unreadMessagesCount, profileStats] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId),
                this.buyerService.getProfileStats(buyerId)
            ]);

            res.render('buyer/orders', {
                title: 'My Orders - SLEX',
                currentPage: 'orders',
                user: req.user,
                currentUser: req.user,
                currentUserRole: req.user?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: profileStats?.activeOrders || 0,
                unreadMessagesCount: unreadMessagesCount || 0
            });

        } catch (error) {
            this.logger.error('❌ Orders page error:', error);
            this.renderOrdersErrorPage(res, req, error);
        }
    }

    /**
     * Render orders error page helper
     */
    renderOrdersErrorPage(res, req, error) {
        const lng = this.getLanguagePreference(req);

        res.status(500).render('buyer/orders', {
            title: 'My Orders - SLEX',
            currentPage: 'orders',
            user: req.user || {},
            lng: lng,
            cartItemsCount: 0,
            activeOrdersCount: 0,
            unreadMessagesCount: 0,
            errorMessage: 'Failed to load orders page.'
        });
    }

    /**
     * Render messages page
     */
    async showMessages(req, res) {
        try {
            const buyerId = req.user.userId;
            
            // Get sidebar data
            const [cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            res.render('buyer/messages', {
                title: 'Messages - SLEX',
                currentPage: 'messages',
                user: req.user,
                currentUser: req.user,
                currentUserRole: req.user?.companyType || 'distributor',
                lng: this.getLanguagePreference(req),
                cartItemsCount: cartItems ? cartItems.length : 0,
                activeOrdersCount: 0, // Will be fetched dynamically
                unreadMessagesCount: unreadMessagesCount || 0
            });

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
            
            res.render('buyer/inquiries', {
                title: 'Product Inquiries - SLEX',
                currentPage: 'inquiries',
                user: req.user,
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

            // Get cart and sidebar data
            const [cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            // For testing - add sample cart data if empty
            let testCartItems = cartItems;
            if (!cartItems || cartItems.length === 0) {
                testCartItems = [
                    {
                        _id: 'test1',
                        id: 'test1',
                        quantity: 2,
                        variant: {
                            color: 'Red',
                            size: 'L'
                        },
                        product: {
                            _id: 'product1',
                            id: 'product1',
                            title: 'Premium Cotton T-Shirt',
                            price: 25.99,
                            originalPrice: 35.99,
                            images: ['/assets/images/placeholder-product.svg'],
                            category: 'Clothing',
                            seller: 'manufacturer1',
                            sellerName: 'Fashion Co Ltd',
                            minQuantity: 1,
                            maxQuantity: 100,
                            stock: 50
                        }
                    },
                    {
                        _id: 'test2',
                        id: 'test2',
                        quantity: 1,
                        variant: {
                            color: 'Blue',
                            size: 'M'
                        },
                        product: {
                            _id: 'product2',
                            id: 'product2',
                            title: 'Wireless Bluetooth Headphones',
                            price: 89.99,
                            originalPrice: null,
                            images: ['/assets/images/placeholder-product.svg'],
                            category: 'Electronics',
                            seller: 'manufacturer2',
                            sellerName: 'Tech Solutions Inc',
                            minQuantity: 1,
                            maxQuantity: 20,
                            stock: 15
                        }
                    }
                ];
            }

            res.render('buyer/cart', {
                title: 'Shopping Cart - SLEX',
                currentPage: 'cart',
                user: req.user,
                currentUser: req.user,
                currentUserRole: req.user?.companyType || 'distributor',
                cartItems: testCartItems,
                lng: this.getLanguagePreference(req),
                cartItemsCount: testCartItems ? testCartItems.length : 0,
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

            // Get favorites and sidebar data
            const [favorites, cartItems, unreadMessagesCount] = await Promise.all([
                this.buyerService.getFavoriteProducts(buyerId),
                this.buyerService.getCartItems(buyerId),
                this.buyerService.getUnreadMessagesCount(buyerId)
            ]);

            res.render('buyer/favorites', {
                title: 'My Favorites - SLEX',
                currentPage: 'favorites',
                user: req.user,
                currentUser: req.user,
                currentUserRole: req.user?.companyType || 'distributor',
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
            
            this.sendSuccess(res, result, 'Orders retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get orders');
        }
    }

    /**
     * API: Get buyer conversations
     */
    async getBuyerConversations(req, res) {
        try {
            const buyerId = req.user.userId;
            const filters = {
                filter: req.query.filter || 'all',
                search: req.query.search
            };
            
            const conversations = await this.buyerService.getBuyerConversations(buyerId, filters);
            
            this.sendSuccess(res, conversations, 'Conversations retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get conversations');
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
     * API: Send message to supplier
     */
    async sendMessage(req, res) {
        try {
            const buyerId = req.user.userId;
            const { conversationId, message, attachments } = req.body;
            
            const result = await this.buyerService.sendMessage(buyerId, conversationId, message, attachments);
            
            this.sendSuccess(res, result, 'Message sent successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to send message');
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
     * API: Add product to favorites
     */
    async addToFavorites(req, res) {
        try {
            const buyerId = req.user.userId;
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

            const result = await this.buyerService.addToFavorites(buyerId, productId);

            res.json({
                success: true,
                message: result.message || 'Added to favorites successfully'
            });

        } catch (error) {
            this.logger.error('❌ Add to favorites error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add to favorites'
            });
        }
    }
}

module.exports = BuyerController;