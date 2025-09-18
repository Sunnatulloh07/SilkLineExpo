/**
 * Manufacturer Dashboard Routes
 * Professional B2B platform for manufacturers
 * Role-based access with comprehensive business features
 */

const express = require("express");
const multer = require("multer");
const ManufacturerControllerClass = require("../controllers/ManufacturerController");
const ManufacturerOrdersController = require("../controllers/ManufacturerOrdersController");
const MessagingController = require("../controllers/MessagingController");
const InquiryController = require("../controllers/InquiryController");
const { authenticate, manufacturerOnly } = require("../middleware/jwtAuth");
const {
  manufacturerOnly: enhancedManufacturerOnly,
  preventCrossDashboardAccess,
  validateManufacturerApiAccess,
  setSecurityHeaders,
} = require("../middleware/dashboardSecurity");
const { validationResult } = require("express-validator");

// Multer configuration for image uploads
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const logoUploadDir = path.join(__dirname, '../public/uploads/logos');
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // Different destinations based on field name
      if (file.fieldname === 'logo') {
        cb(null, logoUploadDir);
      } else {
        // For product images
        const productUploadDir = path.join(__dirname, '../public/uploads/products');
        if (!fs.existsSync(productUploadDir)) {
          fs.mkdirSync(productUploadDir, { recursive: true });
        }
        cb(null, productUploadDir);
      }
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      
      if (file.fieldname === 'logo') {
        // Logo filename: logo_manufacturer_id_timestamp.ext
        cb(null, `logo_${req.user.userId}_${uniqueSuffix}${ext}`);
      } else {
        // Product image filename
        cb(null, `product_${uniqueSuffix}${ext}`);
      }
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Faqat JPG, PNG, GIF, WebP formatdagi rasmlar qabul qilinadi"),
        false
      );
    }
  },
});

// Multer configuration for inquiry attachments (documents, images, etc.)
const uploadAttachments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain", "text/csv"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Faqat hujjat va rasm fayllari qabul qilinadi"), false);
    }
  },
});

// Multer configuration for messaging attachments (more flexible)
const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for attachments
    files: 1, // Single file upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("File type not supported. Allowed: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX"),
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
const inquiryController = new InquiryController();
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

  // Settings API methods
  loadSettings: ManufacturerController.loadSettings.bind(
    ManufacturerController
  ),
  saveCompanyInfo: ManufacturerController.saveCompanyInfo.bind(
    ManufacturerController
  ),
  saveContactInfo: ManufacturerController.saveContactInfo.bind(
    ManufacturerController
  ),
  saveBusinessInfo: ManufacturerController.saveBusinessInfo.bind(
    ManufacturerController
  ),
  changePassword: ManufacturerController.changePassword.bind(
    ManufacturerController
  ),
  savePreferences: ManufacturerController.savePreferences.bind(
    ManufacturerController
  ),
  saveIntegrations: ManufacturerController.saveIntegrations.bind(
    ManufacturerController
  ),
  uploadLogo: ManufacturerController.uploadLogo.bind(
    ManufacturerController
  ),
  autoSaveSettings: ManufacturerController.autoSaveSettings.bind(
    ManufacturerController
  ),

  // Profile methods
  showProfile: ManufacturerController.showProfile.bind(
    ManufacturerController
  ),
  getProfileData: ManufacturerController.getProfileData.bind(
    ManufacturerController
  ),
  getRecentProducts: ManufacturerController.getRecentProducts.bind(
    ManufacturerController
  ),
  getRecentOrders: ManufacturerController.getRecentOrders.bind(
    ManufacturerController
  ),
  getChartData: ManufacturerController.getChartData.bind(
    ManufacturerController
  ),
  getProductAnalyticsData: ManufacturerController.getProductAnalyticsData.bind(
    ManufacturerController
  ),
  getBusinessAnalyticsData: ManufacturerController.getBusinessAnalyticsData.bind(
    ManufacturerController
  ),

  // Support methods
  showSupport: ManufacturerController.showSupport.bind(
    ManufacturerController
  ),

  // Shipping methods
  showShipping: ManufacturerController.showShipping.bind(
    ManufacturerController
  ),

  // Inventory methods
  showInventory: ManufacturerController.showInventory.bind(
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
  uploadImagesFinal: ManufacturerController.uploadImagesFinal.bind(
    ManufacturerController
  ),
  deleteUnusedImages: ManufacturerController.deleteUnusedImages.bind(
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
  getMarketplaceChartData: ManufacturerController.getMarketplaceChartData.bind(
    ManufacturerController
  ),
  getCompetitorAnalysis: ManufacturerController.getCompetitorAnalysis.bind(
    ManufacturerController
  ),

  // Orders Management
  showOrdersPage: ManufacturerOrdersController.showOrdersPage.bind(
    ManufacturerOrdersController
  ),
  showOrderDetails: ManufacturerOrdersController.showOrderDetails.bind(
    ManufacturerOrdersController
  ),
  showOrderEdit: ManufacturerOrdersController.showOrderEdit.bind(
    ManufacturerOrdersController
  ),
  debugOrderData: ManufacturerOrdersController.debugOrderData.bind(
    ManufacturerOrdersController
  ),

  // Inquiries Management
  showInquiriesPage: inquiryController.showInquiriesPage.bind(inquiryController),
  getInquiriesList: inquiryController.getInquiriesList.bind(inquiryController),
  getInquiriesStats: inquiryController.getInquiriesStats.bind(inquiryController),
  getInquiryAnalytics: inquiryController.getInquiryAnalytics.bind(inquiryController),
  getInquiry: inquiryController.getInquiry.bind(inquiryController),
  respondToInquiry: inquiryController.respondToInquiry.bind(inquiryController),
  sendQuickQuote: inquiryController.sendQuickQuote.bind(inquiryController),
  updateInquiryStatus: inquiryController.updateInquiryStatus.bind(inquiryController),
  archiveInquiry: inquiryController.archiveInquiry.bind(inquiryController),
  deleteInquiry: inquiryController.deleteInquiry.bind(inquiryController),
  duplicateInquiry: inquiryController.duplicateInquiry.bind(inquiryController),
  setInquiryPriority: inquiryController.setInquiryPriority.bind(inquiryController),
  addInquiryNote: inquiryController.addInquiryNote.bind(inquiryController),
  exportInquiry: inquiryController.exportInquiry.bind(inquiryController),

  // Messages API
  getUnreadMessagesCount: ManufacturerController.getUnreadMessagesCount.bind(ManufacturerController),
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
router.get("/orders", boundMethods.showOrdersPage);
router.get("/orders/:orderId", boundMethods.showOrderDetails);
router.get("/orders/:orderId/debug", boundMethods.debugOrderData);
router.get("/orders/:orderId/edit", boundMethods.showOrderEdit);
router.get("/distribution", boundMethods.showDistribution);
router.get("/sales", boundMethods.showSales);
router.get("/operations", boundMethods.showOperations);
router.get("/analytics", boundMethods.showAnalytics);
router.get("/settings", boundMethods.showSettings);

// ===== SETTINGS API ROUTES =====
router.get("/settings/load", validateManufacturerApiAccess, boundMethods.loadSettings);
router.put("/settings/company", validateManufacturerApiAccess, boundMethods.saveCompanyInfo);
router.put("/settings/contact", validateManufacturerApiAccess, boundMethods.saveContactInfo);
router.put("/settings/business", validateManufacturerApiAccess, boundMethods.saveBusinessInfo);
router.put("/settings/change-password", validateManufacturerApiAccess, boundMethods.changePassword);
router.put("/settings/preferences", validateManufacturerApiAccess, boundMethods.savePreferences);
router.put("/settings/integrations", validateManufacturerApiAccess, boundMethods.saveIntegrations);
router.post("/settings/upload-logo", validateManufacturerApiAccess, upload.single('logo'), boundMethods.uploadLogo);
router.put("/settings/auto-save", validateManufacturerApiAccess, boundMethods.autoSaveSettings);

// ===== PROFILE ROUTES =====
router.get("/profile", boundMethods.showProfile);
router.get("/profile/api/data", validateManufacturerApiAccess, boundMethods.getProfileData);
router.get("/profile/api/recent-products", validateManufacturerApiAccess, boundMethods.getRecentProducts);
router.get("/profile/api/recent-orders", validateManufacturerApiAccess, boundMethods.getRecentOrders);
router.get("/profile/api/chart-data", validateManufacturerApiAccess, boundMethods.getChartData);

// ===== SUPPORT ROUTES =====
router.get("/support", boundMethods.showSupport);
router.get("/shipping", boundMethods.showShipping);
router.get("/inventory", boundMethods.showInventory);

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
router.post("/api/products/create", authenticate, manufacturerOnly, validateManufacturerApiAccess, boundMethods.createProduct);
router.post("/api/products/save-draft", authenticate, manufacturerOnly, validateManufacturerApiAccess, boundMethods.saveProductAsDraft);
router.post("/api/products/publish", authenticate, manufacturerOnly, validateManufacturerApiAccess, boundMethods.publishProduct);
router.post("/api/products/upload-images", authenticate, manufacturerOnly, validateManufacturerApiAccess, boundMethods.uploadProductImages);
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
// Note: /api/messages route moved to Messages API Routes section
router.get("/api/inventory-management", boundMethods.getInventoryManagement);

// ===== B2B MARKETPLACE API ROUTES =====
router.get("/api/marketplace-metrics", boundMethods.getMarketplaceMetrics);
router.get("/api/featured-products", boundMethods.getFeaturedProducts);
router.get("/api/recent-inquiries", boundMethods.getRecentInquiries);
router.get("/api/marketplace-chart", boundMethods.getMarketplaceChartData);
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

// PROFESSIONAL Image Management Endpoints
router.post(
  "/api/products/upload-images-final",
  authenticate,
  manufacturerOnly,
  upload.array("images", 10),
  boundMethods.uploadImagesFinal
);

router.post(
  "/api/products/delete-images",
  authenticate,
  manufacturerOnly,
  validateManufacturerApiAccess,
  boundMethods.deleteUnusedImages
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

// ===== MESSAGING ROUTES =====
// Professional B2B Communication System
router.get('/messages', 
  authenticate,
  manufacturerOnly,
  MessagingController.showMessagingPage
);



router.get('/messages/api/conversations',
  authenticate,
  manufacturerOnly,
  MessagingController.getConversations
);

router.get('/messages/api/order/:orderId/messages',
  authenticate,
  manufacturerOnly,
  MessagingController.getOrderMessages
);

router.post('/messages/api/order/:orderId/mark-read',
  authenticate,
  manufacturerOnly,
  MessagingController.markOrderMessagesAsRead
);

// All messaging routes moved to manufacturer-messaging.js for better organization
// This prevents route conflicts and centralizes messaging functionality

router.post('/messages/api/upload',
  authenticate,
  manufacturerOnly,
  uploadAttachment.single('file'),
  MessagingController.uploadAttachment
);

// ===== INQUIRIES MANAGEMENT ROUTES =====
router.get("/inquiries", 
  authenticate,
  manufacturerOnly,
  boundMethods.showInquiriesPage
);
router.get("/inquiries/api/list", validateManufacturerApiAccess, boundMethods.getInquiriesList);
router.get("/inquiries/api/stats", validateManufacturerApiAccess, boundMethods.getInquiriesStats);
router.get("/inquiries/api/analytics", validateManufacturerApiAccess, boundMethods.getInquiryAnalytics);
router.get("/inquiries/api/:inquiryId", validateManufacturerApiAccess, boundMethods.getInquiry);
router.post("/inquiries/:inquiryId/respond", validateManufacturerApiAccess, uploadAttachments.array('attachments', 5), boundMethods.respondToInquiry);
router.post("/inquiries/:inquiryId/quick-quote", validateManufacturerApiAccess, boundMethods.sendQuickQuote);
router.patch("/inquiries/:inquiryId/status", validateManufacturerApiAccess, boundMethods.updateInquiryStatus);
router.patch("/inquiries/:inquiryId/priority", validateManufacturerApiAccess, boundMethods.setInquiryPriority);
router.post("/inquiries/:inquiryId/note", validateManufacturerApiAccess, boundMethods.addInquiryNote);
router.post("/inquiries/:inquiryId/duplicate", validateManufacturerApiAccess, boundMethods.duplicateInquiry);
router.post("/inquiries/:inquiryId/archive", validateManufacturerApiAccess, boundMethods.archiveInquiry);
router.get("/inquiries/:inquiryId/export", validateManufacturerApiAccess, boundMethods.exportInquiry);
router.delete("/inquiries/:inquiryId", validateManufacturerApiAccess, boundMethods.deleteInquiry);

// ===== MESSAGES API ROUTES =====
router.get("/api/unread-messages-count", validateManufacturerApiAccess, boundMethods.getUnreadMessagesCount);
router.get("/api/messages", validateManufacturerApiAccess, MessagingController.getHeaderMessages);
router.post("/api/messages/mark-all-read", validateManufacturerApiAccess, MessagingController.markAllMessagesAsRead);
router.post("/api/messages/mark-read", validateManufacturerApiAccess, MessagingController.markMessageAsRead);

// ===== ORDERS API ROUTES =====
router.get("/api/orders", validateManufacturerApiAccess, boundMethods.getRecentOrders);
router.post("/api/orders/mark-all-read", validateManufacturerApiAccess, MessagingController.markAllOrdersAsRead);
router.post("/api/orders/mark-read", validateManufacturerApiAccess, MessagingController.markOrderAsRead);

// ===== INQUIRIES API ROUTES =====
router.post("/api/inquiries/mark-all-read", validateManufacturerApiAccess, MessagingController.markAllInquiriesAsRead);
router.post("/api/inquiries/mark-read", validateManufacturerApiAccess, MessagingController.markInquiryAsRead);

// ===== NOTIFICATIONS API ROUTES =====
router.post("/api/notifications/mark-all-read", validateManufacturerApiAccess, MessagingController.markAllNotificationsAsRead);

// ===== ANALYTICS API ROUTES =====
router.get("/analytics/api/product-data", validateManufacturerApiAccess, boundMethods.getProductAnalyticsData);
router.get("/analytics/api/business-data", validateManufacturerApiAccess, boundMethods.getBusinessAnalyticsData);

// ===== MARKETPLACE API ROUTES =====
// Include marketplace specific routes
router.use('/api/manufacturer/products', require('./api/manufacturer-products'));
router.use('/api/manufacturer/orders', require('./api/manufacturer-orders'));
router.use('/api/manufacturer/orders', require('./api/manufacturer-orders-detail'));

module.exports = router;
