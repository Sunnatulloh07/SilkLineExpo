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
const Category = require("../models/Category");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Inquiry = require("../models/Inquiry");

class ComprehensiveSeeder {
  constructor() {
    this.users = [];
    this.categories = [];
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
        Category.deleteMany({}),
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

  async seedCategories() {
    console.log("🏷️ Creating categories...");

    // Main categories with their subcategories
    const categoryData = [
      {
        name: "Textiles & Clothing",
        slug: "textiles-clothing",
        description: "High-quality textiles, fabrics, and clothing products for various industries",
        shortDescription: "Textiles, fabrics, and clothing",
        icon: "las la-tshirt",
        color: "#8B5CF6",
        subcategories: [
          {
            name: "Cotton Fabrics",
            slug: "cotton-fabrics",
            description: "Premium cotton fabrics for various applications",
            shortDescription: "High-quality cotton textiles",
            icon: "las la-leaf",
            color: "#10B981"
          },
          {
            name: "Synthetic Fabrics",
            slug: "synthetic-fabrics", 
            description: "Durable synthetic fabrics and materials",
            shortDescription: "Synthetic textile materials",
            icon: "las la-industry",
            color: "#6366F1"
          },
          {
            name: "Ready-made Garments",
            slug: "ready-made-garments",
            description: "Ready-to-wear clothing and garments",
            shortDescription: "Ready-made clothing",
            icon: "las la-tshirt",
            color: "#EC4899"
          }
        ]
      },
      {
        name: "Food & Beverages", 
        slug: "food-beverages",
        description: "Quality food products, beverages, and agricultural produce",
        shortDescription: "Food products and beverages",
        icon: "las la-apple-alt",
        color: "#F59E0B",
        subcategories: [
          {
            name: "Grains & Cereals",
            slug: "grains-cereals",
            description: "Wheat, rice, barley and other grain products",
            shortDescription: "Grain and cereal products",
            icon: "las la-seedling",
            color: "#D97706"
          },
          {
            name: "Flour Products",
            slug: "flour-products",
            description: "High-quality flour and flour-based products",
            shortDescription: "Flour and flour products",
            icon: "las la-bread-slice",
            color: "#92400E"
          },
          {
            name: "Processed Foods",
            slug: "processed-foods",
            description: "Processed and packaged food products",
            shortDescription: "Processed food items",
            icon: "las la-box",
            color: "#B45309"
          }
        ]
      },
      {
        name: "Electronics",
        slug: "electronics", 
        description: "Electronic components, devices, and industrial electronics",
        shortDescription: "Electronic products and components",
        icon: "las la-microchip",
        color: "#3B82F6",
        subcategories: [
          {
            name: "Display Systems",
            slug: "display-systems",
            description: "LED displays, monitors, and visual display systems",
            shortDescription: "Display and visual systems",
            icon: "las la-tv",
            color: "#1D4ED8"
          },
          {
            name: "Industrial Electronics",
            slug: "industrial-electronics",
            description: "Industrial electronic components and systems",
            shortDescription: "Industrial electronic equipment",
            icon: "las la-cogs",
            color: "#1E40AF"
          },
          {
            name: "Consumer Electronics",
            slug: "consumer-electronics",
            description: "Consumer electronic devices and accessories",
            shortDescription: "Consumer electronic products",
            icon: "las la-mobile-alt",
            color: "#2563EB"
          }
        ]
      },
      {
        name: "Machinery & Equipment",
        slug: "machinery-equipment",
        description: "Industrial machinery, equipment, and tools",
        shortDescription: "Machinery and industrial equipment",
        icon: "las la-tools",
        color: "#6B7280",
        subcategories: [
          {
            name: "Manufacturing Equipment",
            slug: "manufacturing-equipment",
            description: "Equipment for manufacturing and production",
            shortDescription: "Manufacturing machinery",
            icon: "las la-industry",
            color: "#4B5563"
          },
          {
            name: "Construction Equipment",
            slug: "construction-equipment",
            description: "Construction machinery and equipment",
            shortDescription: "Construction machinery",
            icon: "las la-hammer",
            color: "#374151"
          }
        ]
      },
      {
        name: "Chemicals",
        slug: "chemicals",
        description: "Industrial chemicals, raw materials, and chemical products",
        shortDescription: "Chemical products and materials",
        icon: "las la-flask",
        color: "#EF4444",
        subcategories: [
          {
            name: "Industrial Chemicals",
            slug: "industrial-chemicals",
            description: "Industrial chemical compounds and materials",
            shortDescription: "Industrial chemical products",
            icon: "las la-vial",
            color: "#DC2626"
          }
        ]
      },
      {
        name: "Agriculture",
        slug: "agriculture",
        description: "Agricultural products, seeds, and farming supplies",
        shortDescription: "Agricultural and farming products",
        icon: "las la-tractor",
        color: "#10B981",
        subcategories: [
          {
            name: "Seeds & Plants",
            slug: "seeds-plants",
            description: "Seeds, seedlings, and plant materials",
            shortDescription: "Seeds and plant materials",
            icon: "las la-seedling",
            color: "#059669"
          }
        ]
      }
    ];

    // Get first user as creator (super admin or first active user)
    const firstUser = this.users.find(u => u.status === 'active') || this.users[0];
    if (!firstUser) {
      throw new Error('No users available to create categories');
    }

    // Create main categories and their subcategories
    for (const catData of categoryData) {
      // Create main category
      const mainCategory = await Category.create({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        shortDescription: catData.shortDescription,
        icon: catData.icon,
        color: catData.color,
        level: 0,
        path: '',
        parentCategory: null,
        status: 'active',
        createdBy: firstUser._id,
        settings: {
          isActive: true,
          isVisible: true,
          isFeatured: true,
          allowProducts: true,
          sortOrder: 0
        }
      });

      this.categories.push(mainCategory);

      // Create subcategories
      if (catData.subcategories) {
        for (const subCatData of catData.subcategories) {
          const subcategory = await Category.create({
            name: subCatData.name,
            slug: subCatData.slug,
            description: subCatData.description,
            shortDescription: subCatData.shortDescription,
            icon: subCatData.icon,
            color: subCatData.color,
            level: 1,
            path: mainCategory.slug,
            parentCategory: mainCategory._id,
            status: 'active',
            createdBy: firstUser._id,
            settings: {
              isActive: true,
              isVisible: true,
              isFeatured: false,
              allowProducts: true,
              sortOrder: 0
            }
          });

          this.categories.push(subcategory);
        }
      }
    }

    console.log(`✅ Created ${this.categories.length} categories`);
  }

  // Helper method to find category by slug
  findCategoryBySlug(slug) {
    return this.categories.find(cat => cat.slug === slug);
  }

  async seedProducts() {

    const manufacturers = this.users.filter(
      (u) => u.companyType === "manufacturer" || u.companyType === "both"
    );

    console.log(`📦 Creating products for ${manufacturers.length} manufacturers...`);

    // Get category references
    const textilesCategory = this.findCategoryBySlug('textiles-clothing');
    const cottonFabricsSubcat = this.findCategoryBySlug('cotton-fabrics');
    const foodCategory = this.findCategoryBySlug('food-beverages');
    const flourProductsSubcat = this.findCategoryBySlug('flour-products');
    const electronicsCategory = this.findCategoryBySlug('electronics');
    const displaySystemsSubcat = this.findCategoryBySlug('display-systems');

    if (!textilesCategory || !foodCategory || !electronicsCategory) {
      throw new Error('Required categories not found! Make sure to seed categories first.');
    }

    const productTemplates = [
      // Textile Products
      {
        name: "Premium Cotton Fabric",
        description:
          "High-quality 100% cotton fabric suitable for clothing manufacturing. Soft texture, durable, and available in various colors.",
        shortDescription: "Premium 100% cotton fabric for clothing",
        category: textilesCategory._id,
        subcategory: cottonFabricsSubcat?._id,
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
        category: foodCategory._id,
        subcategory: flourProductsSubcat?._id,
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
        category: electronicsCategory._id,
        subcategory: displaySystemsSubcat?._id,
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
        // Determine product state randomly
        const rand = Math.random();
        let productState;
        
        if (rand < 0.6) {
          // 60% - Published to marketplace
          productState = {
            status: 'active',
            visibility: 'public',
            publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
            unpublishedAt: null
          };
        } else if (rand < 0.8) {
          // 20% - Draft
          productState = {
            status: 'draft',
            visibility: 'private',
            publishedAt: null,
            unpublishedAt: null
          };
        } else {
          // 20% - Unpublished from marketplace
          productState = {
            status: 'active',
            visibility: 'private',
            publishedAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)), // Was published
            unpublishedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))  // Unpublished in last 7 days
          };
        }

        const productData = {
          ...template,
          name: `${template.name} - ${manufacturer.companyName}`,
          manufacturer: manufacturer._id,
          ...productState,
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
        
        // Log product state for debugging
        const stateLabel = productState.status === 'draft' ? 'DRAFT' : 
                          (productState.visibility === 'public' ? 'MARKETPLACE' : 'UNPUBLISHED');
        console.log(`   📦 ${product.name.substring(0, 30)}... [${stateLabel}]`);

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
      await this.seedCategories();
      await this.seedProducts();
      await this.seedInquiries();
      await this.seedOrders();
      await this.seedReviews();
      await this.updateAnalytics();

      console.log("\n🎉 Database seeding completed successfully!");
      console.log("\n📊 Summary:");
      console.log(`   👑 Admins: 3`);
      console.log(`   🏭 Companies: ${this.users.length}`);
      console.log(`   🏷️ Categories: ${this.categories.length}`);
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
