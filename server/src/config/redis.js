import Redis from "ioredis";
import { env } from "./env.js";

let redisClient = null;

export const getRedisClient = () => {
  if (!env.redisUrl) return null;
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });
    redisClient.on("error", () => {});
  }
  return redisClient;
};
