// src/lib/prisma.ts
// 为什么要单例？Next.js 开发环境热重载会导致创建多个 Prisma 实例
// 超出数据库连接数限制，这个模式是官方推荐解法

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    // development 环境打印 SQL 语句，方便学习理解
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
