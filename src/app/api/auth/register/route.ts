// src/app/api/auth/register/route.ts
// 注册接口 — POST /api/auth/register
// 全栈关键概念：API Route 就是后端，运行在服务器上，可以安全访问数据库

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// 用 Zod 定义并验证请求体结构
// 比手写 if 判断更优雅，自动生成错误信息
const registerSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(50),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求数据
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, email, password } = result.data;

    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该邮箱已被注册" },
        { status: 409 }, // 409 Conflict
      );
    }

    // 密码加密：bcrypt 自动加盐，10 是 cost factor（越高越安全但越慢）
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true }, // 不返回密码！
    });

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }, // 201 Created
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误，请稍后重试" },
      { status: 500 },
    );
  }
}
