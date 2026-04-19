import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL!;

  // Strip ?schema= — not needed: schema is baked into generated SQL via @@schema
  const url = new URL(rawUrl);
  url.searchParams.delete("schema");

  const pool = new pg.Pool({ connectionString: url.toString() });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Ленивая инициализация через Proxy: createPrismaClient() (и new URL())
// вызывается только при первом реальном обращении к prisma.xxx,
// а не при импорте модуля — это предотвращает падение во время сборки,
// когда DATABASE_URL ещё не задан.
let _client: PrismaClient | undefined;

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!_client) {
      _client = globalForPrisma.prisma ?? createPrismaClient();
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _client;
    }
    return Reflect.get(_client, prop);
  },
});
