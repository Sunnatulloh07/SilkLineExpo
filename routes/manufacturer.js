/**
 * Manufacturer Dashboard Routes
 * Professional B2B platform for manufacturers
 * Role-based access with comprehensive business features
 */

const express = require("express");
const multer = require("multer");
const ManufacturerControllerClass = require("../controllers/ManufacturerController");
const { authenticate, manufacturerOnly } = require("../middleware/jwtAuth");
const {
  manufacturerOnly: enhancedManufacturerOnly,
  preventCrossDashboardAccess,
  validateManufacturerApiAccess,
  setSecurityHeaders,
} = require("../middleware/dashboardSecurity");
const { validationResult } = require("express-validator");

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Faqat JPG, PNG, WebP formatdagi rasmlar qabul qilinadi"),
        false
      );
    }
  },
});

// Validation error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array().map((error) => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      })),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Create instance and bind methods
const ManufacturerController = new ManufacturerControllerClass();
const boundMethods = {
  // Dashboard Views
  showDashboard: ManufacturerController.showDashboard.bind(
    ManufacturerController
  ),
  showMarketplace: ManufacturerController.showMarketplace.bind(
    ManufacturerController
  ),
  showProduction: ManufacturerController.showProduction.bind(
    ManufacturerController
  ),
  showProducts: ManufacturerController.showProducts.bind(
    ManufacturerController
  ),
  showDistribution: ManufacturerController.showDistribution.bind(
    ManufacturerController
  ),
  showSales: ManufacturerController.showSales.bind(ManufacturerController),
  showOperations: ManufacturerController.showOperations.bind(
    ManufacturerController
  ),
  showAnalytics: ManufacturerController.showAnalytics.bind(
    ManufacturerController
  ),
  showSettings: ManufacturerController.showSettings.bind(
    ManufacturerController
  ),

  // Product Management Views
  showEditProduct: ManufacturerController.showEditProduct.bind(
    ManufacturerController
  ),
  showAddProduct: ManufacturerController.showAddProduct.bind(
    ManufacturerController
  ),
  showProductAnalytics: ManufacturerController.showProductAnalytics.bind(
    ManufacturerController
  ),
  showAnalytics: ManufacturerController.showAnalytics.bind(
    ManufacturerController
  ),

  // Draft/Publish functionality
  saveProductAsDraft: ManufacturerController.saveProductAsDraft.bind(
    ManufacturerController
  ),
  publishProduct: ManufacturerController.publishProduct.bind(
    ManufacturerController
  ),

  // Product Management APIs
  getProduct: ManufacturerController.getProduct.bind(ManufacturerController),
  updateProduct: ManufacturerController.updateProduct.bind(
    ManufacturerController
  ),
  createProduct: ManufacturerController.createProduct.bind(
    ManufacturerController
  ),
  deleteProduct: ManufacturerController.deleteProduct.bind(
    ManufacturerController
  ),
  uploadProductImages: ManufacturerController.uploadProductImages.bind(
    ManufacturerController
  ),

  // Dashboard APIs
  getDashboardStats: ManufacturerController.getDashboardStats.bind(
    ManufacturerController
  ),
  getProductionMetrics: ManufacturerController.getProductionMetrics.bind(
    ManufacturerController
  ),
  getProductionOrders: ManufacturerController.getProductionOrders.bind(
    ManufacturerController
  ),
  getSalesAnalytics: ManufacturerController.getSalesAnalytics.bind(
    ManufacturerController
  ),
  getEquipmentStatus: ManufacturerController.getEquipmentStatus.bind(
    ManufacturerController
  ),
  getQualityMetrics: ManufacturerController.getQualityMetrics.bind(
    ManufacturerController
  ),
  getNotifications: ManufacturerController.getNotifications.bind(
    ManufacturerController
  ),

  // Production Management APIs
  createProductionOrder: ManufacturerController.createProductionOrder.bind(
    ManufacturerController
  ),
  updateProductionStatus: ManufacturerController.updateProductionStatus.bind(
    ManufacturerController
  ),
  getProductionSchedule: ManufacturerController.getProductionSchedule.bind(
    ManufacturerController
  ),

  // Product Development APIs
  getProductPipeline: ManufacturerController.getProductPipeline.bind(
    ManufacturerController
  ),
  updateProductStatus: ManufacturerController.updateProductStatus.bind(
    ManufacturerController
  ),
  getProductLifecycle: ManufacturerController.getProductLifecycle.bind(
    ManufacturerController
  ),

  // Distribution APIs
  getDistributorPartners: ManufacturerController.getDistributorPartners.bind(
    ManufacturerController
  ),
  inviteDistributor: ManufacturerController.inviteDistributor.bind(
    ManufacturerController
  ),
  getChannelPerformance: ManufacturerController.getChannelPerformance.bind(
    ManufacturerController
  ),

  // Operations APIs
  getSupplyChainStatus: ManufacturerController.getSupplyChainStatus.bind(
    ManufacturerController
  ),
  getRawMaterialsInventory:
    ManufacturerController.getRawMaterialsInventory.bind(
      ManufacturerController
    ),

  // Analytics APIs
  getBusinessIntelligence: ManufacturerController.getBusinessIntelligence.bind(
    ManufacturerController
  ),
  getFinancialReports: ManufacturerController.getFinancialReports.bind(
    ManufacturerController
  ),
  getCostAnalysis: ManufacturerController.getCostAnalysis.bind(
    ManufacturerController
  ),
  getProfitabilityReport: ManufacturerController.getProfitabilityReport.bind(
    ManufacturerController
  ),

  // Export APIs
  exportProductionReport: ManufacturerController.exportProductionReport.bind(
    ManufacturerController
  ),
  exportSalesReport: ManufacturerController.exportSalesReport.bind(
    ManufacturerController
  ),
  exportFinancialReport: ManufacturerController.exportFinancialReport.bind(
    ManufacturerController
  ),

  // Product Analytics APIs
  getProductAnalytics: ManufacturerController.getProductAnalytics.bind(
    ManufacturerController
  ),
  getBusinessAnalytics: ManufacturerController.getBusinessAnalytics.bind(
    ManufacturerController
  ),
  exportProductReport: ManufacturerController.exportProductReport.bind(
    ManufacturerController
  ),
  exportBusinessReport: ManufacturerController.exportBusinessReport.bind(
    ManufacturerController
  ),

  // Dashboard Widget APIs
  getDistributorInquiries: ManufacturerController.getDistributorInquiries.bind(
    ManufacturerController
  ),
  getCommunicationCenter: ManufacturerController.getCommunicationCenter.bind(
    ManufacturerController
  ),
  getInventoryManagement: ManufacturerController.getInventoryManagement.bind(
    ManufacturerController
  ),

  // B2B Marketplace APIs
  getMarketplaceMetrics: ManufacturerController.getMarketplaceMetrics.bind(
    ManufacturerController
  ),
  getFeaturedProducts: ManufacturerController.getFeaturedProducts.bind(
    ManufacturerController
  ),
  getRecentInquiries: ManufacturerController.getRecentInquiries.bind(
    ManufacturerController
  ),
  getCompetitorAnalysis: ManufacturerController.getCompetitorAnalysis.bind(
    ManufacturerController
  ),
};

const router = express.Router();

// Enhanced security middleware for manufacturer dashboard
router.use(setSecurityHeaders);
router.use(enhancedManufacturerOnly);
router.use(preventCrossDashboardAccess);

// Apply JWT authentication and manufacturer-only access (backward compatibility)
router.use(authenticate);
router.use(manufacturerOnly);

// ===== DASHBOARD VIEW ROUTES =====
router.get("/dashboard", boundMethods.showDashboard);
router.get("/marketplace", boundMethods.showMarketplace);
router.get("/production", boundMethods.showProduction);
router.get("/products", boundMethods.showProducts);
router.get("/distribution", boundMethods.showDistribution);
router.get("/sales", boundMethods.showSales);
router.get("/operations", boundMethods.showOperations);
router.get("/analytics", boundMethods.showAnalytics);
router.get("/settings", boundMethods.showSettings);

// ===== DASHBOARD API ROUTES =====
router.get("/api/dashboard-stats", boundMethods.getDashboardStats);
router.get("/api/production-metrics", boundMethods.getProductionMetrics);
router.get("/api/production-orders", boundMethods.getProductionOrders);
router.get("/api/equipment-status", boundMethods.getEquipmentStatus);
router.get("/api/quality-metrics", boundMethods.getQualityMetrics);
router.get("/api/notifications", boundMethods.getNotifications);
router.get("/api/sales-analytics", boundMethods.getSalesAnalytics);

// ===== PRODUCTION MANAGEMENT API ROUTES =====
router.post("/api/production/orders", boundMethods.createProductionOrder);
router.put(
  "/api/production/orders/:orderId/status",
  boundMethods.updateProductionStatus
);
router.get("/api/production/schedule", boundMethods.getProductionSchedule);

// ===== PRODUCT DEVELOPMENT API ROUTES =====
router.get("/api/products/pipeline", boundMethods.getProductPipeline);
router.post("/api/products", boundMethods.createProduct);
router.put("/api/products/:productId/status", boundMethods.updateProductStatus);
router.get(
  "/api/products/:productId/lifecycle",
  boundMethods.getProductLifecycle
);

// ===== DISTRIBUTION API ROUTES =====
router.get("/api/distribution/partners", boundMethods.getDistributorPartners);
router.post(
  "/api/distribution/partners/invite",
  boundMethods.inviteDistributor
);
router.get(
  "/api/distribution/channel-performance",
  boundMethods.getChannelPerformance
);

// ===== OPERATIONS API ROUTES =====
router.get("/api/operations/supply-chain", boundMethods.getSupplyChainStatus);
router.get(
  "/api/operations/raw-materials",
  boundMethods.getRawMaterialsInventory
);

// ===== ANALYTICS ROUTES =====
router.get(
  "/analytics",
  authenticate,
  manufacturerOnly,
  boundMethods.showAnalytics
);

// ===== ANALYTICS API ROUTES =====
router.get(
  "/api/analytics/business-intelligence",
  boundMethods.getBusinessIntelligence
);
router.get(
  "/api/analytics/financial-reports",
  boundMethods.getFinancialReports
);
router.get("/api/analytics/cost-analysis", boundMethods.getCostAnalysis);
router.get("/api/analytics/profitability", boundMethods.getProfitabilityReport);

// ===== EXPORT API ROUTES =====
router.get("/api/export/production", boundMethods.exportProductionReport);
router.get("/api/export/sales", boundMethods.exportSalesReport);
router.get("/api/export/financial", boundMethods.exportFinancialReport);

// ===== PRODUCT ANALYTICS API ROUTES =====
router.get(
  "/api/product-analytics/:id",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.getProductAnalytics
);
router.get(
  "/api/business-analytics",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.getBusinessAnalytics
);
router.get(
  "/api/export/product-report/:id",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.exportProductReport
);
router.get(
  "/api/export/business-report",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.exportBusinessReport
);

// ===== DASHBOARD WIDGET API ROUTES =====
router.get("/api/distributor-inquiries", boundMethods.getDistributorInquiries);
router.get("/api/communication-center", boundMethods.getCommunicationCenter);
router.get("/api/messages", boundMethods.getCommunicationCenter); // Use communication center for messages
router.get("/api/inventory-management", boundMethods.getInventoryManagement);

// ===== B2B MARKETPLACE API ROUTES =====
router.get("/api/marketplace-metrics", boundMethods.getMarketplaceMetrics);
router.get("/api/featured-products", boundMethods.getFeaturedProducts);
router.get("/api/recent-inquiries", boundMethods.getRecentInquiries);
router.get("/api/competitor-analysis", boundMethods.getCompetitorAnalysis);

// ===== PRODUCT MANAGEMENT ROUTES =====
// Product Views (with authentication)
router.get(
  "/products/edit/:id",
  authenticate,
  manufacturerOnly,
  boundMethods.showEditProduct
);
router.get(
  "/products/add",
  authenticate,
  manufacturerOnly,
  boundMethods.showAddProduct
);
router.get(
  "/products/:id/analytics",
  authenticate,
  manufacturerOnly,
  boundMethods.showProductAnalytics
);

// Product API Routes (with authentication and validation)
router.get(
  "/api/products/:id",
  authenticate,
  manufacturerOnly,
  boundMethods.getProduct
);
router.put(
  "/api/products/:id",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.updateProduct
);
router.post(
  "/api/products",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.createProduct
);
router.delete(
  "/api/products/:id",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.deleteProduct
);
router.post(
  "/api/products/upload-images",
  authenticate,
  manufacturerOnly,
  upload.array("images", 10),
  boundMethods.uploadProductImages
);

// Draft/Publish API Routes
router.post(
  "/api/products/:id/save-draft",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.saveProductAsDraft
);
router.post(
  "/api/products/:id/publish",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.publishProduct
);

module.exports = router;
