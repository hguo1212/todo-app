// src/middleware.ts
// 中间件：在请求到达页面之前执行
// 核心功能：未登录用户访问受保护页面时，自动重定向到登录页
// 这比在每个页面里手动检查 session 优雅得多

import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token, // token 存在 = 已登录
  },
  pages: {
    signIn: "/login",
  },
});

// matcher 定义哪些路径需要保护
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/todos/:path*",
    "/api/todos/:path*",
    "/api/tags/:path*",
    // 注意：/api/auth/* 不保护，否则登录接口本身也被拦截了
  ],
};
