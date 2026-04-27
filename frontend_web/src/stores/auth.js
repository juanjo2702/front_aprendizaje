import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/services/api'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // ── Getters ────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInstructor = computed(() => user.value?.role === 'instructor')
  const isStudent = computed(() => user.value?.role === 'student')

  function withAvatarCacheBuster(avatarUrl, stamp = Date.now()) {
    const normalized = String(avatarUrl || '').trim()

    if (!normalized) return normalized

    try {
      const target = new URL(normalized, window.location.origin)
      target.searchParams.set('t', String(stamp))
      return target.toString()
    } catch {
      const [base] = normalized.split('?')
      const separator = base.includes('?') ? '&' : '?'
      return `${base}${separator}t=${stamp}`
    }
  }

  function normalizeUserPayload(payload, options = {}) {
    if (!payload) return payload

    const normalized = { ...payload }

    if (options.bustAvatar && normalized.avatar) {
      normalized.avatar = withAvatarCacheBuster(normalized.avatar, options.timestamp)
    }

    return normalized
  }

  // ── Actions ────────────────────────────────────────────────
  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    setSession(data.token, data.user)
    return data
  }

  async function register(name, email, password, password_confirmation) {
    const { data } = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    })
    setSession(data.token, data.user)
    return data
  }

  async function fetchProfile() {
    const { data } = await api.get('/profile')
    const normalized = normalizeUserPayload(data)
    user.value = normalized
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch (e) {
      // ignore
    }
    clear()
  }

  function setSession(t, u, options = {}) {
    const sessionToken = t || token.value
    const normalized = normalizeUserPayload(u, options)

    token.value = sessionToken
    user.value = normalized

    if (sessionToken) {
      localStorage.setItem('token', sessionToken)
    }

    localStorage.setItem('user', JSON.stringify(normalized))
  }

  function refreshAvatar(avatarUrl, extraUser = null) {
    if (!user.value && !extraUser) return null

    const normalized = normalizeUserPayload(
      {
        ...(user.value || {}),
        ...(extraUser || {}),
        avatar: avatarUrl || extraUser?.avatar || user.value?.avatar || '',
      },
      { bustAvatar: true }
    )

    user.value = normalized
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }

  function clear() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isInstructor,
    isStudent,
    login,
    register,
    fetchProfile,
    logout,
    clear,
    setSession,
    refreshAvatar,
  }
})
