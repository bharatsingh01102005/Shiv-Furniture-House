import express from "express";
import { connectDB } from "./db.js";
import { config } from "./config.js";
import { applySecurity } from "./middleware/security.js";

import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import { seedProductsIfEmpty, ensureSettings, ensureAdminUser } from "./seed/seed.js";

const app = express();
applySecurity(app);
app.use(express.json({ limit: "250kb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({ message: "Server error" });
});

await connectDB();
await seedProductsIfEmpty();
await ensureSettings();
await ensureAdminUser();

const PORT = Number(config.port) || 3000;
app.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));
