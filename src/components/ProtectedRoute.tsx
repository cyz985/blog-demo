/**
 * 路由守卫 - 要求用户已登录
 * 未登录时重定向到 /login
 */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        加载中...
      </div>
    )
  }

  if (!user) {
    // 保存当前目标路径，登录后可以跳回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
