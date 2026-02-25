"use client";
// src/app/(auth)/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. 调用注册 API
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (!json.success) {
      setError(json.error);
      setLoading(false);
      return;
    }

    // 2. 注册成功后自动登录
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
          <p className="text-slate-500 mt-1 text-sm">开始管理你的任务</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "name", label: "姓名", type: "text", placeholder: "你的名字" },
            { key: "email", label: "邮箱", type: "email", placeholder: "you@example.com" },
            { key: "password", label: "密码", type: "password", placeholder: "至少 6 位" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
                required
              />
            </div>
          ))}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "创建中..." : "创建账号"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          已有账号？{" "}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
