// public/sw.js
// Service Worker — 运行在独立线程，不依赖页面是否打开
//
// 学习要点：
//   Service Worker 是浏览器的「后台代理」
//   它不能访问 DOM，没有 window 对象
//   但它能：拦截网络请求、接收 Push 消息、在后台运行
//
// 生命周期：install → activate → (idle) → fetch/push/notificationclick

// 获取service work代码 ，安装完后立即调用install事件，安装完成后调用activate事件，安装和激活完成后就可以接收push事件了 ;一旦 service worker 的旧版本控制的页面都已关闭，就可以安全地停用旧版本，并且新安装的 service worker 将收到 activate 事件。activate 的主要用途是去清理 service worker 之前版本使用的资源。激活后，service worker 将立即控制页面，但是只会控制那些在 register() 成功后打开的页面

// ── 安装阶段：跳过等待，立即激活 ──────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installed");
  self.skipWaiting(); // 不等旧 SW 关闭，直接接管
});

// ── 激活阶段：清理旧缓存 ──────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activated");
  event.waitUntil(self.clients.claim()); // 立即控制所有页面
});

// ── 核心：接收 Push 消息 ──────────────────────────────────
// 服务器通过 Web Push 协议发来的消息，在这里处理

self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  // 解析服务器发来的 JSON 数据
  let data = {
    title: "Todo 提醒",
    body: "你有任务即将截止",
    icon: "/icon.png",
  };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  // showNotification 展示系统通知
  // event.waitUntil 告诉浏览器：在这个 Promise 完成前，不要终止 SW
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/icon.png",
      tag: "todo-reminder", // 相同 tag 的通知会合并，不会堆叠
      renotify: true, // tag 相同但内容不同时，依然发出声音
      requireInteraction: false, // 不需要用户手动关闭
      // 将服务器 payload 里可能传来的 todoId 一起传给 SW，以便点击时操作
      data: { url: data.url || "/", todoId: data.todoId },
      actions: [
        {
          action: "complete",
          title: "✅ 完成",
        },
        {
          action: "remind-later",
          title: "⏰ 稍后提醒1",
        },
      ],
    }),
  );
});

// ── 点击通知：跳转到 App ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action; // "", "complete", "remind-later" …
  const data = event.notification.data || {};
  const targetUrl = data.url || "/";

  // 根据客户端传来的额外字段执行不同的操作
  // - 完成按钮：如果通知里有 todoId，就调用更新接口标记完成
  // - 稍后提醒：调用后端 API 设置下次提醒时间，由服务器 cron job 定时发送（避免 SW 睡眠失效）
  const ops = [];

  if (action === "complete" && data.todoId) {
    ops.push(
      (async () => {
        await fetch(`${self.location.origin}/api/todos/${data.todoId}`, {
          // await fetch(`/api/todos/${data.todoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
        // 通知所有客户端页面，方便它们同步 UI
        const clients = await self.clients.matchAll({
          type: "window",
        });
        for (const c of clients) {
          c.postMessage({ type: "todoCompleted", todoId: data.todoId });
        }
      })(),
    );
  }

  if (action === "remind-later" && data.todoId) {
    // 调用后端 API 设置下次提醒时间
    // 服务器端 cron job 会在指定时间后自动发送通知，无需依赖 SW 的 setTimeout
    ops.push(
      fetch(`${self.location.origin}/api/todos/${data.todoId}/remind-later`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesLater: 10 }),
      }).catch((e) => {
        console.error("remind-later API call failed", e);
      }),
    );
  }

  // 焦点处理（不论有没有其他操作，都需要打开或聚焦页面）
  ops.push(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(targetUrl));
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      }),
  );

  event.waitUntil(Promise.all(ops));
});
