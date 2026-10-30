/**
 * 注册页 - 邮箱 + 密码
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await signUp(email.trim(), password)
      setSuccess('注册成功！请查收邮箱完成验证，然后回到这里登录。')
      // Supabase 默认会发送验证邮件（可在 Dashboard 关掉）
      // 为了课程作业方便体验，可以短暂延迟后跳回登录页
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-6">注册新账号</h1>

      <form className="card space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">❌ {error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">✅ {success}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>

        <p className="text-center text-sm text-gray-500">
          已有账号？{' '}
          <Link to="/login" className="text-brand-600 hover:underline">去登录</Link>
        </p>
      </form>

      <p className="mt-4 text-xs text-gray-400 text-center">
        💡 小贴士：如果你只是想快速体验，可以在 Supabase Dashboard → Authentication → Providers → Email
        里关掉 "Confirm email" 开关，注册后就不需要邮箱验证了。
      </p>
    </div>
  )
}
