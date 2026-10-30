/**
 * 文章详情页
 * - 阅读次数自动 +1（调用 increment_post_views RPC）
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPostBySlug, incrementViews } from '@/services/postService'
import type { Post } from '@/types'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPostBySlug(slug as string)
        if (!cancelled) {
          if (!data) {
            setError('文章不存在')
          } else {
            setPost(data)
            // 阅读次数 +1
            incrementViews(data.id)
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>
  if (error) {
    return (
      <div className="card text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="btn-primary">返回首页</Link>
      </div>
    )
  }
  if (!post) return null

  return (
    <article className="card max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-brand-600 hover:underline mb-4 inline-block">
        ← 返回首页
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
        {post.category && (
          <span className="tag">{post.category.name}</span>
        )}
        <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
        <span>👁 {post.views_count} 次阅读</span>
      </div>

      {post.cover_url && (
        <img
          src={post.cover_url}
          alt={post.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>
      )}

      <MarkdownRenderer content={post.content} />
    </article>
  )
}
