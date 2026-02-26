"use client";
// src/components/todo/TodoEditModal.tsx
//
// 学习要点：
//   1. 受控表单 (Controlled Form) — 每个字段都有对应 state，onChange 实时同步
//   2. useEffect 初始化表单 — todo prop 变化时重置表单数据
//   3. 多选标签 — toggle 逻辑（在数组里加/删 id）
//   4. 乐观更新 — 提交后立刻更新 UI，不等服务器返回

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { TodoWithTags, UpdateTodoInput } from "@/types";
import { TagWithCount } from "@/hooks/useTags";
import { Priority } from "@prisma/client";

// 预设颜色供选择标签时用
const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  {
    value: "LOW",
    label: "低",
    color: "text-green-600 bg-green-50 border-green-200",
  },
  {
    value: "MEDIUM",
    label: "中",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  {
    value: "HIGH",
    label: "高",
    color: "text-red-600 bg-red-50 border-red-200",
  },
];

interface TodoEditModalProps {
  todo: TodoWithTags | null; // null = 新建模式，有值 = 编辑模式
  open: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateTodoInput) => Promise<any>;
  onCreate: (input: any) => Promise<any>;
  tags: TagWithCount[]; // 所有可选标签
  onCreateTag: (name: string, color: string) => Promise<any>;
}

export function TodoEditModal({
  todo,
  open,
  onClose,
  onSave,
  onCreate,
  tags,
  onCreateTag,
}: TodoEditModalProps) {
  const isEdit = !!todo; // 编辑 or 新建模式

  // ── 表单状态 ──────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 新建标签的临时状态
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[5]);

  // ── 关键：useEffect 同步 todo → 表单 ─────────────────────
  // 为什么用 useEffect？因为 todo prop 是外部传入的，
  // 弹窗打开时需要把 todo 数据填进表单，todo 变了表单也要重置
  useEffect(() => {
    if (open) {
      if (todo) {
        // 编辑模式：用 todo 数据初始化表单
        setTitle(todo.title);
        setDescription(todo.description ?? "");
        setPriority(todo.priority);
        setDueDate(
          todo.dueDate
            ? new Date(todo.dueDate).toISOString().split("T")[0] // 转成 YYYY-MM-DD
            : "",
        );
        setSelectedTagIds(todo.tags.map((t) => t.tag.id));
      } else {
        // 新建模式：清空表单
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDueDate("");
        setSelectedTagIds([]);
      }
      setError("");
      setShowNewTag(false);
    }
  }, [open, todo]);

  // ── 标签 toggle 逻辑 ──────────────────────────────────────
  // 经典的「在数组里加/删某个值」模式
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(
      (prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId) // 已选 → 移除
          : [...prev, tagId], // 未选 → 添加
    );
  };

  // ── 新建标签 ──────────────────────────────────────────────
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const result = await onCreateTag(newTagName.trim(), newTagColor);
    if (result.success) {
      setSelectedTagIds((prev) => [...prev, result.data.id]); // 创建后自动选中
      setNewTagName("");
      setShowNewTag(false);
    }
  };

  // ── 提交表单 ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("标题不能为空");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || null,
      tagIds: selectedTagIds,
    };

    const result = isEdit
      ? await onSave(todo!.id, payload)
      : await onCreate(payload);

    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? "保存失败");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "编辑任务" : "新建任务"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            标题 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务标题..."
            autoFocus
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            描述
            <span className="text-slate-400 font-normal text-xs">（可选）</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="添加描述..."
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 优先级 + 截止日期 — 两列布局 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 优先级 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              优先级
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button" // 重要：不加 type="button" 会触发表单提交！
                  onClick={() => setPriority(opt.value)}
                  className={`
                    flex-1 py-2 text-sm font-medium rounded-lg border transition-all
                    ${
                      priority === opt.value
                        ? opt.color + " ring-2 ring-offset-1 ring-current"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              截止日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]} // 不能选过去的日期
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 标签 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">标签</label>
            <button
              type="button"
              onClick={() => setShowNewTag(!showNewTag)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showNewTag ? "取消" : "+ 新建标签"}
            </button>
          </div>

          {/* 新建标签区域 */}
          {showNewTag && (
            <div className="flex gap-2 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="标签名..."
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleCreateTag())
                }
                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* 颜色选择器 */}
              <div className="flex items-center gap-1">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline:
                        newTagColor === color ? `2px solid ${color}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-40 hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          )}

          {/* 标签列表 */}
          {tags.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              还没有标签，点击「新建标签」创建
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                      ${
                        selected
                          ? "text-white shadow-sm scale-105"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }
                    `}
                    style={
                      selected
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : {}
                    }
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "保存中..." : isEdit ? "保存修改" : "创建任务"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
