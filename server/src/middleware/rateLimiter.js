import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const passthroughLimiter = (_req, _res, next) => next();
const isProduction = env.nodeEnv === "production";

export const apiLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false
    })
  : passthroughLimiter;

export const authLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false
    })
  : passthroughLimiter;
