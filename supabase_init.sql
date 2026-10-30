-- ============================================================
-- 个人博客系统 - 数据库初始化脚本
-- 技术栈: Supabase (PostgreSQL) + Row Level Security
-- 使用方式: Supabase Dashboard → SQL Editor → 粘贴执行
-- ============================================================

-- ---------- 1. 分类表 categories ----------
CREATE TABLE IF NOT EXISTS public.categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    slug        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 2. 文章表 posts ----------
CREATE TABLE IF NOT EXISTS public.posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    content         TEXT NOT NULL,                          -- Markdown 原文
    excerpt         TEXT,                                    -- 摘要
    cover_url       TEXT,                                    -- 封面图（Supabase Storage URL）
    tags            TEXT[] DEFAULT '{}',                     -- 标签数组
    category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    views_count     INTEGER NOT NULL DEFAULT 0,              -- 阅读次数
    is_published    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 3. 自动更新 updated_at 触发器 ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 4. 索引优化 ----------
CREATE INDEX IF NOT EXISTS idx_posts_owner_id   ON public.posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_posts_category   ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created    ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_views      ON public.posts(views_count DESC);

-- ---------- 5. categories 表 RLS ----------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 所有人可查看分类
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
    ON public.categories FOR SELECT
    USING (true);

-- 仅认证用户可增改分类
DROP POLICY IF EXISTS "categories_write_authenticated" ON public.categories;
CREATE POLICY "categories_write_authenticated"
    ON public.categories FOR ALL
    USING (auth.role() = 'authenticated');

-- ---------- 6. posts 表 RLS ----------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 已发布文章：所有人可读取
DROP POLICY IF EXISTS "posts_select_published" ON public.posts;
CREATE POLICY "posts_select_published"
    ON public.posts FOR SELECT
    USING (is_published = true);

-- 作者本人：可读取自己的所有文章（含未发布）
DROP POLICY IF EXISTS "posts_select_owner" ON public.posts;
CREATE POLICY "posts_select_owner"
    ON public.posts FOR SELECT
    USING (owner_id = auth.uid());

-- 插入：必须是登录用户，且 owner_id 必须是自己
DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own"
    ON public.posts FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND owner_id = auth.uid()
    );

-- 更新：只能更新自己的文章
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own"
    ON public.posts FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 删除：只能删除自己的文章
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own"
    ON public.posts FOR DELETE
    USING (owner_id = auth.uid());

-- ---------- 7. 阅读次数自增函数 ----------
-- 用于在浏览文章详情时安全地 views_count +1（任何人都能调用）
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET views_count = views_count + 1
    WHERE id = post_id AND is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予 anon 和 authenticated 角色都能调用这个函数
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO anon, authenticated;

-- ---------- 8. 初始化一些示例分类 ----------
INSERT INTO public.categories (name, slug, description) VALUES
    ('技术', 'tech',     '技术相关文章'),
    ('生活', 'life',     '生活随笔'),
    ('读书笔记', 'books', '读书笔记与思考'),
    ('项目', 'projects', '项目记录与复盘')
ON CONFLICT (slug) DO NOTHING;

-- ---------- 9. Storage bucket（封面图存储） ----------
-- 创建公开 bucket：post-covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-covers', 'post-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 允许任何人读取 post-covers 中的文件
DROP POLICY IF EXISTS "post_covers_public_read" ON storage.objects;
CREATE POLICY "post_covers_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'post-covers');

-- 允许登录用户上传/更新/删除 post-covers 中的文件
DROP POLICY IF EXISTS "post_covers_auth_write" ON storage.objects;
CREATE POLICY "post_covers_auth_write"
    ON storage.objects FOR ALL
    USING (bucket_id = 'post-covers' AND auth.role() = 'authenticated');

-- ---------- 10. 表级授权（RLS 之上还需要表级 GRANT） ----------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- ---------- 11. 刷新 PostgREST schema 缓存 ----------
NOTIFY pgrst, 'reload schema';
