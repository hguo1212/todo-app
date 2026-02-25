// src/app/api/todos/route.ts
// Todo 列表接口
// GET  /api/todos        — 获取当前用户的所有 Todo
// POST /api/todos        — 创建新 Todo

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 权限守卫：获取当前登录用户
// getServerSession 是服务端专用，在 API Route 和 Server Component 里用
async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

// ============ GET ============
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "请先登录" },
      { status: 401 },
    );
  }

  // 从 URL 读取查询参数（过滤条件）
  const { searchParams } = new URL(request.url);
  const completed = searchParams.get("completed");
  const tagId = searchParams.get("tagId");
  const priority = searchParams.get("priority");

  const todos = await prisma.todo.findMany({
    where: {
      userId: user.id,
      // 条件过滤：undefined 表示不过滤该字段
      ...(completed !== null && { completed: completed === "true" }),
      ...(priority && { priority: priority as any }),
      ...(tagId && { tags: { some: { tagId } } }),
    },
    include: {
      tags: {
        include: { tag: true }, // 连接查询，同时获取 Tag 详情
      },
    },
    orderBy: [
      { completed: "asc" }, // 未完成的在前
      { dueDate: "asc" }, // 按截止日期排序
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ success: true, data: todos });
}

// ============ POST ============
const createTodoSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  dueDate: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "请先登录" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const result = createTodoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { title, description, priority, dueDate, tagIds } = result.data;

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
        // 多对多关系创建：同时在 TagsOnTodos 中间表插入记录
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json(
      { success: false, error: "创建失败" },
      { status: 500 },
    );
  }
}
