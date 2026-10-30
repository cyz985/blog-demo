/**
 * 环境变量读取与校验
 * 所有 Vite 暴露的变量都以 VITE_ 开头
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[env] 缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请在项目根目录创建 .env 文件并填入值。'
  )
}
