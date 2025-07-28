/**
 * Comprehensive Database Seeder
 * Seeds the database with realistic B2B platform data
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import Models
const Admin = require("../models/Admin");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Inquiry = require("../models/Inquiry");

class ComprehensiveSeeder {
  constructor() {
    this.users = [];
    this.products = [];
    this.orders = [];
    this.reviews = [];
    this.inquiries = [];
  }

  async connect() {
    try {
      // Try different MongoDB connection options
      const mongoUris = [
        process.env.MONGODB_URI,
        "mongodb://localhost:27017/slex-db",
      ].filter(Boolean);

      let connected = false;
      let lastError;

      for (const uri of mongoUris) {
        try {
          await mongoose.connect(uri);
          connected = true;
          break;
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!connected) {
        throw lastError;
      }
    } catch (error) {
      console.error(
        "❌ All MongoDB connection attempts failed:",
        error.message
      );
      process.exit(1);
    }
  }

  async clearDatabase() {
    try {
      await Promise.all([
        Admin.deleteMany({}),
        User.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({}),
        Review.deleteMany({}),
        Inquiry.deleteMany({}),
      ]);
    } catch (error) {
      if (error.code === 13) {
      } else {
        throw error;
      }
    }
  }

  async seedAdmins() {

    const admins = [
      {
        _id: "60c72b2f9b1e8c001c8e4d5a", // Fixed ID to match routes/admin.js
        name: "Super Admin",
        email: "admin@slex.uz",
        password: "admin123",
        role: "super_admin",
        status: "active",
        permissions: {
          canApproveUsers: true,
          canManageAdmins: true,
          canViewReports: true,
          canManageContent: true,
          canManageSystem: true,
        },
      },
      {
        name: "Content Manager",
        email: "content@slex.uz",
        password: "content123",
        role: "admin",
        status: "active",
        permissions: {
          canApproveUsers: true,
          canManageAdmins: false,
          canViewReports: true,
          canManageContent: true,
          canManageSystem: false,
        },
      },
      {
        name: "Support Manager",
        email: "support@slex.uz",
        password: "support123",
        role: "moderator",
        status: "active",
        permissions: {
          canApproveUsers: false,
          canManageAdmins: false,
          canViewReports: true,
          canManageContent: false,
          canManageSystem: false,
        },
      },
    ];

    for (const adminData of admins) {
      await Admin.create(adminData);
    }

  }

  async seedUsers() {

    const companies = [
      // Manufacturers
      {
        companyName: "Uzbek Cotton Mills",
        email: "info@uzbekcotton.uz",
        password: "password123",
        phone: "+998901234567",
        taxNumber: "123456789",
        activityType: "textiles_clothing",
        companyType: "manufacturer",
        country: "Uzbekistan",
        city: "Tashkent",
        address: "Yunusabad District, Tashkent",
        website: "https://uzbekcotton.uz",
        socialMedia: {
          linkedin: "uzbek-cotton-mills",
          telegram: "@uzbekcotton",
        },
        status: "active",
        establishedYear: 1995,
        employeeCount: "201-500",
        annualRevenue: "5m+",
        businessLicense: "UZ-MFG-001-2023",
        manufacturingCapabilities: ["textile_production"],
        distributionCapabilities: [], // Empty for manufacturers
        certifications: [
          {
            name: "ISO 9001",
            issuedBy: "ISO",
            issuedDate: new Date("2023-01-15"),
            expiryDate: new Date("2026-01-15"),
            certificateNumber: "ISO9001-2023-001",
          },
        ],
      },
      {
        companyName: "Almaty Food Processing",
        email: "contact@almatyfood.kz",
        password: "password123",
        phone: "+77012345678",
        taxNumber: "987654321",
        activityType: "food_beverages",
        companyType: "manufacturer",
        country: "Kazakhstan",
        city: "Almaty",
        address: "Industrial Zone, Almaty",
        status: "active",
        establishedYear: 2001,
        employeeCount: "51-200",
        annualRevenue: "1m-5m",
        manufacturingCapabilities: ["food_processing"],
        distributionCapabilities: [], // Empty for manufacturers
        certifications: [
          {
            name: "HACCP",
            issuedBy: "Food Safety Authority",
            issuedDate: new Date("2023-03-10"),
            expiryDate: new Date("2025-03-10"),
            certificateNumber: "HACCP-2023-002",
          },
        ],
      },
      {
        companyName: "Beijing Electronics Co",
        email: "sales@beijingelectronics.cn",
        password: "password123",
        phone: "+8613812345678",
        taxNumber: "456789123",
        activityType: "electronics",
        companyType: "manufacturer",
        country: "China",
        city: "Beijing",
        address: "Zhongguancun, Beijing",
        status: "active",
        establishedYear: 1998,
        employeeCount: "500+",
        annualRevenue: "5m+",
        manufacturingCapabilities: ["electronics_assembly"],
        distributionCapabilities: [], // Empty for manufacturers
        certifications: [
          {
            name: "CE Marking",
            issuedBy: "European Conformity",
            issuedDate: new Date("2023-02-20"),
            expiryDate: new Date("2025-02-20"),
            certificateNumber: "CE-2023-003",
          },
        ],
      },
      // Distributors
      {
        companyName: "Central Asia Distribution",
        email: "orders@cadistribution.uz",
        password: "password123",
        phone: "+998901234568",
        taxNumber: "789123456",
        activityType: "food_beverages",
        companyType: "distributor",
        country: "Uzbekistan",
        city: "Samarkand",
        address: "Registan District, Samarkand",
        website: "https://cadistribution.uz",
        socialMedia: {
          telegram: "@cadistribution",
        },
        status: "active",
        establishedYear: 2010,
        employeeCount: "11-50",
        annualRevenue: "500k-1m",
        businessLicense: "UZ-DIST-002-2023",
        manufacturingCapabilities: [], // Empty for distributors
        distributionCapabilities: ["regional_distribution", "cold_chain"],
      },
      {
        companyName: "Silk Road Traders",
        email: "info@silkroadtraders.kz",
        password: "password123",
        phone: "+77012345679",
        taxNumber: "321654987",
        activityType: "textiles_clothing",
        companyType: "distributor",
        country: "Kazakhstan",
        city: "Nur-Sultan",
        address: "Business District, Nur-Sultan",
        status: "active",
        establishedYear: 2015,
        employeeCount: "51-200",
        annualRevenue: "1m-5m",
        manufacturingCapabilities: [], // Empty for distributors
        distributionCapabilities: ["international_export", "bulk_handling"],
      },
      // Mixed Companies
      {
        companyName: "Tajik Agro Industries",
        email: "business@tajikagroindustries.tj",
        password: "password123",
        phone: "+992901234567",
        taxNumber: "654987321",
        activityType: "agriculture",
        companyType: "manufacturer",
        country: "Tajikistan",
        city: "Dushanbe",
        address: "Agricultural Zone, Dushanbe",
        status: "active",
        establishedYear: 2005,
        employeeCount: "201-500",
        annualRevenue: "1m-5m",
        manufacturingCapabilities: ["agricultural_processing"],
        distributionCapabilities: [
          "local_distribution",
          "regional_distribution",
        ],
      },
      // Pending Approval Companies
      {
        companyName: "New Tech Solutions",
        email: "contact@newtechsolutions.uz",
        password: "password123",
        phone: "+998901234569",
        taxNumber: "147258369",
        activityType: "electronics",
        companyType: "manufacturer",
        country: "Uzbekistan",
        city: "Bukhara",
        address: "Tech Park, Bukhara",
        status: "pending",
        establishedYear: 2023,
        employeeCount: "1-10",
        annualRevenue: "under-100k",
        manufacturingCapabilities: ["electronics_assembly"],
        distributionCapabilities: [], // Empty for manufacturers
      },
    ];

    for (const companyData of companies) {
      const user = await User.create(companyData);
      this.users.push(user);
    }

  }

  async seedProducts() {

    const manufacturers = this.users.filter(
      (u) => u.companyType === "manufacturer" || u.companyType === "both"
    );

    const productTemplates = [
      // Textile Products
      {
        name: "Premium Cotton Fabric",
        description:
          "High-quality 100% cotton fabric suitable for clothing manufacturing. Soft texture, durable, and available in various colors.",
        shortDescription: "Premium 100% cotton fabric for clothing",
        category: "textiles_clothing",
        subcategory: "Cotton Fabrics",
        specifications: [
          { name: "Material", value: "100% Cotton", unit: "" },
          { name: "Weight", value: "150", unit: "GSM" },
          { name: "Width", value: "150", unit: "cm" },
        ],
        pricing: {
          basePrice: 12.5,
          currency: "USD",
          priceType: "fixed",
          minimumOrderQuantity: 100,
          bulkPricing: [
            { minQuantity: 500, maxQuantity: 999, price: 11.5, discount: 8 },
            { minQuantity: 1000, maxQuantity: null, price: 10.5, discount: 16 },
          ],
        },
        inventory: {
          totalStock: 5000,
          availableStock: 4500,
          unit: "meters",
          lowStockThreshold: 500,
        },
        shipping: {
          weight: 0.5,
          dimensions: { length: 150, width: 10, height: 10, unit: "cm" },
          packagingType: "Roll",
          shippingClass: "standard",
          leadTime: { min: 7, max: 14 },
        },
        qualityStandards: ["ISO9001", "GOST"],
        tags: ["cotton", "fabric", "textile", "clothing"],
        status: "active",
        visibility: "public",
      },
      // Food Products
      {
        name: "Organic Wheat Flour",
        description:
          "Premium organic wheat flour milled from carefully selected wheat grains. Perfect for bread, pastries, and other baked goods.",
        shortDescription: "Premium organic wheat flour for baking",
        category: "food_beverages",
        subcategory: "Flour & Grains",
        specifications: [
          { name: "Protein Content", value: "12-14", unit: "%" },
          { name: "Moisture", value: "Max 14", unit: "%" },
          { name: "Ash Content", value: "Max 0.55", unit: "%" },
        ],
        pricing: {
          basePrice: 0.85,
          currency: "USD",
          priceType: "fixed",
          minimumOrderQuantity: 1000,
          bulkPricing: [
            { minQuantity: 5000, maxQuantity: 9999, price: 0.78, discount: 8 },
            {
              minQuantity: 10000,
              maxQuantity: null,
              price: 0.72,
              discount: 15,
            },
          ],
        },
        inventory: {
          totalStock: 50000,
          availableStock: 45000,
          unit: "kg",
          lowStockThreshold: 5000,
        },
        shipping: {
          weight: 25,
          dimensions: { length: 60, width: 40, height: 15, unit: "cm" },
          packagingType: "Bag",
          shippingClass: "standard",
          leadTime: { min: 3, max: 7 },
        },
        qualityStandards: ["HACCP", "ISO9001"],
        tags: ["organic", "wheat", "flour", "baking"],
        status: "active",
        visibility: "public",
      },
      // Electronics
      {
        name: "Industrial LED Display Panel",
        description:
          "High-resolution LED display panel designed for industrial applications. Weather-resistant and energy-efficient.",
        shortDescription: "Industrial-grade LED display panel",
        category: "electronics",
        subcategory: "Display Systems",
        specifications: [
          { name: "Resolution", value: "1920x1080", unit: "pixels" },
          { name: "Brightness", value: "5000", unit: "nits" },
          { name: "Power Consumption", value: "150", unit: "W" },
        ],
        pricing: {
          basePrice: 850.0,
          currency: "USD",
          priceType: "negotiable",
          minimumOrderQuantity: 10,
          bulkPricing: [
            { minQuantity: 50, maxQuantity: 99, price: 780.0, discount: 8 },
            { minQuantity: 100, maxQuantity: null, price: 720.0, discount: 15 },
          ],
        },
        inventory: {
          totalStock: 200,
          availableStock: 180,
          unit: "pieces",
          lowStockThreshold: 20,
        },
        shipping: {
          weight: 15,
          dimensions: { length: 120, width: 80, height: 10, unit: "cm" },
          packagingType: "Protective Case",
          shippingClass: "fragile",
          leadTime: { min: 14, max: 21 },
        },
        qualityStandards: ["CE", "ISO14001"],
        tags: ["LED", "display", "industrial", "electronics"],
        status: "active",
        visibility: "public",
      },
    ];

    for (const manufacturer of manufacturers) {
      // Create 2-5 products per manufacturer
      const productCount = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < productCount; i++) {
        const template = productTemplates[i % productTemplates.length];
        const productData = {
          ...template,
          name: `${template.name} - ${manufacturer.companyName}`,
          manufacturer: manufacturer._id,
          // Randomize some values
          pricing: {
            ...template.pricing,
            basePrice: template.pricing.basePrice * (0.8 + Math.random() * 0.4),
          },
          inventory: {
            ...template.inventory,
            totalStock: Math.floor(
              template.inventory.totalStock * (0.5 + Math.random())
            ),
            availableStock: Math.floor(
              template.inventory.availableStock * (0.5 + Math.random())
            ),
          },
        };

        const product = await Product.create(productData);
        this.products.push(product);

        // Update manufacturer's product count
        manufacturer.totalProducts += 1;
        await manufacturer.save();
      }
    }

  }

  async seedInquiries() {

    const distributors = this.users.filter(
      (u) => u.companyType === "distributor" || u.companyType === "both"
    );

    const manufacturers = this.users.filter(
      (u) => u.companyType === "manufacturer" || u.companyType === "both"
    );

    const inquiryTemplates = [
      {
        type: "product_inquiry",
        subject: "Bulk Order Inquiry for Cotton Fabric",
        message:
          "We are interested in placing a bulk order for cotton fabric. Please provide pricing and availability details.",
        requestedQuantity: 5000,
        unit: "meters",
        budgetRange: { min: 50000, max: 70000, currency: "USD" },
        timeline: {
          urgency: "within_month",
          requiredBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        priority: "high",
      },
      {
        type: "quote_request",
        subject: "RFQ for Organic Wheat Flour",
        message:
          "Request for quotation for organic wheat flour. Need competitive pricing for regular supply.",
        requestedQuantity: 10000,
        unit: "kg",
        budgetRange: { min: 7000, max: 9000, currency: "USD" },
        timeline: {
          urgency: "within_week",
          requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        priority: "urgent",
      },
      {
        type: "custom_order",
        subject: "Custom LED Display Requirements",
        message:
          "Looking for custom LED displays with specific dimensions and features for our project.",
        requestedQuantity: 50,
        unit: "pieces",
        budgetRange: { min: 35000, max: 45000, currency: "USD" },
        timeline: {
          urgency: "flexible",
          requiredBy: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        priority: "medium",
      },
    ];

    for (let i = 0; i < 15; i++) {
      const template = inquiryTemplates[i % inquiryTemplates.length];
      const inquirer =
        distributors[Math.floor(Math.random() * distributors.length)];
      const supplier =
        manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const product =
        this.products[Math.floor(Math.random() * this.products.length)];

      // Generate inquiry number
      const year = new Date().getFullYear();
      const inquiryNumber = `INQ-${year}-${String(i + 1).padStart(6, "0")}`;

      const inquiryData = {
        ...template,
        inquiryNumber,
        inquirer: inquirer._id,
        supplier: supplier._id,
        product: product._id,
        shipping: {
          method: "freight",
          destination: {
            country: inquirer.country,
            city: inquirer.city,
            address: inquirer.address,
          },
          incoterms: "CIF",
        },
      };

      const inquiry = await Inquiry.create(inquiryData);
      this.inquiries.push(inquiry);
    }

  }

  async seedOrders() {

    const distributors = this.users.filter(
      (u) => u.companyType === "distributor" || u.companyType === "both"
    );

    const orderStatuses = [
      "confirmed",
      "processing",
      "manufacturing",
      "shipped",
      "delivered",
      "completed",
    ];

    for (let i = 0; i < 10; i++) {
      const buyer =
        distributors[Math.floor(Math.random() * distributors.length)];
      const product =
        this.products[Math.floor(Math.random() * this.products.length)];
      const seller = await User.findById(product.manufacturer);

      const quantity = Math.floor(Math.random() * 1000) + 100;
      const unitPrice = product.pricing.basePrice;
      const totalPrice = quantity * unitPrice;

      // Generate order number
      const year = new Date().getFullYear();
      const orderNumber = `ORD-${year}-${String(i + 1).padStart(6, "0")}`;

      const orderData = {
        orderNumber,
        buyer: buyer._id,
        seller: seller._id,
        items: [
          {
            product: product._id,
            quantity,
            unitPrice,
            totalPrice,
            specifications: product.specifications.slice(0, 2),
          },
        ],
        subtotal: totalPrice,
        taxAmount: totalPrice * 0.1,
        shippingCost: 500,
        totalAmount: totalPrice + totalPrice * 0.1 + 500,
        currency: "USD",
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        shipping: {
          method: "freight",
          address: {
            street: buyer.address,
            city: buyer.city,
            country: buyer.country,
            contactPerson: buyer.companyName,
            contactPhone: buyer.phone,
          },
          estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        payment: {
          method: "bank_transfer",
          terms: "net_30",
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      };

      const order = await Order.create(orderData);
      this.orders.push(order);

      // Update user statistics
      buyer.totalOrders += 1;
      seller.totalOrders += 1;

      if (order.status === "completed") {
        buyer.completedOrders += 1;
        seller.completedOrders += 1;
      }

      await buyer.save();
      await seller.save();
    }

  }

  async seedReviews() {

    const completedOrders = this.orders.filter((o) => o.status === "completed");

    for (const order of completedOrders) {
      // Product review
      const productReview = {
        reviewType: "product",
        reviewer: order.buyer,
        product: order.items[0].product,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        title: "Great product quality",
        content:
          "Excellent product quality and fast delivery. Highly recommended for bulk orders.",
        detailedRatings: {
          quality: Math.floor(Math.random() * 2) + 4,
          delivery: Math.floor(Math.random() * 2) + 4,
          communication: Math.floor(Math.random() * 2) + 4,
          value: Math.floor(Math.random() * 2) + 4,
        },
        status: "approved",
        isVerifiedPurchase: true,
      };

      // Company review
      const companyReview = {
        reviewType: "company",
        reviewer: order.buyer,
        company: order.seller,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        title: "Professional service",
        content:
          "Professional company with excellent customer service and reliable delivery.",
        detailedRatings: {
          quality: Math.floor(Math.random() * 2) + 4,
          delivery: Math.floor(Math.random() * 2) + 4,
          communication: Math.floor(Math.random() * 2) + 4,
          service: Math.floor(Math.random() * 2) + 4,
        },
        status: "approved",
        isVerifiedPurchase: true,
      };

      const productReviewDoc = await Review.create(productReview);
      const companyReviewDoc = await Review.create(companyReview);

      this.reviews.push(productReviewDoc, companyReviewDoc);

      // Update product and company ratings
      const product = await Product.findById(order.items[0].product);
      const company = await User.findById(order.seller);

      product.totalReviews += 1;
      product.averageRating =
        (product.averageRating * (product.totalReviews - 1) +
          productReview.rating) /
        product.totalReviews;
      await product.save();

      company.totalReviews += 1;
      company.averageRating =
        (company.averageRating * (company.totalReviews - 1) +
          companyReview.rating) /
        company.totalReviews;
      await company.save();
    }

  }

  async updateAnalytics() {

    // Update product analytics
    for (const product of this.products) {
      product.analytics.views = Math.floor(Math.random() * 500) + 50;
      product.analytics.inquiries = Math.floor(Math.random() * 20) + 5;
      product.analytics.orders = Math.floor(Math.random() * 10) + 1;
      await product.save();
    }

  }

  async run() {
    try {

      await this.connect();
      await this.clearDatabase();

      await this.seedAdmins();
      await this.seedUsers();
      await this.seedProducts();
      await this.seedInquiries();
      await this.seedOrders();
      await this.seedReviews();
      await this.updateAnalytics();

      console.log("\n🎉 Database seeding completed successfully!");
      console.log("\n📊 Summary:");
      console.log(`   👑 Admins: 3`);
      console.log(`   🏭 Companies: ${this.users.length}`);
      console.log(`   📦 Products: ${this.products.length}`);
      console.log(`   💬 Inquiries: ${this.inquiries.length}`);
      console.log(`   📋 Orders: ${this.orders.length}`);
      console.log(`   ⭐ Reviews: ${this.reviews.length}`);

      console.log("\n🔑 Admin Credentials:");
      console.log("   Super Admin: admin@slex.uz / admin123");
      console.log("   Content Manager: content@slex.uz / content123");
      console.log("   Support Manager: support@slex.uz / support123");

      console.log("\n🏢 Sample Company Credentials:");
      console.log("   Manufacturer: info@uzbekcotton.uz / password123");
      console.log("   Distributor: orders@cadistribution.uz / password123");
    } catch (error) {
      console.error("❌ Seeding failed:", error);
    } finally {
      await mongoose.disconnect();
      console.log("👋 Disconnected from MongoDB");
      process.exit(0);
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new ComprehensiveSeeder();
  seeder.run();
}

module.exports = ComprehensiveSeeder;
