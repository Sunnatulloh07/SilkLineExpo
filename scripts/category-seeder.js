/**
 * Category Seeder
 * Seeds the database with comprehensive category data
 * Professional B2B Marketplace Categories
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import Models
const Category = require("../models/Category");
const Admin = require("../models/Admin");

class CategorySeeder {
  constructor() {
    this.categories = [
      // Oziq-ovqat va Ichimliklar
      {
        name: "Food & Beverages",
        slug: "food-beverages",
        description: "Food products, beverages, and agricultural solutions",
        translations: {
          uz: {
            name: "Oziq-ovqat va Ichimliklar",
            description: "Oziq-ovqat mahsulotlari, ichimliklar va qishloq xo'jaligi yechimlari"
          },
          en: {
            name: "Food & Beverages",
            description: "Food products, beverages, and agricultural solutions"
          },
          ru: {
            name: "Продукты питания и Напитки",
            description: "Продукты питания, напитки и сельскохозяйственные решения"
          },
          tr: {
            name: "Gıda ve İçecekler",
            description: "Gıda ürünleri, içecekler ve tarımsal çözümler"
          },
          fa: {
            name: "غذا و نوشیدنی",
            description: "محصولات غذایی، نوشیدنی‌ها و راه‌حل‌های کشاورزی"
          },
          zh: {
            name: "食品和饮料",
            description: "食品、饮料和农业解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Oziq-ovqat va Ichimliklar - SLEX Marketplace",
            metaDescription: "Eng yaxshi oziq-ovqat mahsulotlari va ichimliklar",
            metaKeywords: ["oziq-ovqat", "ichimliklar", "qishloq xo'jaligi", "mahsulotlar"]
          },
          en: {
            metaTitle: "Food & Beverages - SLEX Marketplace",
            metaDescription: "Best food products, beverages, and agricultural solutions",
            metaKeywords: ["food", "beverages", "agricultural", "products"]
          },
          ru: {
            metaTitle: "Продукты питания и Напитки - SLEX Marketplace",
            metaDescription: "Лучшие продукты питания, напитки и сельскохозяйственные решения",
            metaKeywords: ["продукты", "напитки", "сельское хозяйство", "товары"]
          }
        },
        icon: "las la-apple-alt",
        color: "#F59E0B",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 1
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 5,
          supportedCurrencies: ["USD", "UZS"],
          requireCertifications: true
        }
      },

      // To'qimachilik va Kiyim
      {
        name: "Textiles & Apparel",
        slug: "textiles-apparel",
        description: "Textile products, fabrics, and apparel manufacturing solutions",
        translations: {
          uz: {
            name: "To'qimachilik va Kiyim",
            description: "Matolar, gazlama va kiyim ishlab chiqarish yechimlari"
          },
          en: {
            name: "Textiles & Apparel",
            description: "Textile products, fabrics, and apparel manufacturing solutions"
          },
          ru: {
            name: "Текстиль и Одежда",
            description: "Текстильные изделия, ткани и решения для производства одежды"
          },
          tr: {
            name: "Tekstil ve Giyim",
            description: "Tekstil ürünleri, kumaşlar ve giyim üretim çözümleri"
          },
          fa: {
            name: "منسوجات و پوشاک",
            description: "محصولات نساجی، پارچه‌ها و راه‌حل‌های تولید پوشاک"
          },
          zh: {
            name: "纺织品和服装",
            description: "纺织品、面料和服装制造解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "To'qimachilik va Kiyim - SLEX Marketplace",
            metaDescription: "Eng yaxshi matolar, gazlama va kiyim ishlab chiqarish yechimlari",
            metaKeywords: ["to'qimachilik", "kiyim", "gazlama", "ishlab chiqarish"]
          },
          en: {
            metaTitle: "Textiles & Apparel - SLEX Marketplace",
            metaDescription: "Best textile products, fabrics, and apparel manufacturing solutions",
            metaKeywords: ["textiles", "apparel", "fabrics", "manufacturing"]
          },
          ru: {
            metaTitle: "Текстиль и Одежда - SLEX Marketplace",
            metaDescription: "Лучшие текстильные изделия, ткани и решения для производства одежды",
            metaKeywords: ["текстиль", "одежда", "ткани", "производство"]
          }
        },
        icon: "las la-tshirt",
        color: "#10B981",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 2
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 10,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Elektronika
      {
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices, components, and technology solutions",
        translations: {
          uz: {
            name: "Elektronika",
            description: "Elektron qurilmalar, komponentlar va texnologiya yechimlari"
          },
          en: {
            name: "Electronics",
            description: "Electronic devices, components, and technology solutions"
          },
          ru: {
            name: "Электроника",
            description: "Электронные устройства, компоненты и технологические решения"
          },
          tr: {
            name: "Elektronik",
            description: "Elektronik cihazlar, bileşenler ve teknoloji çözümleri"
          },
          fa: {
            name: "الکترونیک",
            description: "دستگاه‌های الکترونیکی، اجزاء و راه‌حل‌های فناوری"
          },
          zh: {
            name: "电子",
            description: "电子设备、组件和技术解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Elektronika - SLEX Marketplace",
            metaDescription: "Eng yaxshi elektron qurilmalar va texnologiya yechimlari",
            metaKeywords: ["elektronika", "qurilmalar", "komponentlar", "texnologiya"]
          },
          en: {
            metaTitle: "Electronics - SLEX Marketplace",
            metaDescription: "Best electronic devices and technology solutions",
            metaKeywords: ["electronics", "devices", "components", "technology"]
          },
          ru: {
            metaTitle: "Электроника - SLEX Marketplace",
            metaDescription: "Лучшие электронные устройства и технологические решения",
            metaKeywords: ["электроника", "устройства", "компоненты", "технологии"]
          }
        },
        icon: "las la-microchip",
        color: "#3B82F6",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 3
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Texnika va Uskunalar
      {
        name: "Machinery & Equipment",
        slug: "machinery-equipment",
        description: "Industrial machinery, equipment, and manufacturing solutions",
        translations: {
          uz: {
            name: "Texnika va Uskunalar",
            description: "Sanoat mashinalari, uskunalar va ishlab chiqarish yechimlari"
          },
          en: {
            name: "Machinery & Equipment",
            description: "Industrial machinery, equipment, and manufacturing solutions"
          },
          ru: {
            name: "Техника и Оборудование",
            description: "Промышленные машины, оборудование и производственные решения"
          },
          tr: {
            name: "Makine ve Ekipmanlar",
            description: "Endüstriyel makineler, ekipmanlar ve üretim çözümleri"
          },
          fa: {
            name: "ماشین‌آلات و تجهیزات",
            description: "ماشین‌آلات صنعتی، تجهیزات و راه‌حل‌های تولید"
          },
          zh: {
            name: "机械和设备",
            description: "工业机械、设备和制造解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Texnika va Uskunalar - SLEX Marketplace",
            metaDescription: "Eng yaxshi sanoat mashinalari va ishlab chiqarish yechimlari",
            metaKeywords: ["texnika", "uskunalar", "mashinalar", "ishlab chiqarish"]
          },
          en: {
            metaTitle: "Machinery & Equipment - SLEX Marketplace",
            metaDescription: "Best industrial machinery and manufacturing solutions",
            metaKeywords: ["machinery", "equipment", "industrial", "manufacturing"]
          },
          ru: {
            metaTitle: "Техника и Оборудование - SLEX Marketplace",
            metaDescription: "Лучшие промышленные машины и производственные решения",
            metaKeywords: ["техника", "оборудование", "машины", "производство"]
          }
        },
        icon: "las la-cogs",
        color: "#6B7280",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 4
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Kimyo Sanoati
      {
        name: "Chemical Industry",
        slug: "chemical-industry",
        description: "Chemical products, raw materials, and industrial chemicals",
        translations: {
          uz: {
            name: "Kimyo Sanoati",
            description: "Kimyo mahsulotlari, xom ashyolar va sanoat kimyoviy moddalari"
          },
          en: {
            name: "Chemical Industry",
            description: "Chemical products, raw materials, and industrial chemicals"
          },
          ru: {
            name: "Химическая Промышленность",
            description: "Химические продукты, сырье и промышленные химикаты"
          },
          tr: {
            name: "Kimya Sanayi",
            description: "Kimya ürünleri, hammaddeler ve endüstriyel kimyasallar"
          },
          fa: {
            name: "صنایع شیمیایی",
            description: "محصولات شیمیایی، مواد خام و مواد شیمیایی صنعتی"
          },
          zh: {
            name: "化学工业",
            description: "化学产品、原材料和工业化学品"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Kimyo Sanoati - SLEX Marketplace",
            metaDescription: "Eng yaxshi kimyo mahsulotlari va sanoat kimyoviy moddalari",
            metaKeywords: ["kimyo", "sanoat", "mahsulotlar", "xom ashyolar"]
          },
          en: {
            metaTitle: "Chemical Industry - SLEX Marketplace",
            metaDescription: "Best chemical products and industrial chemicals",
            metaKeywords: ["chemical", "industry", "products", "raw materials"]
          },
          ru: {
            metaTitle: "Химическая Промышленность - SLEX Marketplace",
            metaDescription: "Лучшие химические продукты и промышленные химикаты",
            metaKeywords: ["химическая", "промышленность", "продукты", "сырье"]
          }
        },
        icon: "las la-flask",
        color: "#8B5CF6",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 5
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"],
          requireCertifications: true
        }
      },

      // Qishloq Xo'jaligi
      {
        name: "Agriculture",
        slug: "agriculture",
        description: "Agricultural equipment, farming tools, and agricultural solutions",
        translations: {
          uz: {
            name: "Qishloq Xo'jaligi",
            description: "Qishloq xo'jaligi asboblari, fermerlik qurollari va qishloq xo'jaligi yechimlari"
          },
          en: {
            name: "Agriculture",
            description: "Agricultural equipment, farming tools, and agricultural solutions"
          },
          ru: {
            name: "Сельское Хозяйство",
            description: "Сельскохозяйственное оборудование, фермерские инструменты и сельскохозяйственные решения"
          },
          tr: {
            name: "Tarım",
            description: "Tarım ekipmanları, çiftçilik araçları ve tarımsal çözümler"
          },
          fa: {
            name: "کشاورزی",
            description: "تجهیزات کشاورزی، ابزار مزرعه‌داری و راه‌حل‌های کشاورزی"
          },
          zh: {
            name: "农业",
            description: "农业设备、农具和农业解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Qishloq Xo'jaligi - SLEX Marketplace",
            metaDescription: "Eng yaxshi qishloq xo'jaligi asboblari va fermerlik yechimlari",
            metaKeywords: ["qishloq xo'jaligi", "fermerlik", "asboblar", "equipment"]
          },
          en: {
            metaTitle: "Agriculture - SLEX Marketplace",
            metaDescription: "Best agricultural equipment and farming solutions",
            metaKeywords: ["agriculture", "farming", "equipment", "tools"]
          },
          ru: {
            metaTitle: "Сельское Хозяйство - SLEX Marketplace",
            metaDescription: "Лучшее сельскохозяйственное оборудование и фермерские решения",
            metaKeywords: ["сельское хозяйство", "фермерство", "оборудование", "инструменты"]
          }
        },
        icon: "las la-seedling",
        color: "#059669",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 6
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Qurilish Materiallari
      {
        name: "Construction Materials",
        slug: "construction-materials",
        description: "Construction materials, building supplies, and infrastructure solutions",
        translations: {
          uz: {
            name: "Qurilish Materiallari",
            description: "Qurilish materiallari, binolar uchun materiallar va infratuzilma yechimlari"
          },
          en: {
            name: "Construction Materials",
            description: "Construction materials, building supplies, and infrastructure solutions"
          },
          ru: {
            name: "Строительные Материалы",
            description: "Строительные материалы, стройматериалы и инфраструктурные решения"
          },
          tr: {
            name: "İnşaat Malzemeleri",
            description: "İnşaat malzemeleri, yapı malzemeleri ve altyapı çözümleri"
          },
          fa: {
            name: "مصالح ساختمانی",
            description: "مصالح ساختمانی، مواد ساختمانی و راه‌حل‌های زیرساختی"
          },
          zh: {
            name: "建筑材料",
            description: "建筑材料、建筑用品和基础设施解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Qurilish Materiallari - SLEX Marketplace",
            metaDescription: "Eng yaxshi qurilish materiallari va infratuzilma yechimlari",
            metaKeywords: ["qurilish", "materiallar", "binolar", "infratuzilma"]
          },
          en: {
            metaTitle: "Construction Materials - SLEX Marketplace",
            metaDescription: "Best construction materials and infrastructure solutions",
            metaKeywords: ["construction", "materials", "building", "infrastructure"]
          },
          ru: {
            metaTitle: "Строительные Материалы - SLEX Marketplace",
            metaDescription: "Лучшие строительные материалы и инфраструктурные решения",
            metaKeywords: ["строительство", "материалы", "здания", "инфраструктура"]
          }
        },
        icon: "las la-hammer",
        color: "#EF4444",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 7
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Avtomobil Sanoati
      {
        name: "Automotive Industry",
        slug: "automotive-industry",
        description: "Automotive parts, vehicles, and transportation solutions",
        translations: {
          uz: {
            name: "Avtomobil Sanoati",
            description: "Avtomobil qismlari, transport vositalari va transport yechimlari"
          },
          en: {
            name: "Automotive Industry",
            description: "Automotive parts, vehicles, and transportation solutions"
          },
          ru: {
            name: "Автомобильная Промышленность",
            description: "Автозапчасти, транспортные средства и транспортные решения"
          },
          tr: {
            name: "Otomotiv Sanayi",
            description: "Otomotiv parçaları, araçlar ve ulaşım çözümleri"
          },
          fa: {
            name: "صنعت خودرو",
            description: "قطعات خودرو، وسایل نقلیه و راه‌حل‌های حمل و نقل"
          },
          zh: {
            name: "汽车工业",
            description: "汽车零部件、车辆和交通解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Avtomobil Sanoati - SLEX Marketplace",
            metaDescription: "Eng yaxshi avtomobil qismlari va transport yechimlari",
            metaKeywords: ["avtomobil", "sanoat", "qismlar", "transport"]
          },
          en: {
            metaTitle: "Automotive Industry - SLEX Marketplace",
            metaDescription: "Best automotive parts and transportation solutions",
            metaKeywords: ["automotive", "industry", "parts", "transportation"]
          },
          ru: {
            metaTitle: "Автомобильная Промышленность - SLEX Marketplace",
            metaDescription: "Лучшие автозапчасти и транспортные решения",
            metaKeywords: ["автомобильная", "промышленность", "запчасти", "транспорт"]
          }
        },
        icon: "las la-car",
        color: "#8B5CF6",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 8
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      },

      // Farmasevtika
      {
        name: "Pharmaceuticals",
        slug: "pharmaceuticals",
        description: "Medical equipment, healthcare products, and pharmaceutical solutions",
        translations: {
          uz: {
            name: "Farmasevtika",
            description: "Tibbiy asboblar, sog'liqni saqlash mahsulotlari va farmatsevtika yechimlari"
          },
          en: {
            name: "Pharmaceuticals",
            description: "Medical equipment, healthcare products, and pharmaceutical solutions"
          },
          ru: {
            name: "Фармацевтика",
            description: "Медицинское оборудование, продукты здравоохранения и фармацевтические решения"
          },
          tr: {
            name: "Eczacılık",
            description: "Tıbbi ekipmanlar, sağlık ürünleri ve farmasötik çözümler"
          },
          fa: {
            name: "داروسازی",
            description: "تجهیزات پزشکی، محصولات بهداشتی و راه‌حل‌های دارویی"
          },
          zh: {
            name: "制药",
            description: "医疗设备、保健产品和制药解决方案"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Farmasevtika - SLEX Marketplace",
            metaDescription: "Eng yaxshi tibbiy asboblar va sog'liqni saqlash mahsulotlari",
            metaKeywords: ["farmasevtika", "tibbiy", "sog'liq", "asboblar"]
          },
          en: {
            metaTitle: "Pharmaceuticals - SLEX Marketplace",
            metaDescription: "Best medical equipment and healthcare products",
            metaKeywords: ["pharmaceuticals", "medical", "healthcare", "equipment"]
          },
          ru: {
            metaTitle: "Фармацевтика - SLEX Marketplace",
            metaDescription: "Лучшее медицинское оборудование и продукты здравоохранения",
            metaKeywords: ["фармацевтика", "медицинское", "здравоохранение", "оборудование"]
          }
        },
        icon: "las la-stethoscope",
        color: "#EC4899",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 9
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"],
          requireCertifications: true
        }
      },

      // Boshqa
      {
        name: "Other",
        slug: "other",
        description: "Other products and services not covered by main categories",
        translations: {
          uz: {
            name: "Boshqa",
            description: "Asosiy kategoriyalar qamrab olmagan boshqa mahsulotlar va xizmatlar"
          },
          en: {
            name: "Other",
            description: "Other products and services not covered by main categories"
          },
          ru: {
            name: "Другое",
            description: "Другие продукты и услуги, не охваченные основными категориями"
          },
          tr: {
            name: "Diğer",
            description: "Ana kategoriler tarafından kapsanmayan diğer ürünler ve hizmetler"
          },
          fa: {
            name: "سایر",
            description: "سایر محصولات و خدمات که توسط دسته‌بندی‌های اصلی پوشش داده نمی‌شوند"
          },
          zh: {
            name: "其他",
            description: "主要类别未涵盖的其他产品和服务"
          }
        },
        seoTranslations: {
          uz: {
            metaTitle: "Boshqa - SLEX Marketplace",
            metaDescription: "Boshqa mahsulotlar va xizmatlar",
            metaKeywords: ["boshqa", "mahsulotlar", "xizmatlar", "kategoriya"]
          },
          en: {
            metaTitle: "Other - SLEX Marketplace",
            metaDescription: "Other products and services",
            metaKeywords: ["other", "products", "services", "category"]
          },
          ru: {
            metaTitle: "Другое - SLEX Marketplace",
            metaDescription: "Другие продукты и услуги",
            metaKeywords: ["другое", "продукты", "услуги", "категория"]
          }
        },
        icon: "las la-ellipsis-h",
        color: "#9CA3AF",
        settings: {
          isActive: true,
          isVisible: true,
          allowProducts: true,
          sortOrder: 10
        },
        businessRules: {
          allowedCompanyTypes: ["manufacturer", "distributor"],
          minimumOrderQuantity: 1,
          supportedCurrencies: ["USD", "UZS", "EUR"]
        }
      }
    ];
  }

  async connect() {
    try {
      const mongoUris = [
        process.env.MONGODB_URI,
        "mongodb://admin:password123@localhost:27017/slex-db?authSource=admin",
        "mongodb://localhost:27017/slex-db"
      ].filter(Boolean);

      let connected = false;
      let lastError;

      for (const uri of mongoUris) {
        try {
          await mongoose.connect(uri);
          connected = true;
          console.log("✅ MongoDB'ga ulandi");
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
      console.error("❌ MongoDB ulanish xatosi:", error.message);
      process.exit(1);
    }
  }

  async clearCategories() {
    try {
      await Category.deleteMany({});
      console.log("🗑️ Mavjud kategoriyalar o'chirildi");
    } catch (error) {
      console.log("⚠️ Kategoriyalarni o'chirishda xatolik:", error.message);
    }
  }

  async getSuperAdmin() {
    try {
      const admin = await Admin.findOne({ email: "admin@slex.uz" });
      if (!admin) {
        throw new Error("Super admin topilmadi. Avval super admin yarating.");
      }
      return admin._id;
    } catch (error) {
      console.error("❌ Super admin topilmadi:", error.message);
      throw error;
    }
  }

  async seedCategories() {
    console.log("📂 Kategoriyalar yaratilmoqda...");
    
    const superAdminId = await this.getSuperAdmin();
    
    for (let i = 0; i < this.categories.length; i++) {
      const categoryData = this.categories[i];
      
      try {
        const category = new Category({
          ...categoryData,
          createdBy: superAdminId,
          lastModifiedBy: superAdminId,
          status: "active"
        });

        await category.save();
        console.log(`✅ ${i + 1}. ${categoryData.translations.uz.name} kategoriyasi yaratildi`);
      } catch (error) {
        console.error(`❌ ${categoryData.translations.uz.name} kategoriyasini yaratishda xatolik:`, error.message);
      }
    }
  }

  async run() {
    try {
      console.log("🚀 Category Seeder ishga tushmoqda...");
      
      await this.connect();
      await this.clearCategories();
      await this.seedCategories();

      console.log("\n🎉 Barcha kategoriyalar muvaffaqiyatli yaratildi!");
      console.log(`📊 Jami ${this.categories.length} ta kategoriya yaratildi`);
      
      // Kategoriyalarni ko'rsatish
      const createdCategories = await Category.find({}).select('name slug status');
      console.log("\n📋 Yaratilgan kategoriyalar:");
      createdCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - ${cat.status}`);
      });

    } catch (error) {
      console.error("❌ Seeding xatosi:", error);
    } finally {
      await mongoose.disconnect();
      console.log("👋 MongoDB'dan uzildi");
      process.exit(0);
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new CategorySeeder();
  seeder.run();
}

module.exports = CategorySeeder;
