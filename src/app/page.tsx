// src/app/page.tsx
// 根路径直接重定向到 dashboard（会被 middleware 拦截到 login 如果未登录）

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
