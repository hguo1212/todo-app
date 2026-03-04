// src/lib/webpush.ts
// 服务端 Web Push 工具
//
// 学习要点：VAPID (Voluntary Application Server Identification)
//   Web Push 需要一对公私钥来验证「推送方是谁」
//   公钥给浏览器（订阅时用），私钥留在服务器（发送时用）
//   这对密钥只需生成一次，存在环境变量里

import webpush from "web-push";

// 初始化 VAPID 配置
// 这个函数在每次推送前调用，确保配置正确
function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Run: node scripts/generate-vapid-keys.js",
    );
  }

  webpush.setVapidDetails(
    "mailto:" + (process.env.VAPID_EMAIL || "admin@example.com"),
    publicKey,
    privateKey,
  );
}

// 向单个订阅发送通知
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    todoId?: string;
  },
) {
  initWebPush();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: any) {
    // 410 Gone：订阅已失效（用户取消了通知权限），应该从数据库删除
    if (error.statusCode === 410) {
      return { success: false, expired: true };
    }
    throw error;
  }
}
