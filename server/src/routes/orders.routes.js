import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { Order } from "../models/Order.js";
import { Settings } from "../models/Settings.js";
import { calcDeliveryQuote } from "../utils/pincode.js";
import { Product } from "../models/Product.js";
import { config } from "../config.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 }).limit(100);
  res.json({ orders, upiId: config.upiId });
});

// Auth: used by checkout to compute delivery fee based on PINCODE or COORDINATES
router.post(
  "/delivery-quote",
  requireAuth,
  writeLimiter,
  validateBody(
    z.object({
      pincode: z.string().min(4).max(10),
      state: z.string().min(2).max(60).optional().default(""),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional()
    })
  ),
  async (req, res) => {
    const s = await Settings.findOne().lean();
    if (!s) return res.status(500).json({ message: "Shop settings missing" });
    const quote = calcDeliveryQuote(s, {
      pincode: req.body.pincode,
      state: req.body.state,
      latitude: req.body.latitude,
      longitude: req.body.longitude
    });
    res.json({ quote });
  }
);

router.post("/create", requireAuth, writeLimiter, validateBody(z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    qty: z.number().int().min(1).max(99)
  })).min(1),
  transactionId: z.string().min(4).max(64).optional().default(""),
  shippingAddress: z.object({
    name: z.string().min(2).max(60),
    phone: z.string().min(7).max(20),
    line1: z.string().min(3).max(120),
    area: z.string().max(80).optional().default(""),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    pincode: z.string().min(4).max(10),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional()
  })
})), async (req, res) => {
  const { items, transactionId } = req.body;

  const ids = items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const map = new Map(products.map(p => [String(p._id), p]));

  let amount = 0;
  const snapshot = [];
  for (const it of items) {
    const p = map.get(String(it.productId));
    if (!p) continue;
    const qty = Math.max(1, it.qty);
    amount += qty * Number(p.price);
    snapshot.push({ productId: p._id, title: p.title, qty, price: p.price });
  }
  if (snapshot.length === 0) return res.status(400).json({ message: "No valid products in cart" });

const s = await Settings.findOne().lean();
if (!s) return res.status(500).json({ message: "Shop settings missing" });

const ship = req.body.shippingAddress;
const { distanceKm, perKmRate, deliveryFee } = calcDeliveryQuote(s, {
  pincode: ship.pincode,
  state: ship.state,
  latitude: ship.latitude,
  longitude: ship.longitude
});
const subtotal = amount;
const total = subtotal + deliveryFee;


  const created = await Order.create({
    userId: req.user.sub,
    shippingAddress: ship,
    pricing: { subtotal, deliveryDistanceKm: distanceKm, deliveryFee, perKmRate, total },
    items: snapshot,
    amountRupees: total,
    currency: "INR",
    paymentMethod: "UPI",
    upiId: config.upiId,
    transactionId: transactionId || "",
    status: "PENDING"
  });

  res.status(201).json({ order: created });
});

router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(300);
  res.json({ orders });
});

router.put("/admin/:id/status", requireAuth, requireAdmin, writeLimiter, validateBody(z.object({
  status: z.enum(["PENDING","PAID","SHIPPED","DELIVERED","REJECTED","CANCELLED"]),
  adminRemark: z.string().max(240).optional().default(""),
  rejectReason: z.string().max(240).optional().default("")
})), async (req, res) => {
  const patch = { status: req.body.status };
  if (typeof req.body.adminRemark === "string") patch.adminRemark = req.body.adminRemark;
  if (typeof req.body.rejectReason === "string") patch.rejectReason = req.body.rejectReason;
  const updated = await Order.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!updated) return res.status(404).json({ message: "Order not found" });
  res.json({ order: updated });
});

export default router;
