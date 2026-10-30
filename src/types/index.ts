/**
 * 全局类型定义
 * 与数据库表结构对应
 */

/** 分类 */
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

/** 文章 */
export interface Post {
  id: string
  title: string
  slug: string
  content: string           // Markdown 原文
  excerpt: string | null
  cover_url: string | null
  tags: string[]
  category_id: string | null
  owner_id: string
  views_count: number
  is_published: boolean
  created_at: string
  updated_at: string
  // 联表字段（查询时额外返回）
  category?: Category | null
}

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页结果 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
