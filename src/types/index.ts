// src/types/index.ts
// 全局类型定义 — 前后端共享，这是 TypeScript 全栈的优势

import { Todo, Tag, Priority } from "@prisma/client";

// 带标签的 Todo（API 返回格式）
export type TodoWithTags = Todo & {
  tags: {
    tag: Tag;
  }[];
};

// 创建 Todo 的表单数据
export type CreateTodoInput = {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string; // ISO string，从 input[type=date] 来
  tagIds?: string[];
};

// 更新 Todo 的表单数据（所有字段可选）
export type UpdateTodoInput = Partial<Omit<CreateTodoInput, "dueDate">> & {
  completed?: boolean;
  dueDate?: string | null; // ← 允许 null（表示清除截止日期）
};

// 创建标签
export type CreateTagInput = {
  name: string;
  color?: string;
};

// API 响应统一格式
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// 扩展 NextAuth 类型，添加 id 字段
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }
}
