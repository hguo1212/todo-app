"use client";
// src/app/(auth)/login/page.tsx
// (auth) 是 Route Group：括号里的名字不影响 URL，只用于文件组织
// 登录页 URL 是 /login，不是 /(auth)/login

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // signIn 返回 { error, ok, status, url }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // 不自动跳转，我们手动控制
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/dashboard"); // 登录成功跳转
      router.refresh(); // 刷新 Server Components 缓存
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p className="text-slate-500 mt-1 text-sm">登录你的 Todo 账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          还没有账号？{" "}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
