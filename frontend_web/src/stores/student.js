import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'

const QUEUE_STORAGE_KEY = 'student-progress-queue'

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function persistQueue(queue) {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
}

function calculateLevelSummary(totalPoints = 0) {
  const xp = Number(totalPoints || 0)
  const level = Math.floor(xp / 250) + 1
  const currentFloor = (level - 1) * 250
  const nextLevelAt = level * 250
  const currentXp = xp - currentFloor
  const requiredXp = nextLevelAt - currentFloor

  return {
    totalXp: xp,
    level,
    currentXp,
    requiredXp,
    progress: requiredXp ? currentXp / requiredXp : 0,
    nextLevelAt,
    coins: Math.floor(xp / 5),
    earnedCoins: Math.floor(xp / 5),
    spentCoins: 0,
    levelTitle: level >= 10 ? 'Maestro' : level >= 5 ? 'Veterano' : 'Explorador',
  }
}

function buildSummaryFromStats(stats = {}) {
  const fallback = calculateLevelSummary(stats.total_points || 0)

  return {
    ...fallback,
    level: Number(stats.current_level || fallback.level),
    coins: Number(stats.available_coins ?? fallback.coins),
    earnedCoins: Number(stats.earned_coins ?? fallback.earnedCoins),
    spentCoins: Number(stats.spent_coins ?? fallback.spentCoins),
    levelTitle: stats.level_title || fallback.levelTitle,
  }
}

function inferSkillLabel(courseOrActivity = {}) {
  const text = [
    courseOrActivity?.category?.name,
    courseOrActivity?.course?.title,
    courseOrActivity?.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/frontend|ui|ux|css|design|quasar|vue/.test(text)) return 'Diseno'
  if (/backend|laravel|api|logica|python|data|machine|devops/.test(text)) return 'Logica'
  if (/negocio|business|marketing|ventas|emprendimiento/.test(text)) return 'Negocios'
  if (/data|machine|analytics|sql|bi/.test(text)) return 'Analitica'
  if (/comunicacion|liderazgo|soft/.test(text)) return 'Comunicacion'

  return 'Producto'
}

function buildSkillRadar(activeCourses = [], activities = []) {
  const buckets = new Map([
    ['Logica', 20],
    ['Diseno', 20],
    ['Negocios', 20],
    ['Analitica', 20],
    ['Producto', 20],
    ['Comunicacion', 20],
  ])

  activeCourses.forEach((course) => {
    const key = inferSkillLabel(course)
    buckets.set(key, Math.min(100, (buckets.get(key) || 0) + Math.round((course.progress || 0) * 0.35)))
  })

  activities.forEach((activity) => {
    const key = inferSkillLabel(activity)
    const baseGain = activity.type === 'certificate' ? 15 : 9
    buckets.set(key, Math.min(100, (buckets.get(key) || 0) + baseGain))
  })

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
}

export const useStudentStore = defineStore('student', () => {
  const ready = ref(false)
  const dashboardLoading = ref(false)
  const marketplaceLoading = ref(false)
  const inventoryLoading = ref(false)
  const learningLoading = ref(false)
  const paymentLoading = ref(false)
  const currentCourseLoading = ref(false)
  const shopLoading = ref(false)

  const dashboard = ref({
    summary: calculateLevelSummary(0),
    streak: 0,
    activeCourses: [],
    recentActivity: [],
    radarSkills: [],
    recentPurchases: [],
  })
  const learningCourses = ref([])
  const badgesUnlocked = ref([])
  const badgesLocked = ref([])
  const certificates = ref([])
  const marketplace = ref({
    courses: [],
    categories: [],
    pagination: {
      page: 1,
      lastPage: 1,
      total: 0,
    },
    filters: {
      search: '',
      category: null,
      level: null,
      price: null,
      gamification: null,
      sort: 'newest',
    },
  })
  const inventory = ref({
    equipped: {
      frame: null,
      title: null,
    },
    miniProfile: null,
    locker: {
      frames: [],
      titles: [],
      extras: [],
      coupons: [],
    },
  })
  const shop = ref({
    items: [],
    purchases: [],
    filters: {
      type: null,
    },
  })
  const currentCourse = ref(null)
  const currentCourseProgress = ref(null)
  const paymentIntent = ref(null)
  const miniProfiles = ref({})
  const pendingProgressQueue = ref(safeJsonParse(localStorage.getItem(QUEUE_STORAGE_KEY), []))

  let flushPromise = null
  let reconnectBound = false
  let paymentPoller = null

  const activeCourses = computed(() => dashboard.value.activeCourses)
  const gamificationSummary = computed(() => ({
    ...dashboard.value.summary,
    streak: dashboard.value.streak,
  }))
  const availableCoins = computed(() => Number(gamificationSummary.value.coins || 0))

  function bindReconnectListener() {
    if (reconnectBound || typeof window === 'undefined') return
    reconnectBound = true
    window.addEventListener('online', () => {
      flushPendingProgress()
    })
  }

  function updateQueue(queue) {
    pendingProgressQueue.value = queue
    persistQueue(queue)
  }

  function mergeEconomy(economy = {}) {
    if (!economy || typeof economy !== 'object') return

    dashboard.value.summary = {
      ...dashboard.value.summary,
      level: Number(economy.level || dashboard.value.summary.level),
      levelTitle: economy.level_title || dashboard.value.summary.levelTitle,
      coins: Number(economy.available_coins ?? dashboard.value.summary.coins),
      earnedCoins: Number(economy.earned_coins ?? dashboard.value.summary.earnedCoins),
      spentCoins: Number(economy.spent_coins ?? dashboard.value.summary.spentCoins),
      totalXp: Number(economy.total_xp ?? dashboard.value.summary.totalXp),
    }
  }

  function normalizePurchaseRecord(purchase) {
    return {
      id: purchase.id,
      status: purchase.status,
      purchasedAt: purchase.purchased_at,
      costCoins: Number(purchase.cost_coins || 0),
      metadata: purchase.metadata || {},
      shopItem: purchase.shop_item || purchase.shopItem || null,
    }
  }

  async function primeWorkspace() {
    bindReconnectListener()
    await Promise.all([loadDashboard(), loadInventory(), loadShop(), loadPurchases()])
    ready.value = true
    await flushPendingProgress()
  }

  async function loadDashboard() {
    dashboardLoading.value = true
    try {
      const [dashboardRes, activityRes] = await Promise.all([
        api.get('/user/dashboard-stats'),
        api.get('/user/recent-activity', { params: { limit: 12 } }),
      ])

      const stats = dashboardRes.data?.stats || {}
      const active = (dashboardRes.data?.courses?.recent || []).map((entry) => ({
        id: entry.course?.id || entry.id,
        slug: entry.course?.slug,
        title: entry.course?.title,
        instructor: entry.course?.instructor?.name,
        progress: Number(entry.progress || 0),
        category: entry.course?.category || null,
      }))
      const recentActivity = activityRes.data?.activities || []
      const recentPurchases = (dashboardRes.data?.activities?.recent_purchases || []).map(normalizePurchaseRecord)

      dashboard.value = {
        summary: buildSummaryFromStats(stats),
        streak: Number(stats.current_streak || 0),
        activeCourses: active,
        recentActivity,
        radarSkills: buildSkillRadar(active, recentActivity),
        recentPurchases,
      }
    } finally {
      dashboardLoading.value = false
    }
  }

  async function loadMyLearning(params = {}) {
    learningLoading.value = true
    try {
      const { data } = await api.get('/user/courses', {
        params: {
          per_page: 24,
          sort: params.sort || 'recent',
          status: params.status || undefined,
        },
      })

      learningCourses.value = (data?.data || []).map((enrollment) => ({
        id: enrollment.id,
        progress: Number(enrollment.progress || 0),
        enrolledAt: enrollment.enrolled_at,
        updatedAt: enrollment.updated_at,
        course: {
          id: enrollment.course?.id,
          slug: enrollment.course?.slug,
          title: enrollment.course?.title,
          thumbnail: enrollment.course?.thumbnail,
          level: enrollment.course?.level,
          language: enrollment.course?.language,
          instructor: enrollment.course?.instructor?.name,
        },
      }))

      return learningCourses.value
    } finally {
      learningLoading.value = false
    }
  }

  async function loadInventory() {
    inventoryLoading.value = true
    try {
      const [myBadgesRes, availableBadgesRes, certificatesRes, inventoryRes, purchasesRes] = await Promise.all([
        api.get('/badges/my'),
        api.get('/badges/available'),
        api.get('/certificates', { params: { per_page: 50 } }),
        api.get('/student/inventory'),
        api.get('/shop/purchases', { params: { per_page: 50 } }),
      ])

      badgesUnlocked.value = myBadgesRes.data?.badges || []
      badgesLocked.value = availableBadgesRes.data?.badges || []
      certificates.value = certificatesRes.data?.data || []
      inventory.value = {
        equipped: inventoryRes.data?.equipped || {
          frame: null,
          title: null,
        },
        miniProfile: inventoryRes.data?.mini_profile || null,
        locker: {
          frames: inventoryRes.data?.locker?.frames || [],
          titles: inventoryRes.data?.locker?.titles || [],
          extras: inventoryRes.data?.locker?.extras || [],
          coupons: inventoryRes.data?.locker?.coupons || [],
        },
      }
      shop.value.purchases = (purchasesRes.data?.data || []).map(normalizePurchaseRecord)
      mergeEconomy(inventoryRes.data?.economy || purchasesRes.data?.economy)
    } finally {
      inventoryLoading.value = false
    }
  }

  async function loadMarketplace(filters = {}) {
    marketplaceLoading.value = true
    try {
      const mergedFilters = {
        ...marketplace.value.filters,
        ...filters,
      }

      marketplace.value.filters = mergedFilters

      const [coursesRes, categoriesRes] = await Promise.all([
        api.get('/courses', {
          params: {
            search: mergedFilters.search || undefined,
            category: mergedFilters.category || undefined,
            level: mergedFilters.level || undefined,
            price: mergedFilters.price || undefined,
            gamification: mergedFilters.gamification,
            sort: mergedFilters.sort || 'newest',
            per_page: 12,
            page: mergedFilters.page || 1,
          },
        }),
        api.get('/categories'),
      ])

      marketplace.value.courses = coursesRes.data?.data || []
      marketplace.value.categories = categoriesRes.data?.data || categoriesRes.data || []
      marketplace.value.pagination = {
        page: Number(coursesRes.data?.current_page || 1),
        lastPage: Number(coursesRes.data?.last_page || 1),
        total: Number(coursesRes.data?.total || 0),
      }
    } finally {
      marketplaceLoading.value = false
    }
  }

  async function loadCourseDetail(slug) {
    currentCourseLoading.value = true
    try {
      const { data } = await api.get(`/courses/${slug}`)
      currentCourse.value = data
      currentCourseProgress.value = null

      if (data?.id && data?.is_enrolled) {
        try {
          const progressRes = await api.get(`/user/courses/${data.id}/progress`)
          currentCourseProgress.value = progressRes.data
        } catch {
          currentCourseProgress.value = null
        }
      }

      return {
        course: currentCourse.value,
        progress: currentCourseProgress.value,
      }
    } finally {
      currentCourseLoading.value = false
    }
  }

  async function createPaymentIntent(courseId, couponCode = '') {
    paymentLoading.value = true
    try {
      const { data } = await api.post('/payments/intent', {
        course_id: courseId,
        coupon_code: couponCode || undefined,
      })
      paymentIntent.value = data
      return data
    } finally {
      paymentLoading.value = false
    }
  }

  async function loadShop(filters = {}) {
    shopLoading.value = true
    try {
      shop.value.filters = {
        ...shop.value.filters,
        ...filters,
      }

      const { data } = await api.get('/shop/items', {
        params: {
          type: shop.value.filters.type || undefined,
        },
      })

      shop.value.items = data?.items || []
      mergeEconomy(data?.economy)
      return shop.value.items
    } finally {
      shopLoading.value = false
    }
  }

  async function loadPurchases() {
    const { data } = await api.get('/shop/purchases', { params: { per_page: 50 } })
    shop.value.purchases = (data?.data || []).map(normalizePurchaseRecord)
    mergeEconomy(data?.economy)
    return shop.value.purchases
  }

  async function purchaseShopItem(itemId) {
    const { data } = await api.post(`/shop/items/${itemId}/purchase`)
    mergeEconomy(data?.economy)
    await Promise.all([loadShop(shop.value.filters), loadPurchases(), loadDashboard(), loadInventory()])
    return data
  }

  async function equipInventoryItem(userItemId, equipped) {
    const auth = useAuthStore()
    const { data } = await api.post('/student/inventory/equip', {
      user_item_id: userItemId,
      equipped,
    })

    if (data?.auth_user && auth.token) {
      auth.setSession(auth.token, data.auth_user)
    }

    await loadInventory()
    return data
  }

  async function loadMiniProfile(userId, options = {}) {
    const cacheKey = String(userId)
    if (!options.force && miniProfiles.value[cacheKey]) {
      return miniProfiles.value[cacheKey]
    }

    const { data } = await api.get(`/users/${userId}/mini-profile`)
    miniProfiles.value = {
      ...miniProfiles.value,
      [cacheKey]: data?.profile || null,
    }

    return miniProfiles.value[cacheKey]
  }

  function clearPaymentIntent() {
    paymentIntent.value = null
    if (paymentPoller) {
      clearInterval(paymentPoller)
      paymentPoller = null
    }
  }

  function startPaymentStatusPolling(transactionId, onCompleted) {
    if (!transactionId || typeof window === 'undefined') return
    if (paymentPoller) clearInterval(paymentPoller)

    paymentPoller = window.setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/${transactionId}`)
        if (data?.status === 'completed') {
          clearInterval(paymentPoller)
          paymentPoller = null
          if (typeof onCompleted === 'function') onCompleted()
        }
      } catch {
        // polling silencioso
      }
    }, 3500)
  }

  function applyProgressSnapshot(snapshot) {
    if (!snapshot?.overall_progress) return
    const updatedProgress = Number(snapshot.overall_progress || snapshot.overall_progress?.percentage || 0)

    dashboard.value.activeCourses = dashboard.value.activeCourses.map((course) => {
      if (course.id === currentCourse.value?.id) {
        return { ...course, progress: updatedProgress }
      }
      return course
    })

    learningCourses.value = learningCourses.value.map((entry) => {
      if (entry.course?.id === currentCourse.value?.id) {
        return { ...entry, progress: updatedProgress }
      }
      return entry
    })
  }

  function applyXpGain(xpAwarded = 0) {
    if (!xpAwarded) return
    const nextXp = (dashboard.value.summary?.totalXp || 0) + Number(xpAwarded || 0)
    const recalculated = calculateLevelSummary(nextXp)
    const spentCoins = Number(dashboard.value.summary?.spentCoins || 0)

    dashboard.value.summary = {
      ...recalculated,
      coins: Math.max(0, recalculated.coins - spentCoins),
      earnedCoins: recalculated.coins,
      spentCoins,
    }
  }

  function enqueueProgressAction(action) {
    updateQueue([
      ...pendingProgressQueue.value,
      {
        ...action,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  async function submitLessonCompletion(lessonId, payload = {}) {
    if (!navigator.onLine) {
      enqueueProgressAction({ type: 'lesson', lessonId, payload })
      return { queued: true }
    }

    const { data } = await api.post(`/lessons/${lessonId}/complete`, payload)
    applyProgressSnapshot(data?.progress)
    return data
  }

  async function submitInteractiveCompletion(lessonId, payload = {}) {
    if (!navigator.onLine) {
      enqueueProgressAction({ type: 'interactive', lessonId, payload })
      return { queued: true }
    }

    const { data } = await api.post(`/lessons/${lessonId}/interactive-complete`, payload)
    applyProgressSnapshot(data?.progress)
    applyXpGain(data?.xp_awarded)
    return data
  }

  async function flushPendingProgress() {
    if (flushPromise || !pendingProgressQueue.value.length || !navigator.onLine) {
      return flushPromise
    }

    flushPromise = (async () => {
      const remaining = []

      for (const action of pendingProgressQueue.value) {
        try {
          if (action.type === 'interactive') {
            await api.post(`/lessons/${action.lessonId}/interactive-complete`, action.payload)
          } else {
            await api.post(`/lessons/${action.lessonId}/complete`, action.payload)
          }
        } catch {
          remaining.push(action)
        }
      }

      updateQueue(remaining)
      flushPromise = null
    })()

    return flushPromise
  }

  return {
    ready,
    dashboardLoading,
    marketplaceLoading,
    inventoryLoading,
    learningLoading,
    paymentLoading,
    currentCourseLoading,
    shopLoading,
    dashboard,
    activeCourses,
    gamificationSummary,
    availableCoins,
    learningCourses,
    badgesUnlocked,
    badgesLocked,
    certificates,
    marketplace,
    inventory,
    shop,
    currentCourse,
    currentCourseProgress,
    paymentIntent,
    miniProfiles,
    pendingProgressQueue,
    primeWorkspace,
    loadDashboard,
    loadMyLearning,
    loadInventory,
    loadMarketplace,
    loadCourseDetail,
    createPaymentIntent,
    loadShop,
    loadPurchases,
    purchaseShopItem,
    equipInventoryItem,
    loadMiniProfile,
    clearPaymentIntent,
    startPaymentStatusPolling,
    submitLessonCompletion,
    submitInteractiveCompletion,
    flushPendingProgress,
  }
})
