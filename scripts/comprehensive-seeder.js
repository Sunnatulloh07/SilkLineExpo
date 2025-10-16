/**
 * Super Admin Seeder
 * Seeds the database with only super admin user
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Import Models
const Admin = require("../models/Admin");

class SuperAdminSeeder {
  constructor() {
    // No need for arrays since we're only creating super admin
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
      await Admin.deleteMany({});
      console.log("🗑️ Cleared existing admin records");
    } catch (error) {
      if (error.code === 13) {
        console.log("⚠️ Permission denied - continuing anyway");
      } else {
        throw error;
      }
    }
  }

  async seedSuperAdmin() {
    console.log("👑 Creating Super Admin...");

    const superAdmin = {
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
    };

    await Admin.create(superAdmin);
    console.log("✅ Super Admin created successfully");
  }

  async run() {
    try {
      console.log("🚀 Starting Super Admin Seeder...");

      await this.connect();
      await this.clearDatabase();
      await this.seedSuperAdmin();

      console.log("\n🎉 Super Admin seeding completed successfully!");
      console.log("\n🔑 Super Admin Credentials:");
      console.log("   Email: admin@slex.uz");
      console.log("   Password: admin123");
      console.log("   Role: super_admin");
      
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
  const seeder = new SuperAdminSeeder();
  seeder.run();
}

module.exports = SuperAdminSeeder;
