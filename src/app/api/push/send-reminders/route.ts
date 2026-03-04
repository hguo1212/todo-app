// src/app/api/push/send-reminders/route.ts
// 定时任务触发端点：检查今日截止的 Todo，向对应用户推送通知
// GET /api/push/send-reminders
//
// 学习要点：
//   这个接口不是给用户调用的，而是给定时任务（cron）调用的
//   Vercel 可以配置 Cron Job 定时 GET 这个 URL
//   本地开发可以手动访问，或者用 node-cron 跑定时任务
//
// 安全：用 CRON_SECRET 防止外部随意调用

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/webpush";

export async function GET(request: NextRequest) {
  // 验证调用方身份（Vercel Cron 会自动带上这个 header）
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 计算「今天」的时间范围：00:00:00 ~ 23:59:59
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  // 查找两类待推送的待办：
  // 1. 今天截止的未完成任务
  // 2. nextReminderAt 已到期的未完成任务
  const todayTodos = await prisma.todo.findMany({
    where: {
      completed: false,
      OR: [
        {
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          nextReminderAt: {
            lte: now, // 提醒时间已经到了
          },
        },
      ],
      user: {
        pushSubscriptions: { some: {} }, // 只处理有订阅的用户
      },
    },
    include: {
      user: {
        include: { pushSubscriptions: true },
      },
    },
  });

  if (todayTodos.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      message: "今天没有截止任务",
    });
  }

  // 按用户分组，每个用户发一条汇总通知
  const byUser = todayTodos.reduce<Record<string, typeof todayTodos>>(
    (acc, todo) => {
      const uid = todo.userId;
      if (!acc[uid]) acc[uid] = [];
      acc[uid].push(todo);
      return acc;
    },
    {},
  );

  let totalSent = 0;
  const expiredEndpoints: string[] = [];
  const processedTodoIds: string[] = []; // 记录已推送的 Todo，后续清除 nextReminderAt

  for (const [userId, todos] of Object.entries(byUser)) {
    const user = todos[0].user;
    const count = todos.length;

    // 通知文案：一个用一个任务名，多个用数量汇总
    const body =
      count === 1
        ? `「${todos[0].title}」今天截止，记得完成！`
        : `你有 ${count} 个任务今天截止，快去完成吧！`;

    // 如果只有一个 Todo，就把它的 id 放到 payload 里，SW 便能处理 "complete" 操作
    const extraData: Record<string, any> = {};
    if (count === 1) {
      extraData.todoId = todos[0].id;
      // 让点击通知直接跳到该任务的详情页面（dashboard 会根据 query 展开编辑框）
      extraData.url = `/dashboard?todoId=${todos[0].id}`;
    } else {
      extraData.url = "/dashboard";
    }

    // 向该用户的所有设备推送
    for (const sub of user.pushSubscriptions) {
      console.log(
        "[Push] Sending to endpoint:",
        sub.endpoint.slice(0, 60) + "...",
      );
      console.log(
        "[Push] Payload:",
        JSON.stringify({ title: "⏰ Todo 截止提醒", body, ...extraData }),
      );
      try {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: "⏰ Todo 截止提醒", body, ...extraData },
        );
        console.log("[Push] Result:", result);
        if (result.success) {
          totalSent++;
          // 成功发送后，记录这个 Todo，后续清除 nextReminderAt
          todos.forEach((t) => {
            if (!processedTodoIds.includes(t.id)) {
              processedTodoIds.push(t.id);
            }
          });
        } else if (result.expired) {
          expiredEndpoints.push(sub.endpoint);
        }
      } catch (err: any) {
        console.error("[Push] Error:", err.statusCode, err.body, err.message);
      }
    }
  }

  // 清除已推送的 Todo 的 nextReminderAt，防止重复推送
  if (processedTodoIds.length > 0) {
    await prisma.todo.updateMany({
      where: { id: { in: processedTodoIds }, nextReminderAt: { not: null } },
      data: { nextReminderAt: null },
    });
  }

  // 清理失效订阅
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }

  return NextResponse.json({
    success: true,
    sent: totalSent,
    usersNotified: Object.keys(byUser).length,
    expiredCleaned: expiredEndpoints.length,
  });
}
