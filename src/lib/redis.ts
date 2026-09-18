import "server-only";
import Redis from "ioredis";

// Explicit lifecycle: connect before use, disconnect when the operation is done.
export function createRedis() {
  if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required");
  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    commandTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    enableOfflineQueue: false,
  });
  // Callers handle rejected connect/command promises without exposing credentials.
  client.on("error", () => {});
  return client;
}
