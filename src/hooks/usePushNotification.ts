"use client";
// src/hooks/usePushNotification.ts
//
// 学习要点：整个 Web Push 订阅流程
//   1. 检查浏览器支持
//   2. 注册 Service Worker
//   3. 申请通知权限
//   4. 生成 Push 订阅（用 VAPID 公钥）
//   5. 把订阅信息 POST 到服务器保存

import { useState, useEffect } from "react";

// URL-safe Base64 → Uint8Array
// VAPID 公钥是 Base64 编码的，但 subscribe() 需要 Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // base64 字符串长度必须是 4 的倍数，不足时补 "="
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  // 替换 URL-safe 字符 将标准 Base64 的 + 和 / 替换为 - 和 _
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  // atob() 解码 Base64 字符串，得到原始二进制数据
  const rawData = window.atob(base64);
  // 将每个字符转换为对应的 char code，构造 Uint8Array
  return Uint8Array.from(rawData.split("").map((char) => char.charCodeAt(0)));
}

export type NotificationPermission = "default" | "granted" | "denied";

export function usePushNotification() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // 初始化：检查浏览器支持 & 注册 Service Worker
  useEffect(() => {
    const init = async () => {
      // 检查浏览器是否支持必要 API
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      // Notification.permission通知权限
      setPermission(Notification.permission as NotificationPermission);

      try {
        // 注册 Service Worker
        // 浏览器会缓存 SW，相同 URL 不会重复注册
        const existing = await navigator.serviceWorker.getRegistration("/");
        console.log("Existing SW registration:", existing);
        const registration =
          existing ??
          (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
        setSwRegistration(registration);

        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (err) {
        console.error("[Push] SW registration failed:", err);
      }
    };

    init();
  }, []);

  // 订阅推送
  const subscribe = async (): Promise<boolean> => {
    if (!swRegistration) return false;

    setLoading(true);
    try {
      // 申请通知权限（会弹出浏览器原生权限对话框）
      const perm = await Notification.requestPermission();
      setPermission(perm as NotificationPermission);

      if (perm !== "granted") {
        return false;
      }

      // 用 VAPID 公钥生成 Push 订阅
      // applicationServerKey 就是服务器的 VAPID 公钥
      // 浏览器推送服务用这个公钥来验证消息确实来自你的服务器
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("VAPID public key not configured");

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true, // 必须为 true，表示每次 push 都会显示通知
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey,
        ) as unknown as ArrayBuffer,
      });

      // 把订阅信息发给服务器保存
      // subscription.toJSON() 包含 endpoint, keys.p256dh, keys.auth
      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 取消订阅
  const unsubscribe = async (): Promise<boolean> => {
    if (!swRegistration) return false;

    setLoading(true);
    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (!subscription) return true;

      // 通知浏览器取消订阅
      await subscription.unsubscribe();

      // 通知服务器删除记录
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 测试：立刻发一条通知（开发用）
  const sendTestNotification = async () => {
    await fetch("/api/push/send-reminders");
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
