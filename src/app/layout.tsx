// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Todo App — 全栈练习项目",
  description: "Next.js + Prisma + PostgreSQL + NextAuth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* Providers 包裹整个应用，提供 Session 上下文 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
