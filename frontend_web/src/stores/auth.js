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
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
    return data
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch (e) {
      // ignore
    }
    clear()
  }

  function setSession(t, u) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
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
  }
})
