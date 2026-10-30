/**
 * 文章服务层 - 封装所有对 posts / categories 的数据库操作
 * 所有方法都依赖 supabase 客户端（RLS 会自动根据当前 session 生效）
 */
import { supabase } from '@/lib/supabase'
import type { Post, Category, PaginatedResult } from '@/types'

/** 生成 slug（简单版：小写 + 空格换 -） */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .slice(0, 200)
}

/* ===================== 分类 ===================== */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/* ===================== 文章 ===================== */

/** 获取文章列表（支持搜索 + 分类过滤 + 分页） */
export async function fetchPosts(params: {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: string | null
} = {}): Promise<PaginatedResult<Post>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const keyword = params.keyword?.trim() ?? ''
  const categoryId = params.categoryId

  // 基础查询：只取已发布的文章
  let query = supabase
    .from('posts')
    .select('*, category:categories(*)', { count: 'exact' })
    .eq('is_published', true)

  if (keyword) {
    // 标题或内容模糊搜索（ilike = 不区分大小写）
    query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return {
    data: (data ?? []) as Post[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/** 按 slug 获取单篇文章（含分类） */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as Post) ?? null
}

/** 按 id 获取文章详情 */
export async function fetchPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Post) ?? null
}

/** 调用 RPC 让阅读次数 +1（SECURITY DEFINER，任何人都能调） */
export async function incrementViews(postId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_post_views', { post_id: postId })
  if (error) console.warn('[incrementViews]', error.message)
}

/* ===================== 我的文章（当前登录用户） ===================== */

export async function fetchMyPosts(): Promise<Post[]> {
  // RLS 会自动过滤 owner_id = auth.uid()
  const { data, error } = await supabase
    .from('posts')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Post[]
}

/** 创建文章 */
export async function createPost(payload: {
  title: string
  content: string
  excerpt?: string | null
  cover_url?: string | null
  tags?: string[]
  category_id?: string | null
  is_published?: boolean
}): Promise<Post> {
  const slug = slugify(payload.title) + '-' + Math.random().toString(36).slice(2, 6)
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: payload.title,
      slug,
      content: payload.content,
      excerpt: payload.excerpt ?? null,
      cover_url: payload.cover_url ?? null,
      tags: payload.tags ?? [],
      category_id: payload.category_id ?? null,
      is_published: payload.is_published ?? true,
      // owner_id 由 RLS 策略强制要求与 auth.uid() 一致
    })
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data as Post
}

/** 更新文章（RLS 保证只能更新自己的） */
export async function updatePost(
  id: string,
  payload: Partial<Omit<Post, 'id' | 'owner_id' | 'created_at' | 'views_count'>>
): Promise<Post> {
  const finalPayload: Record<string, unknown> = { ...payload }
  if (payload.title) {
    finalPayload.slug = slugify(payload.title) + '-' + id.slice(0, 4)
  }
  const { data, error } = await supabase
    .from('posts')
    .update(finalPayload)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single()
  if (error) throw error
  return data as Post
}

/** 删除文章（RLS 保证只能删除自己的） */
export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

/* ===================== 封面图上传 ===================== */

/** 上传封面图到 Supabase Storage 的 post-covers bucket */
export async function uploadCoverImage(
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop() ?? 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const bucket = 'post-covers'

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: false })

  if (uploadError) throw uploadError

  // 生成公开访问 URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}
