/**
 * 个人中心页（登录保护）
 * - 显示当前用户信息
 * - 列出自己发布的所有文章（含草稿）
 * - 支持编辑 / 删除
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { deletePost, fetchMyPosts } from '@/services/postService'
import type { Post } from '@/types'

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchMyPosts()
        if (!cancelled) setPosts(data)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除《${title}》吗？此操作不可恢复。`)) return
    try {
      await deletePost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert('删除失败：' + (e as Error).message)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  return (
    <div className="max-w-3xl mx-auto">
      {/* 用户信息卡 */}
      <section className="card mb-6">
        <h1 className="text-xl font-bold mb-2">👤 个人中心</h1>
        <p className="text-sm text-gray-600">
          <span className="font-medium">邮箱：</span>{user?.email}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">注册时间：</span>
          {user?.created_at ? new Date(user.created_at).toLocaleString() : '-'}
        </p>
        <Link to="/write" className="btn-primary mt-4">✏️ 写新文章</Link>
      </section>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">❌ {error}</div>
      )}

      {/* 我的文章列表 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">📚 我发布的文章（{posts.length}）</h2>

        {posts.length === 0 ? (
          <div className="card text-center text-gray-500">
            还没有发布过文章，<Link to="/write" className="text-brand-600 hover:underline">现在去写一篇</Link>？
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/post/${p.slug}`}
                    className="font-semibold text-gray-900 hover:text-brand-600 truncate block"
                  >
                    {p.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {!p.is_published && <span className="tag bg-yellow-100 text-yellow-700">草稿</span>}
                    <span>📅 {new Date(p.created_at).toLocaleDateString()}</span>
                    <span>👁 {p.views_count}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/write?id=${p.id}`)}
                  >编辑</button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(p.id, p.title)}
                  >删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
