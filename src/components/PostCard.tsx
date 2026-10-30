/**
 * 文章卡片 - 首页列表用
 */
import { Link } from 'react-router-dom'
import type { Post } from '@/types'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  return (
    <article className="card hover:shadow-md transition-shadow">
      <Link to={`/post/${post.slug}`} className="block">
        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <h3 className="text-xl font-bold text-gray-900 hover:text-brand-600 transition-colors">
          {post.title}
        </h3>
      </Link>

      <div className="flex flex-wrap gap-2 mt-3">
        {post.category && (
          <span className="tag">{post.category.name}</span>
        )}
        {post.tags?.slice(0, 3).map((t) => (
          <span key={t} className="tag">#{t}</span>
        ))}
      </div>

      {post.excerpt && (
        <p className="text-gray-600 mt-3 line-clamp-3">{post.excerpt}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400 mt-4">
        <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
        <span>👁 {post.views_count} 次阅读</span>
      </div>
    </article>
  )
}
