// scripts/generate-vapid-keys.js
// 运行一次，生成 VAPID 密钥对，然后复制到 .env.local
// 用法：node scripts/generate-vapid-keys.js

const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();

console.log("\n✅ VAPID Keys Generated! 复制以下内容到 .env.local 和 .env：\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`VAPID_EMAIL="your@email.com"\n`);
console.log("⚠️  注意：VAPID_PRIVATE_KEY 绝对不能暴露给前端！");
console.log("    NEXT_PUBLIC_ 前缀的变量会暴露给浏览器，私钥绝对不能加这个前缀。\n");
