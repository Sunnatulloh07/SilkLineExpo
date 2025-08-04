/**
 * Category Controller - Professional B2B Marketplace
 * Senior Software Engineer Level Implementation
 * 
 * Features:
 * - Complete CRUD operations with validation
 * - Advanced error handling
 * - Professional logging system
 * - Multi-language support
 * - Analytics and statistics
 * - Bulk operations support
 */

const CategoryService = require('../services/CategoryService');
const { validationResult } = require('express-validator');

class CategoryController {
  constructor() {
    this.logger = {
      log: (message, data = {}) => {
        console.log(`🏷️ CategoryController: ${message}`, data);
      },
      error: (message, error = {}) => {
        console.error(`❌ CategoryController Error: ${message}`, error);
      }
    };
  }

  // ===============================================
  // UI ROUTES - Category Pages
  // ===============================================

  /**
   * Show categories management page
   */
  async showCategories(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📂 Categories page request from admin: ${adminId}`);
      
      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      // Get categories statistics for initial page load
      const statistics = await CategoryService.getCategoryStatistics(adminId);
      
      res.render('admin/categories/index', {
        title: req.t('admin.categories') || 'Categories Management',
        statistics: statistics.data,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        currentPage: 'categories',
        csrfToken: req.csrfToken?.() || '',
        breadcrumb: [
          { title: 'Dashboard', url: '/admin' },
          { title: 'Categories' }
        ]
      });
    } catch (error) {
      this.logger.error('Error in showCategories:', error);
      this.renderError(res, req, error, 'Failed to load categories page');
    }
  }

  // ===============================================
  // API ROUTES - Category Management
  // ===============================================

  /**
   * Get all categories via API with advanced filtering
   */
  async getAllCategoriesAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Extract and validate query parameters with defaults
      const options = {
        page: Math.max(1, parseInt(req.query.page) || 1),
        pageSize: Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25)),
        status: req.query.status || '',
        level: req.query.level || '',
        parentCategory: req.query.parentCategory || '',
        search: (req.query.search || '').trim(),
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'desc',
        isActive: req.query.isActive || '',
        isFeatured: req.query.isFeatured || '',
        language: req.query.language || 'en'
      };

      this.logger.log(`📂 Categories API request from admin: ${adminId}`, options);

      const result = await CategoryService.getAllCategories(adminId, options);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getAllCategoriesAPI:', error);
      this.handleAPIError(res, error, 'Failed to retrieve categories');
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStatistics(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📊 Category statistics request from admin: ${adminId}`);

      const statistics = await CategoryService.getCategoryStatistics(adminId);

      this.sendSuccess(res, statistics.data, 'Category statistics retrieved successfully');
    } catch (error) {
      this.logger.error('Error in getCategoryStatistics:', error);
      this.handleAPIError(res, error, 'Failed to retrieve category statistics');
    }
  }

  /**
   * Create new category
   */
  async createCategory(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const categoryData = {
        name: req.body.name?.trim(),
        slug: req.body.slug?.trim(),
        description: req.body.description?.trim(),
        shortDescription: req.body.shortDescription?.trim(),
        parentCategory: req.body.parentCategory || null,
        icon: req.body.icon?.trim() || 'las la-folder',
        color: req.body.color?.trim() || '#3B82F6',
        translations: req.body.translations || {},
        seo: req.body.seo || {},
        settings: {
          isActive: req.body.isActive !== false,
          isVisible: req.body.isVisible !== false,
          isFeatured: req.body.isFeatured === true,
          allowProducts: req.body.allowProducts !== false,
          requireApproval: req.body.requireApproval === true,
          sortOrder: parseInt(req.body.sortOrder) || 0
        },
        businessRules: req.body.businessRules || {},
        content: req.body.content || {}
      };

      this.logger.log(`📂 Creating category: ${categoryData.name} by admin: ${adminId}`);

      const result = await CategoryService.createCategory(adminId, categoryData);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in createCategory:', error);
      this.handleAPIError(res, error, 'Failed to create category');
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const updateData = {
        name: req.body.name?.trim(),
        description: req.body.description?.trim(),
        shortDescription: req.body.shortDescription?.trim(),
        parentCategory: req.body.parentCategory || null,
        icon: req.body.icon?.trim(),
        color: req.body.color?.trim(),
        translations: req.body.translations,
        seo: req.body.seo,
        settings: req.body.settings,
        businessRules: req.body.businessRules,
        content: req.body.content
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      this.logger.log(`📂 Updating category: ${categoryId} by admin: ${adminId}`, updateData);

      const result = await CategoryService.updateCategory(adminId, categoryId, updateData);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in updateCategory:', error);
      this.handleAPIError(res, error, 'Failed to update category');
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;
      const { reason = '' } = req.body;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      this.logger.log(`📂 Deleting category: ${categoryId} by admin: ${adminId}`, { reason });

      const result = await CategoryService.deleteCategory(adminId, categoryId, reason);

      this.sendSuccess(res, null, result.message);
    } catch (error) {
      this.logger.error('Error in deleteCategory:', error);
      this.handleAPIError(res, error, 'Failed to delete category');
    }
  }

  /**
   * Get category hierarchy
   */
  async getCategoryHierarchy(req, res) {
    try {
      const language = req.query.language || 'en';

      this.logger.log(`📂 Category hierarchy request for language: ${language}`);

      const result = await CategoryService.getCategoryHierarchy(language);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getCategoryHierarchy:', error);
      this.handleAPIError(res, error, 'Failed to retrieve category hierarchy');
    }
  }

  /**
   * Bulk operations on categories
   */
  async bulkUpdateCategories(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const { categoryIds, action, reason = '' } = req.body;

      this.logger.log(`📂 Bulk ${action} operation on ${categoryIds.length} categories by admin: ${adminId}`);

      const result = await CategoryService.bulkUpdateCategories(adminId, categoryIds, action, { reason });

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in bulkUpdateCategories:', error);
      this.handleAPIError(res, error, 'Failed to perform bulk operation');
    }
  }

  /**
   * Export categories data
   */
  async exportCategories(req, res) {
    try {
      const adminId = req.user.userId;
      const format = req.query.format || 'csv';
      
      this.logger.log(`📊 Categories export request from admin: ${adminId}, format: ${format}`);

      // Get filters from query
      const filters = {
        status: req.query.status,
        level: req.query.level,
        parentCategory: req.query.parentCategory
      };

      const exportData = await CategoryService.exportCategories(adminId, { format, filters });

      // Set appropriate headers for file download
      const filename = exportData.filename;
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData.data);
        res.send(csvData);
      } else {
        res.json(exportData.data);
      }
    } catch (error) {
      this.logger.error('Error in exportCategories:', error);
      this.handleAPIError(res, error, 'Failed to export categories');
    }
  }

  /**
   * Get category analytics
   */
  async getCategoryAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;
      const options = {
        dateRange: req.query.dateRange || '30d'
      };

      this.logger.log(`📊 Category analytics request for category: ${categoryId} by admin: ${adminId}`);

      const result = await CategoryService.getCategoryAnalytics(adminId, categoryId, options);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getCategoryAnalytics:', error);
      this.handleAPIError(res, error, 'Failed to retrieve category analytics');
    }
  }

  // ===============================================
  // VALIDATION RULES
  // ===============================================

  static getCategoryValidationRules() {
    const { param } = require('express-validator');
    return [
      param('categoryId').isMongoId().withMessage('Invalid category ID format')
    ];
  }

  static getCreateCategoryValidationRules() {
    const { body } = require('express-validator');
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
      body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-_]+$/)
        .withMessage('Slug can only contain lowercase letters, numbers, hyphens and underscores'),
      body('description')
        .notEmpty()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description is required and must be between 10 and 1000 characters'),
      body('parentCategory')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent category ID')
    ];
  }

  static getUpdateCategoryValidationRules() {
    const { param, body } = require('express-validator');
    return [
      param('categoryId').isMongoId().withMessage('Invalid category ID format'),
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
    ];
  }

  static getBulkCategoryValidationRules() {
    const { body } = require('express-validator');
    return [
      body('categoryIds')
        .isArray({ min: 1 })
        .withMessage('Category IDs array is required'),
      body('categoryIds.*')
        .isMongoId()
        .withMessage('Invalid category ID format'),
      body('action')
        .isIn(['activate', 'deactivate', 'feature', 'unfeature', 'archive'])
        .withMessage('Invalid bulk action')
    ];
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  getLanguagePreference(req) {
    return req.cookies?.selectedLanguage || 
           req.session?.language || 
           req.headers['accept-language']?.split(',')[0]?.substring(0, 2) || 
           'uz';
  }

  sendSuccess(res, data, message = 'Success') {
    res.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  sendValidationError(res, errors) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages,
      timestamp: new Date().toISOString()
    });
  }

  handleAPIError(res, error, message = 'An error occurred') {
    const statusCode = error.name === 'ValidationError' ? 400 : 
                      error.name === 'CastError' ? 400 : 
                      error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: message,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }

  renderError(res, req, error, message = 'An error occurred') {
    this.logger.error(message, error);
    
    res.status(500).render('error', {
      title: 'Error',
      message,
      error: process.env.NODE_ENV === 'development' ? error : {},
      admin: req.user,
      currentLang: this.getLanguagePreference(req)
    });
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
}

module.exports = CategoryController;