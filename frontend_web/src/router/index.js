import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

export default defineRouter(function ({ store, ssrContext }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Debug Vue Router warnings in development
  if (process.env.DEV) {
    const originalWarn = console.warn
    console.warn = function(...args) {
      if (args[0] && args[0].includes('next()')) {
        console.trace('Vue Router deprecated warning trace:')
      }
      originalWarn.apply(console, args)
    }
  }

  // ── Auth Navigation Guard ──────────────────────────────────
  Router.beforeEach((to, _from) => {
    const token = localStorage.getItem('token')
    const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
    const roleRules = to.matched
      .map((r) => r.meta?.requiresRole)
      .filter(Boolean)
      .flat()

    if (to.name === 'home' && token) {
      return resolveHomeRouteByRole()
    }

    if (requiresAuth && !token) {
      return { name: 'login' }
    } else if ((to.name === 'login' || to.name === 'register') && token) {
      return resolveHomeRouteByRole()
    }

    // Role route protection
    if (roleRules.length && token) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        if (!user || !roleRules.includes(user.role)) {
          console.warn('Intento de acceso sin permisos de rol:', to.path)
          return resolveHomeRouteByRole(user?.role)
        }
      } catch (error) {
        console.error('Error verificando permisos de rol:', error)
        return resolveHomeRouteByRole()
      }
    }

    // Navigation continues automatically if no return
    return true
  })

  return Router
})

function resolveHomeRouteByRole(role) {
  const userRole = role || JSON.parse(localStorage.getItem('user') || 'null')?.role

  if (userRole === 'admin') {
    return { name: 'admin-dashboard' }
  }

  if (userRole === 'instructor') {
    return { name: 'teacher-dashboard' }
  }

  return { name: 'student-dashboard' }
}
