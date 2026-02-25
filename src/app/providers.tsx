"use client";
// src/app/providers.tsx
// 为什么单独抽出来？
// SessionProvider 是客户端组件（用了 useContext）
// 但 layout.tsx 可以是服务端组件
// Next.js 规定：服务端组件不能直接 import 客户端组件并传 JSX children 以外的东西
// 把 Provider 单独放到 client 组件里是最佳实践

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
