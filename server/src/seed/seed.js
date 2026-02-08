import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { config } from "../config.js";

const demo = [
  { title: "Luxury Sofa", mrp: 24999, discountPercent: 10, category: "Sofas", badge: "Best Seller", description: "Soft cushions + premium finish for a luxury living room.", stock: 8 },
  { title: "Fabric Sofa", mrp: 19999, discountPercent: 10, category: "Sofas", badge: "Trending", description: "Comfortable fabric sofa with modern look.", stock: 12 },
  { title: "Wooden Bed", mrp: 32999, discountPercent: 10, category: "Beds", badge: "Premium", description: "Strong solid wood bed with elegant design.", stock: 5 },
  { title: "King Size Bed", mrp: 38999, discountPercent: 15, category: "Beds", badge: "Hot", description: "Spacious king bed for perfect sleep.", stock: 4 },
  { title: "Dining Set (4 seater)", mrp: 15999, discountPercent: 10, category: "Dining", badge: "Value", description: "Perfect family meals with comfort and style.", stock: 9 },
  { title: "Office Chair", mrp: 6999, discountPercent: 0, category: "Chairs", badge: "Ergonomic", description: "Comfortable chair for long working hours.", stock: 15 },
  { title: "Modern Lamp", mrp: 999, discountPercent: 15, category: "Decor", badge: "New", description: "Warm light lamp for cozy vibes.", stock: 30 }
];

export async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(demo);
  console.log("🌱 Seeded demo products");
}

export async function ensureSettings() {
  const { Settings } = await import('../models/Settings.js');
  const existing = await Settings.findOne();
  if (existing) return;
  await Settings.create({
    shopPincode: config.shopPincode || "",
    rateUP: config.rateUP || 12,
    rateRajasthan: config.rateRajasthan || 14,
    rateOther: config.rateOther || 20,
    pincodeKmDivisor: config.pincodeKmDivisor || 100,
    minDeliveryFee: config.minDeliveryFee || 0,
    maxDeliveryFee: config.maxDeliveryFee || 999999,

    // legacy
    shopLat: config.shopLat || 0,
    shopLng: config.shopLng || 0,
    perKmRate: config.perKmRate || 0,
    shopAddress: config.shopAddress || "Raibha, Agra, Uttar Pradesh",
    currency: "INR"
  });
  console.log('🏪 Settings created');
}

export async function ensureAdminUser() {
  const email = config.adminEmail.toLowerCase();
  const { User } = await import('../models/User.js');
  
  // Delete existing admin user (to ensure password is synced with .env)
  await User.deleteOne({ email, isAdmin: true });
  
  // Create fresh admin user with current password from .env
  const passwordHash = await hashPassword(config.adminPassword);
  await User.create({ name: "Admin", email, passwordHash, isAdmin: true });
  console.log("👑 Admin user created/updated:", email);
}