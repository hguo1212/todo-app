"use client";
// src/components/ui/NotificationBell.tsx
// 通知开关按钮，放在 Header 里

import { usePushNotification } from "@/hooks/usePushNotification";

export function NotificationBell() {
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe, sendTestNotification } =
    usePushNotification();

  // 浏览器不支持时不渲染
  if (!isSupported) return null;

  // 用户已拒绝权限：提示去浏览器设置里改
  if (permission === "denied") {
    return (
      <div className="text-xs text-slate-400" title="通知权限已被拒绝，请在浏览器设置里开启">
        🔕
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        title={isSubscribed ? "关闭截止日期提醒" : "开启截止日期提醒"}
        className={`
          flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium
          ${isSubscribed
            ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
          }
          ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span>{isSubscribed ? "🔔" : "🔕"}</span>
        <span>{loading ? "处理中..." : isSubscribed ? "提醒已开" : "开启提醒"}</span>
      </button>

      {/* 开发环境：测试按钮 */}
      {process.env.NODE_ENV === "development" && isSubscribed && (
        <button
          onClick={sendTestNotification}
          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50"
          title="立刻触发提醒（开发测试用）"
        >
          测试
        </button>
      )}
    </div>
  );
}
