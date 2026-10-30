/**
 * 首页 - 文章列表 + 搜索 + 分类过滤 + 分页
 */
import { useEffect, useState } from 'react'
import { fetchPosts, fetchCategories } from '@/services/postService'
import type { Post, Category, PaginatedResult } from '@/types'
import { PostCard } from '@/components/PostCard'

export function HomePage() {
  const [result, setResult] = useState<PaginatedResult<Post> | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 6

  // 加载数据
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [postsResult, cats] = await Promise.all([
          fetchPosts({ page, pageSize, keyword, categoryId: categoryId || null }),
          categories.length ? Promise.resolve(categories) : fetchCategories(),
        ])
        if (!cancelled) {
          setResult(postsResult)
          setCategories(cats)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, categoryId])

  const handleSearch = () => {
    setPage(1)
    setKeyword(searchInput)
  }

  return (
    <div>
      {/* 搜索 + 过滤区 */}
      <section className="mb-8 card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">我的博客</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* 搜索框 */}
          <div className="flex-1 flex gap-2">
            <input
              className="input"
              placeholder="🔍 搜索标题或内容..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" onClick={handleSearch}>搜索</button>
          </div>

          {/* 分类过滤 */}
          <select
            className="input sm:w-40"
            value={categoryId}
            onChange={(e) => { setPage(1); setCategoryId(e.target.value) }}
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">❌ {error}</div>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {/* 文章列表 */}
      {!loading && result && result.data.length === 0 && (
        <div className="text-center py-12 text-gray-500">暂无文章</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {result?.data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* 分页 */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >上一页</button>
          <span className="text-sm text-gray-600">
            第 {page} / {result.totalPages} 页（共 {result.total} 篇）
          </span>
          <button
            className="btn-secondary"
            disabled={page >= result.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >下一页</button>
        </div>
      )}
    </div>
  )
}
