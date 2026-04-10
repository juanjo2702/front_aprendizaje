import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../stores/auth.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock the api module
vi.mock('../services/api.js', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

// Import after mock
const { api } = await import('../services/api.js')

describe('Auth Store', () => {
  let authStore

  beforeEach(() => {
    // Setup Pinia
    setActivePinia(createPinia())
    // Clear mocks
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorageMock.clear.mockClear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    // Replace global localStorage
    vi.stubGlobal('localStorage', localStorageMock)
    // Create store
    authStore = useAuthStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should have initial state', () => {
    // Mock localStorage.getItem to return null
    localStorageMock.getItem.mockReturnValue(null)

    expect(authStore.token).toBe(null)
    expect(authStore.user).toBe(null)
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isAdmin).toBe(false)
    expect(authStore.isInstructor).toBe(false)
  })

  it('should set session', () => {
    const token = 'fake-token'
    const user = { id: 1, name: 'Test User', role: 'student' }

    authStore.setSession(token, user)

    expect(authStore.token).toBe(token)
    expect(authStore.user).toEqual(user)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user))
  })

  it('should clear session', () => {
    authStore.token = 'fake-token'
    authStore.user = { id: 1, name: 'Test User' }

    authStore.clear()

    expect(authStore.token).toBe(null)
    expect(authStore.user).toBe(null)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
  })

  describe('login', () => {
    it('should call api.post with credentials', async () => {
      const mockResponse = {
        data: {
          token: 'new-token',
          user: { id: 1, name: 'Test User', role: 'student' },
        },
      }
      api.post.mockResolvedValue(mockResponse)

      const result = await authStore.login('test@example.com', 'password')

      expect(api.post).toHaveBeenCalledWith('/login', {
        email: 'test@example.com',
        password: 'password',
      })
      expect(result).toEqual(mockResponse.data)
      expect(authStore.token).toBe('new-token')
      expect(authStore.user).toEqual(mockResponse.data.user)
    })
  })

  describe('register', () => {
    it('should call api.post with registration data', async () => {
      const mockResponse = {
        data: {
          token: 'reg-token',
          user: { id: 2, name: 'New User', role: 'student' },
        },
      }
      api.post.mockResolvedValue(mockResponse)

      const result = await authStore.register('New User', 'new@example.com', 'password', 'password')

      expect(api.post).toHaveBeenCalledWith('/register', {
        name: 'New User',
        email: 'new@example.com',
        password: 'password',
        password_confirmation: 'password',
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('fetchProfile', () => {
    it('should call api.get and update user', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Updated User', role: 'instructor' },
      }
      api.get.mockResolvedValue(mockResponse)

      const result = await authStore.fetchProfile()

      expect(api.get).toHaveBeenCalledWith('/profile')
      expect(result).toEqual(mockResponse.data)
      expect(authStore.user).toEqual(mockResponse.data)
    })
  })

  describe('logout', () => {
    it('should call api.post and clear session', async () => {
      api.post.mockResolvedValue({})

      await authStore.logout()

      expect(api.post).toHaveBeenCalledWith('/logout')
      expect(authStore.token).toBe(null)
      expect(authStore.user).toBe(null)
    })

    it('should clear session even if api call fails', async () => {
      api.post.mockRejectedValue(new Error('Network error'))

      await authStore.logout()

      expect(authStore.token).toBe(null)
      expect(authStore.user).toBe(null)
    })
  })
})
