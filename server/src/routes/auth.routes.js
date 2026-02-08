import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { validateBody } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { config } from "../config.js";
import { setAuthCookie } from "../utils/cookies.js";
import { requireAuth } from "../middleware/auth.js";
import { generateOtp } from "../utils/otp.js";
import { sendResetOtpEmail } from "../utils/mailer.js";
const router = Router();

function signToken(user) {
  if (!config.jwtSecret) throw new Error("JWT_SECRET missing in .env");
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name, isAdmin: user.isAdmin },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

// ---------- Password auth ----------

router.post(
  "/signup",
  authLimiter,
  validateBody(
    z.object({
      name: z.string().min(2).max(60),
      email: z.string().email().max(120),
      password: z.string().min(8).max(72),
      phone: z.string().min(7).max(20).optional()
    })
  ),
  async (req, res) => {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash, phone: phone || undefined, isAdmin: false });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ message: "Signup success" });
  }
);

router.post(
  "/login",
  authLimiter,
  validateBody(
    z.object({
      email: z.string().email().max(120),
      password: z.string().min(8).max(72),
    })
  ),
  async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.passwordHash) {
      return res.status(400).json({ message: "This account uses Google sign-in. Please continue with Google." });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ message: "Login success", isAdmin: user.isAdmin });
  }
);

// ---------- Google auth (Google Identity Services -> credential JWT) ----------

const googleClient = new OAuth2Client(config.googleClientId || undefined);

router.post(
  "/google",
  authLimiter,
  validateBody(z.object({ credential: z.string().min(20) })),
  async (req, res) => {
    if (!config.googleClientId) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID missing in .env" });
    }

    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ message: "Google token missing email" });

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || "User";

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isAdmin: false,
      });
    } else {
      // Link google id if not present
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // Keep name fresh if user hasn't customized
      if (!user.name || user.name === "User") user.name = name;
      await user.save();
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ message: "Google login success", isAdmin: user.isAdmin });
  }
);

// ---------- Forgot password (OTP via email only) ----------

router.post(
  "/forgot/request",
  authLimiter,
  validateBody(
    z.object({
      email: z.string().email().max(120),
    })
  ),
  async (req, res) => {
    const email = req.body.email.toLowerCase();

    const user = await User.findOne({ email });
    // Always respond OK (avoid user enumeration)
    if (!user) return res.json({ message: "If an account exists, OTP has been sent." });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    user.resetOtpHash = otpHash;
    user.resetOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save();

    // Send OTP via email
    const { sendResetOtpEmail } = await import("../utils/mailer.js");
    await sendResetOtpEmail({ to: email, otp, name: user.name || "User" });

    return res.json({ message: "If an account exists, OTP has been sent." });
  }
);

router.post(
  "/forgot/reset",
  authLimiter,
  validateBody(
    z.object({
      email: z.string().email().max(120),
      otp: z.string().min(4).max(10),
      newPassword: z.string().min(6).max(120),
    })
  ),
  async (req, res) => {
    const email = req.body.email.toLowerCase();
    const { otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const expired = new Date(user.resetOtpExpiresAt).getTime() < Date.now();
    const ok = await bcrypt.compare(otp, user.resetOtpHash);
    if (!ok || expired) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  }
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
