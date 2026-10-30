# 产品需求文档（PRD.md）

> 个人博客系统 · 课程作业

---

## 1. 产品概述

**产品名称**：个人博客（Personal Blog）
**目标用户**：普通访客（浏览文章）、注册用户（发布/管理自己的文章）
**核心价值**：一个极简的个人写作与发布平台，支持 Markdown 写作、分类标签、阅读计数。

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 构建工具 | Vite | 9.x |
| 前端框架 | React | 19.x |
| 类型系统 | TypeScript | 5.x |
| 样式 | Tailwind CSS | 3.x |
| 路由 | react-router-dom | 7.x |
| Markdown 渲染 | react-markdown | 最新 |
| HTTP | axios | 最新 |
| 后端服务 | Supabase | Cloud（Postgres + Auth + Storage） |
| 后端语言 | 无 | Supabase 托管，SQL 直接在 Dashboard 执行 |

---

## 3. 功能清单

### 3.1 访客（未登录）

| # | 功能 | 说明 |
|---|------|------|
| F1 | 浏览首页文章列表 | 按创建时间倒序，分页（每页 6 篇） |
| F2 | 搜索文章 | 按标题或正文模糊匹配（不区分大小写） |
| F3 | 按分类筛选 | 下拉选择分类过滤 |
| F4 | 查看文章详情 | Markdown 渲染、显示封面、分类、标签、阅读数 |
| F5 | 注册账号 | 邮箱 + 密码（至少 6 位） |
| F6 | 登录 | 邮箱 + 密码 |

### 3.2 登录用户（在访客功能基础上）

| # | 功能 | 说明 |
|---|------|------|
| F7 | 写新文章 | 标题、封面、分类、标签、Markdown 正文、发布开关 |
| F8 | 编辑自己的文章 | 从个人中心进入编辑模式 |
| F9 | 删除自己的文章 | 带二次确认 |
| F10 | 个人中心 | 查看所有自己的文章（含草稿），显示用户邮箱和注册时间 |
| F11 | 退出登录 | 清除 session，回到首页 |

### 3.3 数据层（数据库自动保证）

| # | 能力 | 实现位置 |
|---|------|----------|
| D1 | 行级权限隔离 | PostgreSQL RLS |
| D2 | 阅读次数自动 +1 | `increment_post_views()` RPC |
| D3 | `updated_at` 自动维护 | `set_updated_at()` 触发器 |
| D4 | 封面图云存储 | Supabase Storage `post-covers` bucket |

---

## 4. 页面清单与路由

| 路由 | 页面 | 保护 | 主要内容 |
|------|------|------|----------|
| `/` | 首页 HomePage | ❌ | 搜索栏 + 分类筛选 + 文章卡片 + 分页 |
| `/post/:slug` | 文章详情 PostDetailPage | ❌ | 标题 / 封面 / 元信息 / Markdown 正文 |
| `/login` | 登录 LoginPage | ❌ | 邮箱 + 密码表单 |
| `/register` | 注册 RegisterPage | ❌ | 邮箱 + 密码表单 |
| `/write` | 写文章 WritePostPage | ✅ | 完整表单（标题/封面/分类/标签/摘要/正文） |
| `/write?id=xxx` | 编辑文章（同 WritePostPage） | ✅ | 自动填充旧内容 |
| `/profile` | 个人中心 ProfilePage | ✅ | 用户信息 + 我的文章列表 + 编辑/删除 |
| `*` | 404 | ❌ | 提示页 |

---

## 5. 数据库设计

详见同目录 [database.md](./database.md)。核心两张表：`posts`、`categories`；复用 `auth.users`。

---

## 6. 权限矩阵（RLS 规则汇总）

| 操作 | 访客（anon） | 登录用户（自己的文章） | 登录用户（别人的文章） |
|------|-------------|----------------------|----------------------|
| 读已发布文章 | ✅ | ✅ | ✅ |
| 读草稿 | ❌ | ✅ | ❌ |
| 新增文章 | ❌ | ✅（owner_id 强制为自己） | ❌ |
| 修改文章 | ❌ | ✅ | ❌ |
| 删除文章 | ❌ | ✅ | ❌ |
| 浏览分类 | ✅ | ✅ | ✅ |

---

## 7. 项目目录结构

```
blog-demo/
├── .env                          # 本地环境变量（不提交）
├── .env.example                  # 环境变量模板
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── vite.config.ts
├── database.md                   # 数据库设计文档
├── PRD.md                        # 产品需求文档（本文件）
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                  # React 挂载入口
    ├── App.tsx                   # 路由配置
    ├── index.css                 # Tailwind 入口 + 自定义样式
    ├── types/
    │   └── index.ts              # 全局 TS 类型
    ├── lib/
    │   ├── env.ts                # 环境变量读取
    │   └── supabase.ts           # Supabase 客户端单例
    ├── services/
    │   └── postService.ts        # 文章/分类/Storage 的数据访问层
    ├── context/
    │   └── AuthContext.tsx       # 全局认证状态 + signIn/signUp/signOut
    ├── components/
    │   ├── Layout.tsx            # Navbar + Outlet + Footer
    │   ├── Navbar.tsx            # 顶部导航
    │   ├── PostCard.tsx          # 文章卡片
    │   ├── MarkdownRenderer.tsx  # react-markdown 封装
    │   └── ProtectedRoute.tsx    # 路由守卫
    └── pages/
        ├── HomePage.tsx
        ├── PostDetailPage.tsx
        ├── LoginPage.tsx
        ├── RegisterPage.tsx
        ├── WritePostPage.tsx
        └── ProfilePage.tsx
```

---

## 8. 部署与运行

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量并填入真实值
copy .env.example .env

# 3. 开发模式
npm run dev

# 4. 生产构建
npm run build

# 5. 预览生产构建
npm run preview
```

前端跑在 `http://localhost:5173`，后端在 Supabase 云端，不需要启动任何 Node/Express 服务。

---

## 9. 依赖清单

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "axios": "^1.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-markdown": "^9.x",
    "react-router-dom": "^7.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "vite": "^9.x"
  }
}
```

---

## 10. 特色亮点（课程作业加分点）

1. **零后端代码**：后端完全托管给 Supabase，没有 Node/Express，全栈只写 SQL + React
2. **真正的安全下沉**：RLS 在数据库层强制权限，前端即使用 console 改代码也越权不了
3. **`SECURITY DEFINER` RPC**：阅读次数自增这种"公开但需内部提权"的操作，巧妙用函数绕过 RLS
4. **触发器自动维护 `updated_at`**：业务层零负担
5. **完整的 TypeScript 类型贯穿**：数据库字段 → TS interface → 组件 props
6. **前端路由守卫 + 数据库 RLS 双保险**
