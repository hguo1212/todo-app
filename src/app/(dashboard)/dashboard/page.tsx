"use client";
// src/app/(dashboard)/dashboard/page.tsx
// 更新：集成 TodoEditModal，支持新建和编辑

import { useSession } from "next-auth/react";
import { useTodos } from "@/hooks/useTodos";
import { useTags } from "@/hooks/useTags";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TodoWithTags } from "@/types";
import { formatDueDate, getDueDateStatus } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { TodoEditModal } from "@/components/todo/TodoEditModal";
import { NotificationBell } from "@/components/ui/NotificationBell";

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
  const { todos, loading, createTodo, updateTodo, toggleTodo, deleteTodo } =
    useTodos();
  const { tags, createTag } = useTags();
  const router = useRouter();

  // 弹窗状态：undefined = 关闭，null = 新建模式，TodoWithTags = 编辑模式
  const [editingTodo, setEditingTodo] = useState<
    TodoWithTags | null | undefined
  >(undefined);
  const isModalOpen = editingTodo !== undefined;

  // 如果 URL 上有 todoId 查询参数，尝试从已有 todo 列表中找到并打开编辑弹窗
  useEffect(() => {
    if (editingTodo === undefined) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("todoId");
      if (id) {
        const found = todos.find((t) => t.id === id);
        if (found) {
          setEditingTodo(found);
        }
        // 清理查询参数，避免刷新后重复打开
        params.delete("todoId");
        const newSearch = params.toString();
        router.replace(
          window.location.pathname + (newSearch ? `?${newSearch}` : ""),
        );
      }
    }
  }, [todos, editingTodo, router]);

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">我的任务</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {pending.length} 个待完成 · {completed.length} 个已完成
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm text-slate-600">
              Hi, {session?.user?.name}
            </span>
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
        <button
          onClick={() => setEditingTodo(null)}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all mb-6 shadow-sm group"
        >
          <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white transition-all">
            +
          </span>
          添加新任务
        </button>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            加载中...
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 text-sm">
              还没有任务，点击上方添加吧！
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={(id) => toggleTodo(id, true)}
                onDelete={deleteTodo}
                onEdit={() => setEditingTodo(todo)}
              />
            ))}
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
                    onEdit={() => setEditingTodo(todo)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      <TodoEditModal
        open={isModalOpen}
        todo={editingTodo ?? null}
        onClose={() => setEditingTodo(undefined)}
        onSave={updateTodo}
        onCreate={createTodo}
        tags={tags}
        onCreateTag={createTag}
      />
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: TodoWithTags;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const dueDateStatus = getDueDateStatus(todo.dueDate);
  const priorityConfig = PRIORITY_CONFIG[todo.priority];

  return (
    <div
      className={`
      flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5
      hover:border-slate-300 transition-all group shadow-sm
      ${todo.completed ? "opacity-60" : ""}
    `}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${todo.completed ? "bg-blue-500 border-blue-500" : "border-slate-300 hover:border-blue-400"}`}
      >
        {todo.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p
          className={`text-sm font-medium text-slate-800 ${todo.completed ? "line-through text-slate-400" : ""}`}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {todo.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityConfig.color}`}
          >
            {priorityConfig.label}
          </span>
          {todo.dueDate && (
            <span
              className={`text-xs ${dueDateStatus ? DUE_STATUS_COLOR[dueDateStatus] : "text-slate-500"}`}
            >
              📅 {formatDueDate(todo.dueDate)}
            </span>
          )}
          {todo.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="text-slate-400 hover:text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="text-slate-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
