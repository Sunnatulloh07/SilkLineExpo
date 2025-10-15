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
        // Logging disabled for production
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

      const result = await CategoryService.createCategory(adminId, categoryData);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in createCategory:', error);
      this.handleAPIError(res, error, 'Failed to create category');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.getCategoryById(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getCategoryById:', error);
      this.handleAPIError(res, error, 'Failed to get category');
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
    const { param, body } = require('express-validator');
    return [
      param('categoryId')
        .isMongoId()
        .withMessage('Invalid category ID format')
        .customSanitizer(value => value.trim())
        .escape(),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
      body('isVisible').optional().isBoolean().withMessage('isVisible must be a boolean'),
      body('status').optional().isIn(['active', 'inactive', 'draft']).withMessage('Status must be active, inactive, or draft'),
      body('forceDelete').optional().isBoolean().withMessage('forceDelete must be a boolean')
    ];
  }

  static getCreateCategoryValidationRules() {
    const { body } = require('express-validator');
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
      body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-_]+$/)
        .withMessage('Slug can only contain lowercase letters, numbers, hyphens and underscores'),
      body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
      body('icon')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Icon must be between 1 and 50 characters'),
      body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-F]{6}$/i)
        .withMessage('Color must be a valid hex color code'),
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
      body('isVisible')
        .optional()
        .isBoolean()
        .withMessage('isVisible must be a boolean value'),
      body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean value'),
      // Multi-language validation - Uzbek is required
      body('translations.uz.name')
        .trim()
        .notEmpty()
        .withMessage('O\'zbek tilida kategoriya nomi majburiy')
        .isLength({ min: 2, max: 100 })
        .withMessage('Kategoriya nomi 2-100 belgi oralig\'ida bo\'lishi kerak'),
      body('translations.uz.description')
        .trim()
        .notEmpty()
        .withMessage('O\'zbek tilida kategoriya tavsifi majburiy')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Kategoriya tavsifi 10-1000 belgi oralig\'ida bo\'lishi kerak')
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
        .isIn(['activate', 'deactivate'])
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

    res.status(500).render('pages/error', {
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

  /**
   * Toggle category status (active/inactive)
   */
  async toggleCategoryStatus(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.toggleCategoryStatus(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in toggleCategoryStatus:', error);
      this.handleAPIError(res, error, 'Failed to toggle category status');
    }
  }

  /**
   * Toggle category visibility (visible/hidden)
   */
  async toggleCategoryVisibility(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.toggleCategoryVisibility(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in toggleCategoryVisibility:', error);
      this.handleAPIError(res, error, 'Failed to toggle category visibility');
    }
  }

  /**
   * Toggle category main status (active/inactive/draft)
   */
  async toggleCategoryMainStatus(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.toggleCategoryMainStatus(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in toggleCategoryMainStatus:', error);
      this.handleAPIError(res, error, 'Failed to toggle category main status');
    }
  }

  /**
   * Get category deletion safety info
   */
  async getCategoryDeletionInfo(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.getCategoryDeletionInfo(categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getCategoryDeletionInfo:', error);
      this.handleAPIError(res, error, 'Failed to get category deletion info');
    }
  }

  /**
   * Delete category with safety checks
   */
  async deleteCategory(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;
      const { forceDelete = false } = req.body;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.deleteCategory(adminId, categoryId, forceDelete);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in deleteCategory:', error);
      this.handleAPIError(res, error, 'Failed to delete category');
    }
  }

  /**
   * Restore soft deleted category
   */
  async restoreCategory(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.restoreCategory(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in restoreCategory:', error);
      this.handleAPIError(res, error, 'Failed to restore category');
    }
  }

  /**
   * Permanently delete category
   */
  async permanentDeleteCategory(req, res) {
    try {
      const adminId = req.user.userId;
      const { categoryId } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      const result = await CategoryService.permanentDeleteCategory(adminId, categoryId);

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in permanentDeleteCategory:', error);
      this.handleAPIError(res, error, 'Failed to permanently delete category');
    }
  }

  /**
   * Get soft deleted categories
   */
  async getSoftDeletedCategories(req, res) {
    try {
      const adminId = req.user.userId;
      const { page = 1, limit = 10, search = '' } = req.query;

      const result = await CategoryService.getSoftDeletedCategories(adminId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      this.sendSuccess(res, result.data, result.message);
    } catch (error) {
      this.logger.error('Error in getSoftDeletedCategories:', error);
      this.handleAPIError(res, error, 'Failed to get soft deleted categories');
    }
  }
}

module.exports = CategoryController;