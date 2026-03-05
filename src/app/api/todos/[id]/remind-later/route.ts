// src/app/api/todos/[id]/remind-later
// POST /api/todos/:id/remind-later — 将任务的下次提醒时间设置为 N 分钟后
// 用于 Service Worker「稍后提醒」按钮，通知服务器延迟推送

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

async function getTodoAndVerifyOwner(todoId: string, userId: string) {
  const todo = await prisma.todo.findUnique({ where: { id: todoId } });
  if (!todo) return { todo: null, error: "Todo 不存在", status: 404 };
  if (todo.userId !== userId)
    return { todo: null, error: "无权操作", status: 403 };
  return { todo, error: null, status: 200 };
}

const remindLaterSchema = z.object({
  minutesLater: z.number().int().min(1).max(1440), // 最多延迟 24 小时
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { todo, error, status } = await getTodoAndVerifyOwner(
    params.id,
    user.id,
  );
  if (error) return NextResponse.json({ success: false, error }, { status });

  try {
    const body = await request.json();
    const result = remindLaterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { minutesLater } = result.data;
    const nextReminderAt = new Date(Date.now() + minutesLater * 60 * 1000);

    const updated = await prisma.todo.update({
      where: { id: params.id },
      data: { nextReminderAt },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 },
    );
  }
}
