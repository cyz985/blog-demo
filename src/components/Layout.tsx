/**
 * 全局布局 - Navbar + Outlet + Footer
 */
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 text-center text-sm text-gray-400 py-6">
        © {new Date().getFullYear()} 个人博客 · React + TypeScript + Vite + Supabase
      </footer>
    </div>
  )
}
