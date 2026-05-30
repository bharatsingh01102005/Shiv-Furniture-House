import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },

    // For password login (optional if user signed up with Google)
    passwordHash: { type: String },

    // For Google sign-in
    googleId: { type: String, index: true },

    // Optional phone number for OTP (E.164 recommended, e.g. +9198xxxxxxx)
    phone: { type: String, trim: true },

    // Password reset OTP (stored hashed)
    resetOtpHash: { type: String },
    resetOtpExpiresAt: { type: Date },
    resetOtpChannel: { type: String, enum: ["email", "sms"], default: "email" },

    isAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
