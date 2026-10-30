/**
 * Supabase 客户端单例
 * 所有对 Supabase 的操作都通过这里导出的 client 进行
 */
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,          // localStorage 持久化登录态
    autoRefreshToken: true,        // 自动刷新 token
    detectSessionInUrl: true,      // 支持 OAuth 回调
  },
})
