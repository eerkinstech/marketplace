import { Router } from "express";
import {
  login,
  logout,
  profile,
  updateProfile,
  refresh,
  register
} from "../../controllers/auth/auth.controller.js";
import { protect } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema, updateProfileSchema } from "../../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, profile);
router.put("/me", protect, validate(updateProfileSchema), updateProfile);

export default router;
