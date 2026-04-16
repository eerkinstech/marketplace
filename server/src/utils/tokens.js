import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role, status: user.status },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id, version: user.tokenVersion || 0 }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
