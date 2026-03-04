// src/app/api/push/subscribe/route.ts
// 保存浏览器的 Push 订阅信息
// POST /api/push/subscribe  — 订阅
// DELETE /api/push/subscribe — 取消订阅

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh:   z.string(),
  auth:     z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const result = subscribeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "数据格式错误" }, { status: 400 });
  }

  const { endpoint, p256dh, auth } = result.data;

  // upsert：有就更新，没有就创建
  // 同一个 endpoint（同一设备）不会重复存
  const subscription = await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh, auth, userId: session.user.id },
    create: { endpoint, p256dh, auth, userId: session.user.id },
  });

  return NextResponse.json({ success: true, data: subscription });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { endpoint } = await request.json();

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
