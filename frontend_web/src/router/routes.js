const routes = [
  // ─── Public (MainLayout) ────────────────────────────────
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/public/HomePage.vue') },
      { path: 'catalog', name: 'catalog', component: () => import('pages/public/CatalogPage.vue') },
      {
        path: 'courses/:slug',
        name: 'course-detail',
        component: () => import('pages/public/CourseDetailPage.vue'),
      },
    ],
  },

  // ─── Auth (AuthLayout) ──────────────────────────────────
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('pages/auth/LoginPage.vue') },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/auth/RegisterPage.vue'),
      },
      {
        path: 'auth/social-callback',
        name: 'social-callback',
        component: () => import('pages/auth/SocialCallbackPage.vue'),
      },
    ],
  },

  // ─── Protected (MainLayout) ─────────────────────────────
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'lessons/:lessonId',
        name: 'lesson-player',
        component: () => import('pages/lessons/LessonPlayerPage.vue'),
      },
      {
        path: 'user/profile',
        name: 'user-profile',
        component: () => import('pages/user/UserProfilePage.vue'),
      },
      {
        path: 'user/courses',
        name: 'user-courses',
        component: () => import('pages/user/UserCoursesPage.vue'),
      },
      {
        path: 'user/activity',
        name: 'user-activity',
        component: () => import('pages/user/UserActivityPage.vue'),
      },
      {
        path: 'badges/my',
        name: 'badges-my',
        component: () => import('pages/badges/BadgesPage.vue'),
      },
      {
        path: 'badges/available',
        name: 'badges-available',
        component: () => import('pages/badges/AvailableBadgesPage.vue'),
      },
      {
        path: 'badges/:id',
        name: 'badge-detail',
        component: () => import('pages/badges/BadgeDetailPage.vue'),
      },
      {
        path: 'certificates',
        name: 'certificates',
        component: () => import('pages/certificates/CertificatesPage.vue'),
      },
      {
        path: 'certificates/:id',
        name: 'certificate-detail',
        component: () => import('pages/certificates/CertificateDetailPage.vue'),
      },
      {
        path: 'courses/:slug/progress',
        name: 'course-progress',
        component: () => import('pages/courses/CourseProgressPage.vue'),
      },
    ],
  },

  // ─── Admin (AdminLayout) ────────────────────────────────
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('pages/admin/AdminDashboardPage.vue'),
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('pages/admin/UsersListPage.vue'),
      },
      {
        path: 'users/create',
        name: 'admin-users-create',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'users/roles',
        name: 'admin-users-roles',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'courses',
        name: 'admin-courses',
        component: () => import('pages/admin/CoursesListPage.vue'),
      },
      {
        path: 'courses/create',
        name: 'admin-courses-create',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('pages/admin/CategoriesListPage.vue'),
      },
      {
        path: 'lessons',
        name: 'admin-lessons',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'quizzes',
        name: 'admin-quizzes',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'games',
        name: 'admin-games',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'payments',
        name: 'admin-payments',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'subscriptions',
        name: 'admin-subscriptions',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'logs',
        name: 'admin-logs',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
      {
        path: 'backup',
        name: 'admin-backup',
        component: () => import('pages/admin/AdminPlaceholderPage.vue'),
      },
    ],
  },

  // ─── 404 ────────────────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
