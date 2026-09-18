import { getPrisma } from "@/lib/prisma";
import { createRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkDatabase() {
  await getPrisma().$queryRaw`SELECT 1`;
}

async function checkCache() {
  const redis = createRedis();
  try {
    await redis.connect();
    await redis.ping();
  } finally {
    redis.disconnect();
  }
}

export async function GET() {
  const results = await Promise.allSettled([checkDatabase(), checkCache()]);
  const ready = results.every((result) => result.status === "fulfilled");
  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
