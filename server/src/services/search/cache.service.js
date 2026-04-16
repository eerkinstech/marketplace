import { getRedisClient } from "../../config/redis.js";

export const withCache = async (key, ttlSeconds, producer) => {
  const redis = getRedisClient();

  if (!redis) return producer();

  await redis.connect().catch(() => {});
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const value = await producer();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return value;
};
