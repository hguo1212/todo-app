// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui 标准工具函数：合并 Tailwind 类名，避免冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化截止日期显示
export function formatDueDate(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const due = new Date(date);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return "今天截止";
  if (diffDays === 1) return "明天截止";
  if (diffDays <= 7) return `${diffDays} 天后`;
  return due.toLocaleDateString("zh-CN");
}

// 截止日期状态
export function getDueDateStatus(date: Date | null): "overdue" | "today" | "soon" | "normal" | null {
  if (!date) return null;
  const now = new Date();
  const due = new Date(date);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "soon";
  return "normal";
}
