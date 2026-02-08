import { Router } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", async (req, res) => {
  const { search = "", category = "" } = req.query;
  const q = {};
  if (category) q.category = category;

  if (search) {
    q.$or = [
      { title: { $regex: String(search), $options: "i" } },
      { description: { $regex: String(search), $options: "i" } }
    ];
  }

  const products = await Product.find(q).sort({ createdAt: -1 }).limit(200);
  res.json({ products });
});


const productSchema = z.object({
  title: z.string().min(2).max(80),

  // Admin inputs:
  mrp: z.number().int().min(1),
  discountPercent: z.number().int().min(0).max(95).optional().default(0),

  // Legacy support: allow price but ignore if mrp provided
  price: z.number().int().min(1).optional(),

  category: z.string().min(2).max(40),
  badge: z.string().max(40).optional().default(""),
  image: z.string().max(300).optional().default(""),
  description: z.string().max(300).optional().default(""),
  stock: z.number().int().min(0).optional().default(10)
});

router.post("/", requireAuth, requireAdmin, writeLimiter, validateBody(productSchema), async (req, res) => {
  const created = await Product.create(req.body);
  res.status(201).json({ product: created });
});

router.put("/:id", requireAuth, requireAdmin, writeLimiter, validateBody(productSchema), async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Product not found" });
  res.json({ product: updated });
});

router.delete("/:id", requireAuth, requireAdmin, writeLimiter, async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Deleted" });
});

export default router;
