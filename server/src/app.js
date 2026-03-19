// import express from "express";
// import { connectDB } from "./db.js";
// import { config } from "./config.js";
// import { applySecurity } from "./middleware/security.js";

// import authRoutes from "./routes/auth.routes.js";
// import productsRoutes from "./routes/products.routes.js";
// import ordersRoutes from "./routes/orders.routes.js";
// import settingsRoutes from "./routes/settings.routes.js";
// import { seedProductsIfEmpty, ensureSettings, ensureAdminUser } from "./seed/seed.js";

// const app = express();
// applySecurity(app);
// app.use(express.json({ limit: "250kb" }));

// app.get("/api/health", (req, res) => res.json({ ok: true }));

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productsRoutes);
// app.use("/api/orders", ordersRoutes);
// app.use("/api/settings", settingsRoutes);

// app.use((err, req, res, next) => {
//   console.error("❌ Error:", err);
//   res.status(500).json({ message: "Server error" });
// });

// await connectDB();
// await seedProductsIfEmpty();
// await ensureSettings();



import express from "express";
import { connectDB } from "./db.js";
import { config } from "./config.js";
import { applySecurity } from "./middleware/security.js";

import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import {
  seedProductsIfEmpty,
  ensureSettings,
  ensureAdminUser,
} from "./seed/seed.js";

const app = express();

applySecurity(app);
app.use(express.json({ limit: "250kb" }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Express Error:", err);
  res.status(500).json({ message: "Server error" });
});

async function startServer() {
  try {
    console.log("Starting server...");
    console.log("MONGO_URI present:", !!config.mongoUri);
    console.log("NODE_ENV:", config.nodeEnv);
    console.log("PORT:", process.env.PORT);

    await connectDB();
    await seedProductsIfEmpty();
    await ensureSettings();
    await ensureAdminUser();

    const PORT = Number(process.env.PORT) || Number(config.port) || 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("🔥 Startup Error:", error);
    process.exit(1);
  }
}

startServer();
