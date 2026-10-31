/**
 * 应用入口组件 - 配置路由
 * - Public 路由：首页、文章详情、登录、注册
 * - Protected 路由：写文章、个人中心（需要登录）
 */
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import { HomePage } from '@/pages/HomePage'
import { PostDetailPage } from '@/pages/PostDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { WritePostPage } from '@/pages/WritePostPage'
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      {/* basename 跟随 vite.config.ts 的 base，保证 GitHub Pages 子路径 /blog-demo/ 下路由正常 */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            {/* 公开路由 */}
            <Route index element={<HomePage />} />
            <Route path="post/:slug" element={<PostDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* 受保护路由 */}
            <Route
              path="write"
              element={
                <ProtectedRoute>
                  <WritePostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="text-center py-24 text-gray-500">
                  <h2 className="text-2xl font-bold mb-2">404</h2>
                  <p>页面不存在</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
