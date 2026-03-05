// src/app/api/todos/[id]/route.ts
// 单个 Todo 操作
// GET    /api/todos/:id  — 获取单个
// PATCH  /api/todos/:id  — 更新（部分字段）
// DELETE /api/todos/:id  — 删除

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

// 权限检查：确认这条 Todo 属于当前用户（防止越权访问）
async function getTodoAndVerifyOwner(todoId: string, userId: string) {
  const todo = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!todo) return { todo: null, error: "Todo 不存在", status: 404 };
  if (todo.userId !== userId) return { todo: null, error: "无权操作", status: 403 };
  return { todo, error: null, status: 200 };
}

// ============ PATCH ============
const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { todo, error, status } = await getTodoAndVerifyOwner(params.id, user.id);
  if (error) return NextResponse.json({ success: false, error }, { status });

  try {
    const body = await request.json();
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });
    }

    const { tagIds, dueDate, ...rest } = result.data;

    const updated = await prisma.todo.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        // 更新标签：先删除旧的，再创建新的（简单粗暴但有效）
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

// ============ DELETE ============
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { error, status } = await getTodoAndVerifyOwner(params.id, user.id);
  if (error) return NextResponse.json({ success: false, error }, { status });

  await prisma.todo.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, data: null });
}
