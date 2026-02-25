// src/app/api/auth/[...nextauth]/route.ts
// [...nextauth] 是动态路由，捕获所有 /api/auth/* 请求
// NextAuth 自动处理：/api/auth/signin, /api/auth/signout, /api/auth/session 等

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Next.js App Router 要求分别导出 GET 和 POST
export { handler as GET, handler as POST };
