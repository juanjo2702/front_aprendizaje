const routes = [
  // ─── Public ──────────────────────────────────────────────
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/public/HomePage.vue') },
      { path: 'catalog', name: 'public-catalog', component: () => import('pages/public/CatalogPage.vue') },
      {
        path: 'certificates/verify/:certificateCode',
        name: 'public-certificate-verify',
        component: () => import('pages/public/CertificateVerificationPage.vue'),
        props: true,
      },
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
        component: () => import('pages/student/StudentDashboardPage.vue'),
        meta: {
          studentTitle: 'Dashboard estudiantil',
          studentCrumbs: [{ label: 'Dashboard' }],
        },
      },
      {
        path: 'marketplace',
        name: 'student-marketplace',
        component: () => import('pages/student/StudentMarketplacePage.vue'),
        meta: {
          studentTitle: 'Marketplace',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Marketplace' },
          ],
        },
      },
      {
        path: 'shop',
        name: 'student-shop',
        component: () => import('pages/student/StudentShopPage.vue'),
        meta: {
          studentTitle: 'Coin Shop',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Coin Shop' },
          ],
        },
      },
      {
        path: 'marketplace/:slug',
        name: 'student-course-detail',
        component: () => import('pages/student/StudentCourseDetailPage.vue'),
        meta: {
          studentTitle: 'Detalle del curso',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Marketplace', to: { name: 'student-marketplace' } },
            { label: 'Detalle del curso' },
          ],
        },
      },
      {
        path: 'my-learning',
        name: 'student-my-learning',
        component: () => import('pages/student/StudentMyLearningPage.vue'),
        meta: {
          studentTitle: 'Mi aprendizaje',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Mi aprendizaje' },
          ],
        },
      },
      {
        path: 'learn/:lessonId',
        name: 'student-learning',
        component: () => import('pages/student/StudentLearningPlayerPage.vue'),
        meta: {
          studentTitle: 'Learning Player',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Mi aprendizaje', to: { name: 'student-my-learning' } },
            { label: 'Lección' },
          ],
        },
      },
      {
        path: 'inventory',
        name: 'student-inventory',
        component: () => import('pages/student/StudentInventoryPage.vue'),
        meta: {
          studentTitle: 'Inventario',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Inventario' },
          ],
        },
      },
      {
        path: 'profile',
        name: 'student-profile',
        component: () => import('pages/user/UserProfilePage.vue'),
        meta: {
          studentTitle: 'Mi perfil',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Mi perfil' },
          ],
        },
      },
      {
        path: 'certificates',
        name: 'student-certificates-vault',
        component: () => import('pages/student/StudentCertificatesVaultPage.vue'),
        meta: {
          studentTitle: 'Bóveda de certificados',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Certificados' },
          ],
        },
      },
      {
        path: 'certificates/:id',
        name: 'student-certificate-detail',
        component: () => import('pages/certificates/CertificateDetailPage.vue'),
        props: true,
        meta: {
          studentTitle: 'Detalle del certificado',
          studentCrumbs: [
            { label: 'Dashboard', to: { name: 'student-dashboard' } },
            { label: 'Certificados', to: { name: 'student-certificates-vault' } },
            { label: 'Detalle' },
          ],
        },
      },
    ],
  },

  // ─── Teacher (The Creator) ──────────────────────────────
  {
    path: '/teacher',
    component: () => import('layouts/TeacherLayout.vue'),
    meta: { requiresAuth: true, requiresRole: ['instructor', 'admin'] },
    children: [
      {
        path: 'dashboard',
        name: 'teacher-dashboard',
        component: () => import('pages/teacher/TeacherDashboardPage.vue'),
        meta: {
          teacherTitle: 'Dashboard de Instructor',
          teacherCrumbs: [{ label: 'Dashboard' }],
        },
      },
      {
        path: 'profile',
        name: 'teacher-profile',
        component: () => import('pages/user/UserProfilePage.vue'),
        meta: {
          teacherTitle: 'Mi perfil docente',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Mi perfil' },
          ],
        },
      },
      {
        path: 'courses',
        name: 'teacher-courses',
        component: () => import('pages/teacher/CourseBuilderPage.vue'),
        meta: {
          teacherTitle: 'Course Builder 2.0',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Course Builder 2.0' },
          ],
        },
      },
      {
        path: 'courses/:courseId/builder',
        name: 'teacher-course-builder',
        component: () => import('pages/teacher/CourseBuilderWorkspacePage.vue'),
        props: true,
        meta: {
          teacherTitle: (route) => route.query.courseTitle || `Builder del curso #${route.params.courseId}`,
          teacherCrumbs: (route) => [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Course Builder 2.0', to: { name: 'teacher-courses' } },
            { label: route.query.courseTitle || `Curso #${route.params.courseId}` },
          ],
        },
      },
      {
        path: 'marketplace',
        name: 'teacher-marketplace',
        component: () => import('pages/public/CatalogPage.vue'),
        meta: {
          teacherTitle: 'Marketplace docente',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Marketplace' },
          ],
        },
      },
      {
        path: 'marketplace/:slug',
        name: 'teacher-marketplace-course',
        component: () => import('pages/public/CourseDetailPage.vue'),
        meta: {
          teacherTitle: 'Detalle del catálogo',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Marketplace', to: { name: 'teacher-marketplace' } },
            { label: 'Detalle del curso' },
          ],
        },
      },
      {
        path: 'courses/:slug/preview',
        name: 'teacher-course-preview',
        component: () => import('pages/public/CourseDetailPage.vue'),
        props: { previewMode: true },
        meta: {
          teacherTitle: 'Previsualización de curso',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Course Builder 2.0', to: { name: 'teacher-courses' } },
            { label: 'Preview de curso' },
          ],
        },
      },
      {
        path: 'preview/lesson/:lessonId',
        name: 'teacher-lesson-preview',
        component: () => import('pages/lessons/LessonPlayerPage.vue'),
        props: { previewMode: true },
        meta: {
          teacherTitle: 'Previsualización de lección',
          teacherCrumbs: (route) => [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            {
              label: 'Course Builder 2.0',
              to: route.query.courseId
                ? {
                    name: 'teacher-course-builder',
                    params: { courseId: route.query.courseId },
                    query: route.query.courseTitle ? { courseTitle: route.query.courseTitle } : undefined,
                  }
                : { name: 'teacher-courses' },
            },
            { label: 'Preview de lección' },
          ],
        },
      },
      {
        path: 'gamification',
        name: 'teacher-gamification',
        component: () => import('pages/teacher/TeacherGamificationPage.vue'),
        meta: {
          teacherTitle: 'Gamificación por actividad',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Gamificación' },
          ],
        },
      },
      {
        path: 'gradebook',
        name: 'teacher-gradebook',
        component: () => import('pages/teacher/TeacherGradebookPage.vue'),
        meta: {
          teacherTitle: 'Libreta e intentos',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Libreta' },
          ],
        },
      },
      {
        path: 'activities',
        name: 'teacher-activities',
        component: () => import('pages/teacher/TeacherActivitiesPage.vue'),
        meta: {
          teacherTitle: 'Gestor de Medios y Actividades',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Medios y actividades' },
          ],
        },
      },
      {
        path: 'students',
        name: 'teacher-students',
        component: () => import('pages/teacher/TeacherStudentsPage.vue'),
        meta: {
          teacherTitle: 'Monitor de Estudiantes',
          teacherCrumbs: [
            { label: 'Dashboard', to: { name: 'teacher-dashboard' } },
            { label: 'Seguimiento de estudiantes' },
          ],
        },
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
        meta: {
          adminTitle: 'Dashboard global',
          adminCrumbs: [{ label: 'Inicio' }],
        },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('pages/admin/UsersListPage.vue'),
        meta: {
          adminTitle: 'Usuarios',
          adminCrumbs: [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Usuarios' },
          ],
        },
      },
      {
        path: 'courses',
        name: 'admin-courses',
        component: () => import('pages/admin/CoursesListPage.vue'),
        meta: {
          adminTitle: 'Curación y revisión',
          adminCrumbs: [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Cursos' },
          ],
        },
      },
      {
        path: 'courses/:courseId/review',
        name: 'admin-course-review',
        component: () => import('pages/admin/AdminCourseReviewPage.vue'),
        props: true,
        meta: {
          adminTitle: (route) => route.query.courseTitle || `Revisión del curso #${route.params.courseId}`,
          adminCrumbs: (route) => [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Cursos', to: { name: 'admin-courses' } },
            { label: 'Revisión' },
            { label: route.query.courseTitle || `Curso #${route.params.courseId}` },
          ],
        },
      },
      {
        path: 'courses/:slug/preview',
        name: 'admin-course-preview',
        component: () => import('pages/public/CourseDetailPage.vue'),
        props: { previewMode: true },
        meta: {
          adminTitle: 'Inspección del learning player',
          adminCrumbs: (route) => [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Cursos', to: { name: 'admin-courses' } },
            route.query.courseId
              ? {
                  label: 'Revisión',
                  to: {
                    name: 'admin-course-review',
                    params: { courseId: route.query.courseId },
                    query: route.query.courseTitle ? { courseTitle: route.query.courseTitle } : undefined,
                  },
                }
              : { label: 'Preview' },
            { label: 'Preview de curso' },
          ],
        },
      },
      {
        path: 'preview/lesson/:lessonId',
        name: 'admin-lesson-preview',
        component: () => import('pages/lessons/LessonPlayerPage.vue'),
        props: { previewMode: true },
        meta: {
          adminTitle: 'Inspección de lección',
          adminCrumbs: (route) => [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Cursos', to: { name: 'admin-courses' } },
            route.query.courseId
              ? {
                  label: 'Revisión',
                  to: {
                    name: 'admin-course-review',
                    params: { courseId: route.query.courseId },
                    query: route.query.courseTitle ? { courseTitle: route.query.courseTitle } : undefined,
                  },
                }
              : { label: 'Preview' },
            { label: 'Preview de lección' },
          ],
        },
      },
      {
        path: 'finances',
        name: 'admin-finances',
        component: () => import('pages/admin/AdminFinancePage.vue'),
        meta: {
          adminTitle: 'The Vault',
          adminCrumbs: [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Finanzas' },
          ],
        },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('pages/admin/AdminReportsPage.vue'),
        meta: {
          adminTitle: 'Reportes y auditoría',
          adminCrumbs: [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Reportes' },
          ],
        },
      },
      {
        path: 'gamification',
        name: 'admin-gamification',
        component: () => import('pages/admin/AdminGamificationPage.vue'),
        meta: {
          adminTitle: 'Laboratorio de gamificación',
          adminCrumbs: [
            { label: 'Inicio', to: { name: 'admin-dashboard' } },
            { label: 'Gamificación' },
          ],
        },
      },
    ],
  },

  // ─── Legacy Redirects (compatibility) ───────────────────
  { path: '/dashboard', redirect: { name: 'student-dashboard' } },
  { path: '/lessons/:lessonId', redirect: (to) => `/student/learn/${to.params.lessonId}` },
  { path: '/user/courses', redirect: { name: 'student-my-learning' } },
  { path: '/user/activity', redirect: { name: 'student-dashboard' } },
  { path: '/student/profile', redirect: { name: 'student-inventory' } },
  { path: '/student/store', redirect: { name: 'student-marketplace' } },
  { path: '/student/rewards', redirect: { name: 'student-shop' } },
  { path: '/student/courses', redirect: { name: 'student-my-learning' } },
  { path: '/student/arena/:lessonId', redirect: (to) => `/student/learn/${to.params.lessonId}` },
  { path: '/certificates', redirect: { name: 'student-certificates-vault' } },
  { path: '/certificates/:id', redirect: (to) => `/student/certificates/${to.params.id}` },
  { path: '/instructor/courses', redirect: { name: 'teacher-courses' } },
  { path: '/admin', redirect: { name: 'admin-dashboard' } },
  { path: '/admin/payments', redirect: { name: 'admin-finances' } },
  { path: '/admin/settings', redirect: { name: 'admin-finances' } },
  { path: '/admin/games', redirect: { name: 'admin-gamification' } },
  { path: '/admin/quizzes', redirect: { name: 'admin-gamification' } },
  { path: '/admin/categories', redirect: { name: 'admin-gamification' } },

  // ─── 404 ────────────────────────────────────────────────
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
