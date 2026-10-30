/**
 * 写文章页（登录保护）
 * - 新建 / 编辑文章两用（?id=xxx 则为编辑模式）
 * - 支持上传封面图到 Supabase Storage
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createPost,
  fetchCategories,
  fetchPostById,
  updatePost,
  uploadCoverImage,
} from '@/services/postService'
import type { Category, Post } from '@/types'

export function WritePostPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tagsInput, setTagsInput] = useState('')          // 逗号分隔
  const [categoryId, setCategoryId] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 编辑模式：加载原有文章
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const cats = await fetchCategories()
        if (!cancelled) setCategories(cats)

        if (editId) {
          const post = await fetchPostById(editId)
          if (!cancelled && post) {
            setTitle(post.title)
            setContent(post.content)
            setExcerpt(post.excerpt ?? '')
            setTagsInput(post.tags?.join(', ') ?? '')
            setCategoryId(post.category_id ?? '')
            setCoverUrl(post.cover_url ?? '')
            setIsPublished(post.is_published)
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    }
    init()
    return () => { cancelled = true }
  }, [editId])

  const handleCoverUpload = async (file: File) => {
    try {
      setSubmitting(true)
      const url = await uploadCoverImage(file)
      setCoverUrl(url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const tags = tagsInput
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || null,
        cover_url: coverUrl || null,
        tags,
        category_id: categoryId || null,
        is_published: isPublished,
      }

      let post: Post
      if (editId) {
        post = await updatePost(editId, payload)
      } else {
        post = await createPost(payload)
      }
      navigate(`/post/${post.slug}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {editId ? '编辑文章' : '写新文章'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">❌ {error}</div>
      )}

      <div className="card space-y-4">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            className="input text-lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的文章起个标题..."
          />
        </div>

        {/* 封面图 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
          <div className="flex gap-3 items-center">
            <input
              className="input flex-1"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="图片 URL（可直接粘贴，或点击上传）"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleCoverUpload(f)
              }}
            />
            <button
              type="button"
              className="btn-secondary whitespace-nowrap"
              onClick={() => fileInputRef.current?.click()}
            >📤 上传</button>
          </div>
          {coverUrl && (
            <img
              src={coverUrl}
              alt="preview"
              className="mt-3 w-40 h-24 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">不分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签（用逗号分隔）
          </label>
          <input
            className="input"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="React, TypeScript, Vite"
          />
        </div>

        {/* 摘要 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">摘要（可选）</label>
          <textarea
            className="input h-20 resize-none"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="简短描述这篇文章..."
          />
        </div>

        {/* 正文 Markdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            正文（支持 Markdown）<span className="text-red-500">*</span>
          </label>
          <textarea
            className="input font-mono text-sm leading-6 h-72"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# 标题&#10;&#10;在这里用 **Markdown** 写内容..."
          />
        </div>

        {/* 发布开关 */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          立即发布（取消勾选则保存为草稿）
        </label>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            className="btn-primary"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? '保存中...' : (editId ? '保存修改' : '发布文章')}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >取消</button>
        </div>
      </div>
    </div>
  )
}
