# 全栈 Todo App — 学习项目

> Next.js 14 + Prisma + PostgreSQL + NextAuth  
> 专为「前端转全栈」设计，每个文件都有详细注释解释「为什么这样做」

---

## 项目结构

```
todo-app/
├── prisma/
│   └── schema.prisma          ← 数据库模型定义（先看这里！）
├── src/
│   ├── app/
│   │   ├── api/               ← 后端 API（运行在服务器上）
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts   ← NextAuth 处理器
│   │   │   │   └── register/route.ts        ← 注册接口
│   │   │   ├── todos/
│   │   │   │   ├── route.ts              ← GET 列表 / POST 创建
│   │   │   │   └── [id]/route.ts         ← PATCH 更新 / DELETE 删除
│   │   │   └── tags/route.ts             ← 标签管理
│   │   ├── (auth)/            ← Route Group，不影响 URL
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/
│   │       └── dashboard/page.tsx         ← 主页面
│   ├── hooks/
│   │   └── useTodos.ts        ← 封装数据操作的自定义 Hook
│   ├── lib/
│   │   ├── prisma.ts          ← Prisma 客户端单例
│   │   ├── auth.ts            ← NextAuth 配置
│   │   └── utils.ts           ← 工具函数
│   ├── middleware.ts           ← 路由保护（未登录跳转）
│   └── types/index.ts         ← TypeScript 类型定义
└── .env.example               ← 环境变量模板
```

---

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的数据库连接字符串
```

### 3. 启动 PostgreSQL

**方式 A：Docker（推荐，零安装）**
```bash
docker run --name todo-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=todo_app \
  -p 5432:5432 \
  -d postgres:16

# .env.local 填入：
# DATABASE_URL="postgresql://postgres:password@localhost:5432/todo_app"
```

**方式 B：云端免费数据库**  
去 [neon.tech](https://neon.tech) 注册，免费版足够学习使用  
复制连接字符串到 `.env.local`

### 4. 初始化数据库
```bash
npm run db:push       # 根据 schema.prisma 创建表
npm run db:generate   # 生成 Prisma Client 类型

# 可选：打开可视化数据库管理界面
npm run db:studio
```

### 5. 启动开发服务器
```bash
npm run dev
# 打开 http://localhost:3000
```

---

## 核心概念学习路径

按这个顺序阅读代码，最容易理解：

1. **`prisma/schema.prisma`** — 数据结构是一切的基础
2. **`src/lib/prisma.ts`** — 如何连接数据库
3. **`src/lib/auth.ts`** — 认证逻辑
4. **`src/app/api/auth/register/route.ts`** — 最简单的 API：注册
5. **`src/app/api/todos/route.ts`** — CRUD API
6. **`src/middleware.ts`** — 路由保护
7. **`src/hooks/useTodos.ts`** — 前端如何调用 API

---

## 下一步扩展（骨架已就绪，逐步添加）

- [ ] **Todo 详情/编辑弹窗** — 完善 PATCH 接口调用
- [ ] **标签管理页** — 调用 `/api/tags` 接口
- [ ] **截止日期筛选** — 利用 `useTodos` 的 `filters` 参数
- [ ] **截止日期邮件提醒** — 使用 Resend 或 Nodemailer
- [ ] **数据库迁移** — 从 `db push` 升级到 `prisma migrate`
- [ ] **单元测试** — 用 Vitest 测试 API routes
- [ ] **部署到 Vercel** — 零配置一键部署

---

## 全栈知识点对照

| 你写的代码 | 对应的全栈概念 |
|-----------|-------------|
| `prisma/schema.prisma` | 数据库 Schema 设计 |
| `API Route` 里的 `getServerSession` | 服务端认证 |
| `bcrypt.hash` | 密码安全存储 |
| `z.object({...}).safeParse(body)` | 输入验证 / 防注入 |
| `@@index([userId])` | 数据库索引优化 |
| `middleware.ts` | 路由守卫 |
| 乐观更新 in `useTodos.ts` | 前端 UX 优化模式 |
| JWT strategy in `auth.ts` | 无状态认证 |
