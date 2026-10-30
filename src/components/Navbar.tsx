/**
 * 顶部导航栏 - 显示 Logo、菜单、登录状态
 */
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm transition-colors ${
      isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-brand-700">
          <span className="text-2xl">📝</span>
          <span>我的博客</span>
        </Link>

        {/* 主菜单 */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/" end className={linkClass}>首页</NavLink>
          {user && (
            <NavLink to="/write" className={linkClass}>写文章</NavLink>
          )}
        </div>

        <div className="flex-1" />

        {/* 用户区域 */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {user.email}
            </span>
            <Link to="/profile" className="btn-secondary">个人中心</Link>
            <button onClick={handleLogout} className="btn-danger">退出</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">登录</Link>
            <Link to="/register" className="btn-primary">注册</Link>
          </div>
        )}
      </nav>
    </header>
  )
}
