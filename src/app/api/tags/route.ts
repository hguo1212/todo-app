// src/app/api/tags/route.ts
// 标签管理接口
// GET  /api/tags  — 获取当前用户所有标签
// POST /api/tags  — 创建标签

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    where: { userId: user.id },
    include: { _count: { select: { todos: true } } }, // 每个标签的 Todo 数量
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: tags });
}

const createTagSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "颜色格式无效").optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const body = await request.json();
    const result = createTagSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: { ...result.data, userId: user.id },
    });

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  } catch (error: any) {
    // Prisma 唯一约束冲突错误码
    if (error.code === "P2002") {
      return NextResponse.json({ success: false, error: "标签名已存在" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
