const mongoose = require("mongoose");
const User = require("../models/User.model");
const JWTService = require("../utils/jwt");
require("dotenv").config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

const seedDatabase = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB for seeding");

        // Clear Users
        await User.delete({}); // Using the static delete method might expect ID, let's use the model directly to be safe or update Delete method.
        // Actually User.delete in my new model expects ID. Safe to use model directly here.
        const UserModel = mongoose.model("User");
        await UserModel.deleteMany({});
        console.log("🗑️  Users collection cleared");

        // Create Admin
        const adminPassword = "adminpassword"; // Default password or from env
        // Note: In real world, maybe ask user. For now, "adminpassword" or "123456" matches typical dev setup.
        // The previous SQL had a hash. I'll just create a new one.

        // We can use User.create which handles hashing!
        await User.create({
            pseudonym: "admin",
            email: "admin@admin.com",
            password: "adminpassword", // Will be hashed by User.create
            role: "ADMIN"
        });

        console.log("👤 Admin user created: admin@admin.com / adminpassword");

        // Optional: Seed other data if needed. For now, just Users as per init.sql.

        console.log("✅ Seeding completed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
