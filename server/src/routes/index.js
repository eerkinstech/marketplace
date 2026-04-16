import { Router } from "express";
import authRoutes from "./auth/index.js";
import catalogRoutes from "./catalog/index.js";
import vendorRoutes from "./vendor/index.js";
import customerRoutes from "./customer/index.js";
import adminRoutes from "./admin/index.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Marketplace API is running" });
});
router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/vendor", vendorRoutes);
router.use("/customer", customerRoutes);
router.use("/admin", adminRoutes);

export default router;
