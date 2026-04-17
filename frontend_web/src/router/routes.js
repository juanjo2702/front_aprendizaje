const routes = [
  // ─── Public ──────────────────────────────────────────────
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/public/HomePage.vue') },
      { path: 'catalog', name: 'public-catalog', component: () => import('pages/public/CatalogPage.vue') },
      {
        path: 'courses/:slug',
        name: 'public-course-detail',
        component: () => import('pages/public/CourseDetailPage.vue'),
      },
    ],
  },

  // ─── Auth ────────────────────────────────────────────────
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

  // ─── Student (The Player) ───────────────────────────────
  {
    path: '/student',
    component: () => import('layouts/StudentLayout.vue'),
    meta: { requiresAuth: true, requiresRole: ['student'] },
    children: [
      {
        path: 'dashboard',
        name: 'student-dashboard',
        component: () => import('pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'store',
        name: 'student-store',
        component: () => import('pages/public/CatalogPage.vue'),
      },
      {
        path: 'courses/:slug',
        name: 'student-course-detail',
        component: () => import('pages/public/CourseDetailPage.vue'),
      },
      {
        path: 'arena/:lessonId',
        name: 'student-arena',
        component: () => import('pages/lessons/LessonPlayerPage.vue'),
      },
      {
        path: 'profile',
        name: 'student-profile',
        component: () => import('pages/user/UserProfilePage.vue'),
      },
      {
        path: 'courses',
        name: 'student-courses',
        component: () => import('pages/user/UserCoursesPage.vue'),
      },
      {
        path: 'activity',
        name: 'student-activity',
        component: () => import('pages/user/UserActivityPage.vue'),
      },
      {
        path: 'badges/my',
        name: 'student-badges-my',
        component: () => import('pages/badges/BadgesPage.vue'),
      },
      {
        path: 'badges/available',
        name: 'student-badges-available',
        component: () => import('pages/badges/AvailableBadgesPage.vue'),
      },
      {
        path: 'badges/:id',
        name: 'student-badge-detail',
        component: () => import('pages/badges/BadgeDetailPage.vue'),
      },
      {
        path: 'certificates',
        name: 'student-certificates',
        component: () => import('pages/certificates/CertificatesPage.vue'),
      },
      {
        path: 'certificates/:id',
        name: 'student-certificate-detail',
        component: () => import('pages/certificates/CertificateDetailPage.vue'),
      },
      {
        path: 'courses/:slug/progress',
        name: 'student-course-progress',
        component: () => import('pages/courses/CourseProgressPage.vue'),
      },
    ],
  },

  // ─── Teacher (The Creator) ──────────────────────────────
  {
    path: '/teacher',
    component: () => import('layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, requiresRole: ['instructor'] },
    children: [
      {
        path: 'dashboard',
        name: 'teacher-dashboard',
        component: () => import('pages/teacher/TeacherDashboardPage.vue'),
      },
      {
        path: 'courses',
        name: 'teacher-courses',
        component: () => import('pages/teacher/CourseBuilderPage.vue'),
      },
      {
        path: 'marketplace',
        name: 'teacher-marketplace',
        component: () => import('pages/public/CatalogPage.vue'),
      },
      {
        path: 'marketplace/:slug',
        name: 'teacher-marketplace-course',
        component: () => import('pages/public/CourseDetailPage.vue'),
      },
      {
        path: 'courses/:slug/preview',
        name: 'teacher-course-preview',
        component: () => import('pages/public/CourseDetailPage.vue'),
        props: { previewMode: true },
      },
      {
        path: 'preview/lesson/:lessonId',
        name: 'teacher-lesson-preview',
        component: () => import('pages/lessons/LessonPlayerPage.vue'),
        props: { previewMode: true },
      },
      {
        path: 'gamification',
        name: 'teacher-gamification',
        component: () => import('pages/teacher/TeacherGamificationPage.vue'),
      },
      {
        path: 'activities',
        name: 'teacher-activities',
        component: () => import('pages/teacher/TeacherActivitiesPage.vue'),
      },
    ],
  },

  // ─── Admin (The Game Master) ────────────────────────────
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresRole: ['admin'] },
    children: [
      {
        path: 'dashboard',
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

  // ─── Legacy Redirects (compatibility) ───────────────────
  { path: '/dashboard', redirect: { name: 'student-dashboard' } },
  { path: '/lessons/:lessonId', redirect: (to) => `/student/arena/${to.params.lessonId}` },
  { path: '/user/profile', redirect: { name: 'student-profile' } },
  { path: '/user/courses', redirect: { name: 'student-courses' } },
  { path: '/user/activity', redirect: { name: 'student-activity' } },
  { path: '/instructor/courses', redirect: { name: 'teacher-courses' } },
  { path: '/admin', redirect: { name: 'admin-dashboard' } },

  // ─── 404 ────────────────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
