"use client";
// src/components/ui/Modal.tsx
// 自己实现一个简单的 Modal，不依赖第三方库
// 学习要点：
//   1. createPortal — 把 DOM 渲染到 body 下，避免 z-index 和 overflow:hidden 干扰
//   2. useEffect 管理副作用 — 打开时禁止 body 滚动
//   3. 键盘可访问性 — Escape 关闭

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  // 副作用：打开时锁定 body 滚动，关闭时恢复
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape 键关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  // inset 是top right bottom left 的简写，inset-0 就是全都为0，表示占满整个屏幕
  // backdrop 为一个元素后面区域添加图形效果（如模糊或颜色偏移）

  // 容器 -> 遮罩 + 主体（header + content） header 包含标题和关闭按钮，content 显示 children

  // createPortal：把弹窗挂到 body，而不是当前组件树
  // 这样无论父组件有没有 overflow:hidden 都不会被裁剪
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div
        className={cn(
          "relative z-10 bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4",
          "animate-in fade-in zoom-in-95 duration-150",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
