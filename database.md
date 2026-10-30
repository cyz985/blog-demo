# 数据库设计文档（database.md）

> 个人博客系统 · 后端：Supabase (PostgreSQL + Row Level Security + Storage)

---

## 1. 技术选型说明

| 层面 | 选型 | 说明 |
|------|------|------|
| 关系型数据库 | PostgreSQL（Supabase 托管） | ACID、丰富数据类型、支持数组 `TEXT[]`、JSONB |
| 用户认证 | Supabase Auth | 邮箱+密码注册/登录，JWT token 自动签发 |
| 权限控制 | Row Level Security (RLS) | 在数据库层强制"作者才能改自己的文章" |
| 文件存储 | Supabase Storage | 封面图放在公开 bucket `post-covers` |
| SQL 函数 | `SECURITY DEFINER` RPC | 阅读次数+1 这种"任何人可调用但需内部提权"的操作用 RPC |

---

## 2. 表结构

### 2.1 `categories` 分类表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | 分类中文名 |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | URL 友好标识 |
| `description` | TEXT | NULL | 描述 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：`slug` 自动唯一索引（UNIQUE 约束带来）

---

### 2.2 `posts` 文章表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| `title` | VARCHAR(200) | NOT NULL | 标题 |
| `slug` | VARCHAR(200) | NOT NULL, UNIQUE | URL 友好标识 |
| `content` | TEXT | NOT NULL | Markdown 原文 |
| `excerpt` | TEXT | NULL | 摘要（可选） |
| `cover_url` | TEXT | NULL | 封面图 URL（Supabase Storage 公开链接） |
| `tags` | TEXT[] | DEFAULT '{}' | 标签数组 |
| `category_id` | UUID | REFERENCES categories(id) ON DELETE SET NULL | 外键 |
| `owner_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 作者（外键到 auth.users 系统表） |
| `views_count` | INTEGER | NOT NULL, DEFAULT 0 | 阅读次数 |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT true | 是否发布（false=草稿） |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 更新时间（触发器自动维护） |

**索引**：
- `idx_posts_owner_id` 按作者查询
- `idx_posts_category` 按分类过滤
- `idx_posts_created` 按创建时间倒序（首页列表）
- `idx_posts_views` 按阅读数倒序（热门排序预留）

---

### 2.3 表关系 ER 图（文字版）

```
auth.users (Supabase 系统表)
    │ 1
    │
    │ N
public.posts ──── N:1 ──── public.categories
    │                            │
    │                            └─ posts.category_id → categories.id
    │
    └─ posts.owner_id → auth.users.id
```

---

## 3. Row Level Security（行级安全策略）

### 3.1 `categories` 表策略

| 策略名 | 操作 | 条件 | 效果 |
|--------|------|------|------|
| `categories_select_all` | SELECT | `true` | 任何人（含未登录）可查 |
| `categories_write_authenticated` | ALL | `auth.role() = 'authenticated'` | 登录用户可增改 |

### 3.2 `posts` 表策略

| 策略名 | 操作 | 条件 | 效果 |
|--------|------|------|------|
| `posts_select_published` | SELECT | `is_published = true` | 任何人可看已发布文章 |
| `posts_select_owner` | SELECT | `owner_id = auth.uid()` | 作者可看自己的草稿 |
| `posts_insert_own` | INSERT | `auth.role()='authenticated' AND owner_id = auth.uid()` | 只能写自己 |
| `posts_update_own` | UPDATE | `owner_id = auth.uid()`（WITH CHECK 同样） | 只能改自己 |
| `posts_delete_own` | DELETE | `owner_id = auth.uid()` | 只能删自己 |

> **RLS 关键点**：策略同时作用于 `WHERE`（过滤现有行）和 `WITH CHECK`（校验新行），双保险防止越权。

---

## 4. 数据库函数

### 4.1 `set_updated_at()` — 自动维护 `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

触发时机：`posts` 表 `BEFORE UPDATE`

### 4.2 `increment_post_views(post_id UUID)` — 阅读次数 +1

```sql
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET views_count = views_count + 1
    WHERE id = post_id AND is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- `SECURITY DEFINER` 让调用者（包括 anon）以函数创建者权限执行，绕过 RLS
- 前端调用：`supabase.rpc('increment_post_views', { post_id })`

---

## 5. Storage Bucket

| Bucket 名 | 访问策略 | 用途 |
|-----------|----------|------|
| `post-covers` | Public | 文章封面图公开访问 |

前端上传代码：
```ts
const { data } = supabase.storage.from('post-covers').getPublicUrl(fileName)
return data.publicUrl
```

---

## 6. 常用查询示例（对应前端实现）

```sql
-- 首页列表：已发布 + 搜索 + 分类 + 分页
SELECT p.*, c.* AS category
FROM posts p LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_published = true
  AND p.title ILIKE '%react%'
ORDER BY p.created_at DESC
LIMIT 6 OFFSET 0;

-- 我的全部文章（含草稿）
SELECT * FROM posts WHERE owner_id = auth.uid() ORDER BY created_at DESC;

-- 按 slug 取详情
SELECT * FROM posts WHERE slug = '我的文章-ab12';
```
