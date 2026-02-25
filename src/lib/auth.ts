// src/lib/auth.ts
// NextAuth 配置文件 — 认证的核心
// 这里定义：用什么方式登录、如何验证密码、session 里放什么数据

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // session 策略：JWT（无状态，不需要数据库存 session）
  // 另一种是 "database"（有状态，session 存在 DB 里）
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天过期
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // authorize 是关键：返回用户对象表示成功，返回 null 表示失败
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // bcrypt.compare 对比明文密码和数据库里的 hash
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    // JWT callback：token 被创建/更新时调用
    // 把 user.id 存进 token，这样后续 API 可以用
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Session callback：session 被读取时调用
    // 把 token 里的 id 暴露给前端 useSession()
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",   // 自定义登录页路径
    error: "/login",    // 认证错误也跳到登录页
  },
};
