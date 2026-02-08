import mongoose from "mongoose";

// Delivery is calculated using only PINCODE (no latitude/longitude required).
// We keep older fields (shopLat/shopLng/perKmRate) for backward compatibility
// but the app uses the new pincode-based fields.

const settingsSchema = new mongoose.Schema(
  {
    // New (pincode-based)
    shopPincode: { type: String, default: "" },

    // Rate per km (₹) by region
    rateUP: { type: Number, default: 12, min: 0, max: 1000 },
    rateRajasthan: { type: Number, default: 14, min: 0, max: 1000 },
    rateOther: { type: Number, default: 20, min: 0, max: 1000 },

    // Distance approximation from pincodes:
    // distanceKm = abs(destPincode - shopPincode) / pincodeKmDivisor
    // Example: divisor 100 => (302001 - 282001)/100 ≈ 200 km
    pincodeKmDivisor: { type: Number, default: 100, min: 1, max: 10000 },

    minDeliveryFee: { type: Number, default: 0, min: 0, max: 100000 },
    maxDeliveryFee: { type: Number, default: 999999, min: 0, max: 999999 },

    shopAddress: { type: String, default: "" },
    currency: { type: String, default: "INR" },

    // Old (legacy)
    shopLat: { type: Number, default: 0 },
    shopLng: { type: Number, default: 0 },
    perKmRate: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
