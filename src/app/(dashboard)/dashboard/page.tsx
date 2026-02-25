"use client";
// src/app/(dashboard)/dashboard/page.tsx
// 主仪表盘页面

import { useSession } from "next-auth/react";
import { useTodos } from "@/hooks/useTodos";
import { useState } from "react";
import { TodoWithTags } from "@/types";
import { formatDueDate, getDueDateStatus } from "@/lib/utils";
import { signOut } from "next-auth/react";

const PRIORITY_CONFIG = {
  HIGH: { label: "高", color: "bg-red-100 text-red-700" },
  MEDIUM: { label: "中", color: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "低", color: "bg-green-100 text-green-700" },
};

const DUE_STATUS_COLOR = {
  overdue: "text-red-600",
  today: "text-orange-600",
  soon: "text-yellow-600",
  normal: "text-slate-500",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { todos, loading, createTodo, toggleTodo, deleteTodo } = useTodos();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await createTodo({ title: newTitle.trim() });
    setNewTitle("");
    setAdding(false);
  };

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">我的任务</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {pending.length} 个待完成 · {completed.length} 个已完成
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Hi, {session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* 快速添加 */}
        <form onSubmit={handleQuickAdd} className="flex gap-2 mb-8">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="添加新任务... (按回车快速创建)"
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            + 添加
          </button>
        </form>

        {/* Todo 列表 */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">加载中...</div>
        ) : todos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 text-sm">还没有任务，添加一个吧！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 待完成 */}
            {pending.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={(id) => toggleTodo(id, true)}
                onDelete={deleteTodo}
              />
            ))}

            {/* 已完成 */}
            {completed.length > 0 && (
              <>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-1 px-1">
                  已完成 ({completed.length})
                </p>
                {completed.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={(id) => toggleTodo(id, false)}
                    onDelete={deleteTodo}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ============ Todo Item 组件 ============
function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoWithTags;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const dueDateStatus = getDueDateStatus(todo.dueDate);
  const priorityConfig = PRIORITY_CONFIG[todo.priority];

  return (
    <div className={`
      flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5
      hover:border-slate-300 transition-all group shadow-sm
      ${todo.completed ? "opacity-60" : ""}
    `}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`
          mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          transition-colors
          ${todo.completed
            ? "bg-blue-500 border-blue-500"
            : "border-slate-300 hover:border-blue-400"
          }
        `}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-slate-800 ${todo.completed ? "line-through text-slate-400" : ""}`}>
          {todo.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* 优先级 */}
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>

          {/* 截止日期 */}
          {todo.dueDate && (
            <span className={`text-xs ${dueDateStatus ? DUE_STATUS_COLOR[dueDateStatus] : "text-slate-500"}`}>
              📅 {formatDueDate(todo.dueDate)}
            </span>
          )}

          {/* 标签 */}
          {todo.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs p-1"
      >
        ✕
      </button>
    </div>
  );
}
