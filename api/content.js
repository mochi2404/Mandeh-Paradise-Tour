import process from "node:process";
import { Redis } from "@upstash/redis";
import {
  defaultAdminOrders,
  emptySitePackages,
  defaultSiteSettings,
} from "../src/siteStore.js";

const CONTENT_KEY = "terravoyage:content";

function createFallbackContent() {
  return {
    packages: emptySitePackages,
    settings: defaultSiteSettings,
    orders: defaultAdminOrders,
    updatedAt: new Date().toISOString(),
  };
}

function getRedisClient() {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return Redis.fromEnv();
  }

  return null;
}

function getMemoryContent() {
  if (!globalThis.__terravoyageContent) {
    globalThis.__terravoyageContent = createFallbackContent();
  }

  return globalThis.__terravoyageContent;
}

async function readContent() {
  const redis = getRedisClient();

  if (!redis) {
    return getMemoryContent();
  }

  const content = await redis.get(CONTENT_KEY);
  return content ?? createFallbackContent();
}

async function writeContent(content) {
  const nextContent = {
    ...content,
    updatedAt: new Date().toISOString(),
  };

  const redis = getRedisClient();

  if (!redis) {
    globalThis.__terravoyageContent = nextContent;
    return nextContent;
  }

  await redis.set(CONTENT_KEY, nextContent);
  return nextContent;
}

function createJsonResponse(body, init = {}) {
  return Response.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    ...init,
  });
}

export async function GET() {
  const content = await readContent();
  return createJsonResponse(content);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const savedContent = await writeContent(body);
    return createJsonResponse(savedContent);
  } catch (error) {
    return createJsonResponse(
      {
        message: "Gagal menyimpan content store.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
