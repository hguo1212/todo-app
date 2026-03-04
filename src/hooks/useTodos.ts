// src/hooks/useTodos.ts
// 自定义 Hook — 封装 Todo 相关的所有数据操作
// 好处：组件只关心 UI，数据逻辑集中在这里，方便复用和测试

import { useState, useEffect, useCallback } from "react";
import { TodoWithTags, CreateTodoInput, UpdateTodoInput } from "@/types";

export function useTodos(filters?: {
  completed?: boolean;
  tagId?: string;
  priority?: string;
}) {
  const [todos, setTodos] = useState<TodoWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 构建查询字符串
  const buildQuery = useCallback(() => {
    if (!filters) return "";
    const params = new URLSearchParams();
    if (filters.completed !== undefined)
      params.set("completed", String(filters.completed));
    if (filters.tagId) params.set("tagId", filters.tagId);
    if (filters.priority) params.set("priority", filters.priority);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters?.completed, filters?.tagId, filters?.priority]);

  // 获取列表
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos${buildQuery()}`);
      const json = await res.json();
      if (json.success) setTodos(json.data);
      else setError(json.error);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // 监听来自 Service Worker 的消息，以便远程完成操作能及时同步
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.type === "todoCompleted" && msg.todoId) {
        setTodos((prev) =>
          prev.map((t) =>
            t.id === msg.todoId ? { ...t, completed: true } : t,
          ),
        );
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  // 创建
  const createTodo = async (input: CreateTodoInput) => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (json.success) {
      // 乐观更新：先把新 todo 加到列表头部，不等服务器返回完整列表
      setTodos((prev) => [json.data, ...prev]);
    }
    return json;
  };

  // 更新（包括勾选完成）
  const updateTodo = async (id: string, input: UpdateTodoInput) => {
    // 乐观更新：先在本地更新状态，如果失败再回滚

    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const { dueDate, ...rest } = input;
        return { ...t, ...rest };
      }),
    );
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!json.success) {
      // 回滚：重新获取
      fetchTodos();
    } else {
      // 用服务器返回的完整数据替换（包含标签等关联数据）
      setTodos((prev) => prev.map((t) => (t.id === id ? json.data : t)));
    }
    return json;
  };

  // 删除
  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id)); // 乐观删除
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) fetchTodos(); // 失败回滚
    return json;
  };

  // 切换完成状态（常用操作单独封装）
  const toggleTodo = (id: string, completed: boolean) =>
    updateTodo(id, { completed });

  return {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch: fetchTodos,
  };
}
