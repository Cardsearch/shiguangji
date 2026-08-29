import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = import.meta.env.VITE_TCB_ENV
const REGION = import.meta.env.VITE_TCB_REGION || 'ap-shanghai'
const ACCESS_KEY = import.meta.env.VITE_TCB_ACCESS_KEY

if (!ENV_ID) throw new Error('缺少 VITE_TCB_ENV 环境变量')
if (!ACCESS_KEY) throw new Error('缺少 VITE_TCB_ACCESS_KEY（publishable key）')

// 浏览器直连 CloudBase 的前提：访问来源必须在环境「安全域名」白名单内（CORS/鉴权）。
// 已配置：本地开发 localhost:5173 与 127.0.0.1:4173（M0 手动添加，ENABLE）；
// 线上 shiguangji-*.webapps.tcloudbase.com 命中系统通配 *.webapps.tcloudbase.com。
// 新增部署域名时需用 envDomainManagement 同步添加。
export const app = cloudbase.init({
  env: ENV_ID,
  region: REGION,
  accessKey: ACCESS_KEY,
  auth: { detectSessionInUrl: true },
})

// Web SDK v3：app.auth 为属性；登录校验一律用 auth.getSession()（data.session 为准）
export const auth = app.auth
export const db = app.database()
export const _ = db.command
