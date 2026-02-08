import { Router } from "express";
import { Settings } from "../models/Settings.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { z } from "zod";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Public: used by checkout for delivery pricing display
router.get("/public", async (req, res) => {
  const s = await Settings.findOne().lean();
  if (!s) return res.json({ settings: null });
  // expose only what checkout needs (pincode-based delivery)
  res.json({
    settings: {
      shopPincode: s.shopPincode,
      rateUP: s.rateUP,
      rateRajasthan: s.rateRajasthan,
      rateOther: s.rateOther,
      pincodeKmDivisor: s.pincodeKmDivisor,
      minDeliveryFee: s.minDeliveryFee,
      maxDeliveryFee: s.maxDeliveryFee,
      shopAddress: s.shopAddress,
      currency: s.currency
    }
  });
});

// Admin: view full settings
router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  const s = await Settings.findOne().lean();
  res.json({ settings: s });
});

router.put(
  "/admin",
  requireAuth,
  requireAdmin,
  writeLimiter,
  validateBody(
    z.object({
      shopPincode: z.string().max(10).optional().default(""),
      rateUP: z.number().min(0).max(1000),
      rateRajasthan: z.number().min(0).max(1000),
      rateOther: z.number().min(0).max(1000),
      pincodeKmDivisor: z.number().min(1).max(10000),
      minDeliveryFee: z.number().min(0).max(100000).optional().default(0),
      maxDeliveryFee: z.number().min(0).max(999999).optional().default(999999),
      shopAddress: z.string().max(200).optional().default(""),
      currency: z.string().max(5).optional().default("INR"),

      // legacy fields (optional)
      shopLat: z.number().optional(),
      shopLng: z.number().optional(),
      perKmRate: z.number().min(0).max(1000).optional()
    })
  ),
  async (req, res) => {
  const s = await Settings.findOne();
  if (!s) {
    const created = await Settings.create(req.body);
    return res.json({ settings: created });
  }

  s.shopPincode = req.body.shopPincode || s.shopPincode;
  s.rateUP = req.body.rateUP;
  s.rateRajasthan = req.body.rateRajasthan;
  s.rateOther = req.body.rateOther;
  s.pincodeKmDivisor = req.body.pincodeKmDivisor;
  s.minDeliveryFee = req.body.minDeliveryFee;
  s.maxDeliveryFee = req.body.maxDeliveryFee;
  s.shopAddress = req.body.shopAddress || s.shopAddress;
  s.currency = req.body.currency || s.currency;

  if (typeof req.body.shopLat === "number") s.shopLat = req.body.shopLat;
  if (typeof req.body.shopLng === "number") s.shopLng = req.body.shopLng;
  if (typeof req.body.perKmRate === "number") s.perKmRate = req.body.perKmRate;

  await s.save();
  res.json({ settings: s });
  }
);

export default router;
