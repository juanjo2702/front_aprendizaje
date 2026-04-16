import axios from 'axios'

function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// ── Standalone API instance (no Quasar dependency) ───────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request interceptor: attach token ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle 401 ─────────────────────────
let redirecting = false

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''

    if (status === 401 && url.includes('/logout')) {
      return Promise.resolve(error.response || { data: { message: 'Sesión cerrada' } })
    }

    if (status === 401 && !redirecting) {
      redirecting = true
      clearStoredSession()

      try {
        if (typeof window !== 'undefined') {
          const isAuthPage = ['/login', '/register'].includes(window.location.pathname)
          if (!isAuthPage) {
            window.location.replace('/login?session=expired')
          }
        }
      } catch (e) {
        console.error('[AUTH] Redirect error:', e)
      } finally {
        setTimeout(() => {
          redirecting = false
        }, 500)
      }
    }

    return Promise.reject(error)
  }
)

export { api }
