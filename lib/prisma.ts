import { PrismaClient } from '@prisma/client';

// Local dev runs on SQLite, which has no native Json column type (unlike the
// Postgres target used in production). These fields are declared as String in
// schema.prisma for SQLite compatibility; this extension transparently
// stringifies on write and parses on read so the rest of the app can keep
// treating `issues` / `stats` as plain objects/arrays.
const JSON_FIELDS = ['issues', 'stats', 'chatHistory'] as const;

function parseJsonFields<T extends Record<string, unknown>>(record: T | null): T | null {
  if (!record) return record;
  for (const field of JSON_FIELDS) {
    const value = record[field];
    if (typeof value === 'string') {
      try {
        (record as Record<string, unknown>)[field] = JSON.parse(value);
      } catch {
        // leave as-is if it's not valid JSON
      }
    }
  }
  return record;
}

function stringifyJsonFields(data: Record<string, unknown> | undefined) {
  if (!data) return data;
  for (const field of JSON_FIELDS) {
    if (field in data && data[field] !== null && data[field] !== undefined && typeof data[field] !== 'string') {
      data[field] = JSON.stringify(data[field]);
    }
  }
  return data;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return client.$extends({
    query: {
      dataset: {
        async create({ args, query }) {
          stringifyJsonFields(args.data as Record<string, unknown>);
          return query(args);
        },
        async update({ args, query }) {
          stringifyJsonFields(args.data as Record<string, unknown>);
          return query(args);
        },
        async upsert({ args, query }) {
          stringifyJsonFields(args.create as Record<string, unknown>);
          stringifyJsonFields(args.update as Record<string, unknown>);
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return parseJsonFields(result as Record<string, unknown> | null) as typeof result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return parseJsonFields(result as Record<string, unknown> | null) as typeof result;
        },
        async findMany({ args, query }) {
          const results = await query(args);
          return (results as Record<string, unknown>[]).map((r) => parseJsonFields(r)) as typeof results;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? (createPrismaClient() as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
