/**
 * Category Service - Professional B2B Marketplace
 * Senior Software Engineer Level Implementation
 * 
 * Features:
 * - CRUD operations with advanced validation
 * - Hierarchical category management
 * - Advanced analytics and statistics
 * - Multi-language support
 * - Professional error handling
 * - Performance optimized queries
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

class CategoryService {
  /**
   * Get all categories with advanced filtering and pagination
   */
  static async getAllCategories(adminId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 25,
        status = '',
        level = '',
        parentCategory = '',
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive = '',
        isFeatured = '',
        language = 'en'
      } = options;

      // Build query
      const query = {};
      
      if (status) query.status = status;
      // All categories are at root level (no hierarchy)
      if (isActive !== '') query['settings.isActive'] = isActive === 'true';
      if (isFeatured !== '') query['settings.isFeatured'] = isFeatured === 'true';
      
      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
          { [`translations.${language}.name`]: { $regex: search, $options: 'i' } }
        ];
      }

      // Sort configuration
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute aggregation pipeline for comprehensive data
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'creatorInfo',
            pipeline: [
              { $project: { companyName: 1, email: 1, name: 1 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products',
            pipeline: [
              { 
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  totalRevenue: { $sum: '$businessMetrics.totalRevenue' }
                }
              }
            ]
          }
        },
        {
          $addFields: {
            parentCategoryName: { $arrayElemAt: ['$parentInfo.name', 0] },
            creatorName: { $arrayElemAt: ['$creatorInfo.companyName', 0] },
            productStats: {
              $reduce: {
                input: '$products',
                initialValue: { total: 0, active: 0, revenue: 0 },
                in: {
                  total: { $add: ['$$value.total', '$$this.count'] },
                  active: {
                    $add: [
                      '$$value.active',
                      { $cond: [{ $eq: ['$$this._id', 'active'] }, '$$this.count', 0] }
                    ]
                  },
                  revenue: { $add: ['$$value.revenue', '$$this.totalRevenue'] }
                }
              }
            }
          }
        },
        { $sort: sortConfig },
        {
          $facet: {
            categories: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const result = await Category.aggregate(pipeline);
      const categories = result[0].categories || [];
      const totalCount = result[0].totalCount[0]?.count || 0;

      return {
        success: true,
        data: {
          categories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
            totalItems: totalCount,
            itemsPerPage: pageSize,
            hasNext: page < Math.ceil(totalCount / pageSize),
            hasPrev: page > 1
          },
          filters: {
            status,
            search,
            sortBy,
            sortOrder
          }
        },
        message: `${categories.length} categories retrieved successfully`
      };
    } catch (error) {
      console.error('❌ Error in getAllCategories:', error);
      throw error;
    }
  }

  /**
   * Get category statistics for admin dashboard
   */
  static async getCategoryStatistics(adminId) {
    try {
      const [
        totalCategories,
        statusStats,
        levelStats,
        recentCategories,
        topCategories,
        businessMetrics
      ] = await Promise.all([
        // Total categories count
        Category.countDocuments(),
        
        // Status distribution
        Category.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Level distribution
        Category.aggregate([
          {
            $group: {
              _id: '$level',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        
        // Recent categories (last 30 days)
        Category.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }),
        
        // Top categories by product count
        Category.aggregate([
          { $match: { status: 'active' } },
          { $sort: { 'metrics.totalProducts': -1 } },
          { $limit: 5 },
          {
            $project: {
              name: 1,
              'metrics.totalProducts': 1,
              'metrics.activeProducts': 1,
              'metrics.totalRevenue': 1
            }
          }
        ]),
        
        // Business metrics aggregation
        Category.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: '$metrics.totalProducts' },
              totalRevenue: { $sum: '$metrics.totalRevenue' },
              avgProductsPerCategory: { $avg: '$metrics.totalProducts' },
              totalActiveCategories: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      // Format status statistics
      const statusCounts = {};
      statusStats.forEach(stat => {
        statusCounts[stat._id] = stat.count;
      });

      // Format level statistics
      const levelDistribution = levelStats.map(stat => ({
        level: stat._id,
        count: stat.count,
        label: stat._id === 0 ? 'Root Categories' : `Level ${stat._id}`
      }));

      const businessData = businessMetrics[0] || {};

      return {
        success: true,
        data: {
          overview: {
            total: totalCategories,
            active: statusCounts.active || 0,
            inactive: statusCounts.inactive || 0,
            draft: statusCounts.draft || 0,
            archived: statusCounts.archived || 0,
            recentlyAdded: recentCategories
          },
          statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percentage: Math.round((count / totalCategories) * 100)
          })),
          levelDistribution,
          topCategories,
          businessMetrics: {
            totalProducts: businessData.totalProducts || 0,
            totalRevenue: businessData.totalRevenue || 0,
            averageProductsPerCategory: Math.round(businessData.avgProductsPerCategory || 0),
            activeCategories: businessData.totalActiveCategories || 0
          },
          growth: {
            categoriesThisMonth: recentCategories,
            growthRate: totalCategories > 0 ? Math.round((recentCategories / totalCategories) * 100) : 0
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in getCategoryStatistics:', error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  static async createCategory(adminId, categoryData) {
    try {
      // Generate slug if not provided
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
      }

      // Check for duplicate slug and make it unique if needed
      let finalSlug = categoryData.slug;
      let counter = 1;
      while (await Category.findOne({ slug: finalSlug })) {
        finalSlug = `${categoryData.slug}-${counter}`;
        counter++;
      }
      categoryData.slug = finalSlug;

      // Create category with simplified structure
      const category = new Category({
        name: categoryData.name,
        slug: finalSlug,
        description: categoryData.description,
        icon: categoryData.icon || 'las la-folder',
        color: categoryData.color || '#3B82F6',
        translations: categoryData.translations || {},
        seo: categoryData.seo || {},
        settings: {
          isActive: categoryData.settings?.isActive !== false,
          isVisible: categoryData.settings?.isVisible !== false,
          isFeatured: categoryData.settings?.isFeatured === true,
          allowProducts: categoryData.settings?.allowProducts !== false,
          requireApproval: categoryData.settings?.requireApproval === true,
          sortOrder: parseInt(categoryData.settings?.sortOrder) || 0
        },
        businessRules: categoryData.businessRules || {},
        content: categoryData.content || {},
        createdBy: adminId,
        lastModifiedBy: adminId
      });

      // Add audit log
      category.addAuditLog('created', adminId, categoryData, 'Category created by admin');

      await category.save();

      return {
        success: true,
        data: category,
        message: 'Category created successfully'
      };
    } catch (error) {
      console.error('❌ Error in createCategory:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  static async updateCategory(adminId, categoryId, updateData) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Store original data for audit log
      const originalData = category.toObject();

      // Validate parent category change
      if (updateData.parentCategory && updateData.parentCategory !== category.parentCategory?.toString()) {
        const newParent = await Category.findById(updateData.parentCategory);
        if (!newParent) {
          throw new Error('New parent category not found');
        }
        
        // Prevent circular reference
        if (newParent.path && newParent.path.includes(category.slug)) {
          throw new Error('Cannot set child category as parent');
        }
      }

      // Update category
      Object.assign(category, updateData);
      category.lastModifiedBy = adminId;

      // Add audit log
      const changes = this.getObjectDiff(originalData, category.toObject());
      category.addAuditLog('updated', adminId, changes, 'Category updated by admin');

      await category.save();

      // Update metrics
      await category.updateMetrics();

      return {
        success: true,
        data: category,
        message: 'Category updated successfully'
      };
    } catch (error) {
      console.error('❌ Error in updateCategory:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(adminId, categoryId, reason = '') {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category has products
      const productCount = await Product.countDocuments({ category: categoryId });
      if (productCount > 0) {
        throw new Error(`Cannot delete category with ${productCount} products. Please move or delete products first.`);
      }

      // Check if category has subcategories
      const subcategoryCount = await Category.countDocuments({ parentCategory: categoryId });
      if (subcategoryCount > 0) {
        throw new Error(`Cannot delete category with ${subcategoryCount} subcategories. Please move or delete subcategories first.`);
      }

      // Add audit log before deletion
      category.addAuditLog('deleted', adminId, {}, reason);
      await category.save();

      // Soft delete by changing status
      category.status = 'archived';
      category.settings.isActive = false;
      category.settings.isVisible = false;
      await category.save();

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error in deleteCategory:', error);
      throw error;
    }
  }

  /**
   * Get category hierarchy
   */
  static async getCategoryHierarchy(language = 'en') {
    try {
      const hierarchy = await Category.buildHierarchy();
      
      // Localize category names if language is not English
      if (language !== 'en') {
        this.localizeCategoryHierarchy(hierarchy, language);
      }

      return {
        success: true,
        data: hierarchy,
        message: 'Category hierarchy retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error in getCategoryHierarchy:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on categories
   */
  static async bulkUpdateCategories(adminId, categoryIds, action, actionData = {}) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('Category IDs array is required');
      }

      const categories = await Category.find({ _id: { $in: categoryIds } });
      if (categories.length !== categoryIds.length) {
        throw new Error('Some categories not found');
      }

      let updateFields = {};
      let auditAction = action;

      switch (action) {
        case 'activate':
          updateFields = { 
            status: 'active',
            'settings.isActive': true,
            lastModifiedBy: adminId
          };
          break;
        case 'deactivate':
          updateFields = { 
            status: 'inactive',
            'settings.isActive': false,
            lastModifiedBy: adminId
          };
          break;
        case 'feature':
          updateFields = { 
            'settings.isFeatured': true,
            lastModifiedBy: adminId
          };
          break;
        case 'unfeature':
          updateFields = { 
            'settings.isFeatured': false,
            lastModifiedBy: adminId
          };
          break;
        case 'archive':
          updateFields = { 
            status: 'archived',
            'settings.isActive': false,
            'settings.isVisible': false,
            lastModifiedBy: adminId
          };
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      // Update categories
      const result = await Category.updateMany(
        { _id: { $in: categoryIds } },
        updateFields
      );

      // Add audit logs
      for (const category of categories) {
        category.addAuditLog(auditAction, adminId, updateFields, actionData.reason || '');
        await category.save();
      }

      return {
        success: true,
        data: {
          modifiedCount: result.modifiedCount,
          action,
          categoryIds
        },
        message: `${result.modifiedCount} categories ${action}ed successfully`
      };
    } catch (error) {
      console.error('❌ Error in bulkUpdateCategories:', error);
      throw error;
    }
  }

  /**
   * Export categories data
   */
  static async exportCategories(adminId, options = {}) {
    try {
      const { format = 'csv', filters = {} } = options;

      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.level !== undefined) query.level = filters.level;

      const categories = await Category.find(query)
        .populate('parentCategory', 'name slug')
        .populate('createdBy', 'companyName email')
        .sort({ level: 1, name: 1 });

      const exportData = categories.map(category => ({
        ID: category._id,
        Name: category.name,
        Slug: category.slug,
        Description: category.description,
        Level: category.level,
        ParentCategory: category.parentCategory?.name || 'Root',
        Status: category.status,
        IsActive: category.settings.isActive,
        IsFeatured: category.settings.isFeatured,
        TotalProducts: category.metrics.totalProducts,
        ActiveProducts: category.metrics.activeProducts,
        TotalRevenue: category.metrics.totalRevenue,
        Creator: category.createdBy?.companyName || 'Unknown',
        CreatedAt: category.createdAt,
        UpdatedAt: category.updatedAt
      }));

      return {
        success: true,
        data: exportData,
        format,
        filename: `categories_export_${new Date().toISOString().split('T')[0]}.${format}`,
        message: `${exportData.length} categories exported successfully`
      };
    } catch (error) {
      console.error('❌ Error in exportCategories:', error);
      throw error;
    }
  }

  /**
   * Get category analytics
   */
  static async getCategoryAnalytics(adminId, categoryId, options = {}) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      const { dateRange = '30d' } = options;
      const dateFilter = this.getDateFilter(dateRange);
      
      // Convert categoryId to ObjectId for aggregation
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

      const [
        productAnalytics,
        revenueAnalytics,
        manufacturerAnalytics,
        trendAnalytics
      ] = await Promise.all([
        // Product analytics
        Product.aggregate([
          { $match: { category: categoryObjectId, ...dateFilter } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalRevenue: { $sum: '$businessMetrics.totalRevenue' },
              avgPrice: { $avg: '$pricing.basePrice' }
            }
          }
        ]),

        // Revenue trends
        Product.aggregate([
          { $match: { category: categoryObjectId, ...dateFilter } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$businessMetrics.totalRevenue' },
              productCount: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // Manufacturer distribution
        Product.aggregate([
          { $match: { category: categoryObjectId } },
          {
            $group: {
              _id: '$manufacturer',
              productCount: { $sum: 1 },
              totalRevenue: { $sum: '$businessMetrics.totalRevenue' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'manufacturer',
              pipeline: [{ $project: { companyName: 1, country: 1 } }]
            }
          },
          { $sort: { productCount: -1 } },
          { $limit: 10 }
        ]),

        // Trend analytics (last 12 months)
        Product.aggregate([
          {
            $match: {
              category: categoryObjectId,
              createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              newProducts: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      return {
        success: true,
        data: {
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            level: category.level
          },
          productAnalytics,
          revenueAnalytics,
          manufacturerAnalytics,
          trendAnalytics,
          summary: {
            totalProducts: category.metrics.totalProducts,
            activeProducts: category.metrics.activeProducts,
            totalRevenue: category.metrics.totalRevenue,
            averageProductPrice: category.metrics.averageProductPrice,
            popularityScore: category.metrics.popularityScore
          }
        },
        message: 'Category analytics retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error in getCategoryAnalytics:', error);
      throw error;
    }
  }

  // Helper Methods
  static localizeCategoryHierarchy(categories, language) {
    categories.forEach(category => {
      if (category.translations && category.translations[language]) {
        const translation = category.translations[language];
        if (translation.name) category.name = translation.name;
        if (translation.description) category.description = translation.description;
      }
      if (category.children && category.children.length > 0) {
        this.localizeCategoryHierarchy(category.children, language);
      }
    });
  }

  static getObjectDiff(obj1, obj2) {
    const diff = {};
    for (const key in obj2) {
      if (obj1[key] !== obj2[key]) {
        diff[key] = { from: obj1[key], to: obj2[key] };
      }
    }
    return diff;
  }

  static getDateFilter(dateRange) {
    const now = new Date();
    const filter = {};

    switch (dateRange) {
      case '7d':
        filter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        filter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        filter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        filter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
      default:
        // No date filter
        break;
    }

    return filter;
  }
}

module.exports = CategoryService;