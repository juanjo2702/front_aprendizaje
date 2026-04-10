<template>
  <q-page class="dashboard-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="animate-fade-in-up">
        <h2 class="q-mb-xs">Bienvenido, {{ auth.user?.name }} 👋</h2>
        <p class="q-mb-none">Tu centro de aprendizaje y progreso</p>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-badge outline color="primary" class="q-pa-sm">
          <q-icon name="mdi-trophy" size="16px" class="q-mr-xs" />
          {{ stats.total_points || 0 }} puntos
        </q-badge>
        <q-badge outline color="positive" class="q-pa-sm">
          <q-icon name="mdi-fire" size="16px" class="q-mr-xs" />
          Racha: {{ stats.current_streak || 0 }} días
        </q-badge>
      </div>
    </div>

    <!-- Main Stats Grid -->
    <div class="row q-gutter-lg q-mb-xl">
      <!-- Points Card -->
      <div class="col-12 col-sm-6 col-md-3 animate-fade-in-up animate-delay-1">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="primary" text-color="white">
              <q-icon name="mdi-star" size="28px" />
            </q-avatar>
            <div>
              <div class="text-h4 text-weight-bold text-gradient">
                {{ stats.total_points || 0 }}
              </div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Puntos totales</div>
              <div v-if="stats.points_this_month > 0" style="color: #00b894; font-size: 0.75rem">
                +{{ stats.points_this_month }} este mes
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Courses Card -->
      <div class="col-12 col-sm-6 col-md-3 animate-fade-in-up animate-delay-2">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="positive" text-color="white">
              <q-icon name="mdi-school" size="28px" />
            </q-avatar>
            <div>
              <div class="text-h4 text-weight-bold" style="color: #00b894">
                {{ courses.total || 0 }}
              </div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Cursos inscritos</div>
              <div v-if="courses.completed > 0" style="color: #00b894; font-size: 0.75rem">
                {{ courses.completed }} completados
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Badges Card -->
      <div class="col-12 col-sm-6 col-md-3 animate-fade-in-up animate-delay-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="orange" text-color="white">
              <q-icon name="mdi-trophy" size="28px" />
            </q-avatar>
            <div>
              <div class="text-h4 text-weight-bold" style="color: #ff9f43">
                {{ achievements.total_badges || 0 }}
              </div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Badges obtenidos</div>
              <div style="color: #8b8ba7; font-size: 0.75rem">
                {{ achievements.completion_percentage || 0 }}% completado
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Activity Card -->
      <div class="col-12 col-sm-6 col-md-3 animate-fade-in-up animate-delay-4">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="secondary" text-color="white">
              <q-icon name="mdi-chart-line" size="28px" />
            </q-avatar>
            <div>
              <div class="text-h4 text-weight-bold" style="color: #00d2d3">
                {{ achievements.total_games_completed + achievements.total_quizzes_completed || 0 }}
              </div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Actividades completadas</div>
              <div style="color: #8b8ba7; font-size: 0.75rem">
                {{ achievements.total_certificates || 0 }} certificados
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <div class="row q-gutter-lg q-mb-xl">
      <!-- Left Column: Courses & Recent Activity -->
      <div class="col-12 col-lg-8">
        <!-- My Courses -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <div class="row items-center justify-between q-mb-md">
            <h3 class="q-mb-none">Mis cursos</h3>
            <q-btn
              flat
              no-caps
              label="Ver todos"
              icon-right="arrow_forward"
              color="primary"
              to="/catalog"
            />
          </div>

          <div v-if="loading.courses" class="row q-gutter-lg">
            <div v-for="n in 3" :key="n" class="col-12">
              <q-skeleton type="rect" height="80px" dark style="border-radius: 12px" />
            </div>
          </div>

          <div v-else-if="courses.recent.length === 0" class="text-center q-py-lg">
            <q-icon name="mdi-school" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Aún no estás inscrito en ningún curso</h4>
            <q-btn
              class="btn-gradient q-mt-md"
              no-caps
              label="Explorar cursos"
              icon="explore"
              to="/catalog"
            />
          </div>

          <div v-else class="row q-gutter-lg">
            <div
              v-for="enrollment in courses.recent.slice(0, 3)"
              :key="enrollment.id"
              class="col-12"
            >
              <q-card
                class="course-card glass-card cursor-pointer q-pa-md"
                @click="$router.push('/courses/' + enrollment.course.slug)"
              >
                <div class="row items-center q-gutter-md">
                  <q-avatar size="48px" rounded color="primary" text-color="white">
                    <q-icon name="mdi-play-circle" size="24px" />
                  </q-avatar>
                  <div class="col">
                    <div class="row items-center q-mb-xs">
                      <h4 style="font-size: 1rem; line-height: 1.3" class="q-mr-sm">
                        {{ enrollment.course.title }}
                      </h4>
                      <q-badge
                        v-if="enrollment.progress >= 100"
                        color="positive"
                        label="Completado"
                      />
                      <q-badge v-else color="primary" :label="enrollment.progress + '%'" />
                    </div>
                    <div style="color: #8b8ba7; font-size: 0.8rem" class="q-mb-sm">
                      {{ enrollment.course.instructor?.name }}
                    </div>
                    <q-linear-progress
                      :value="enrollment.progress / 100"
                      color="primary"
                      track-color="dark"
                      rounded
                      size="6px"
                    />
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </q-card>

        <!-- Recent Activity -->
        <q-card class="glass-card q-pa-lg">
          <div class="row items-center justify-between q-mb-md">
            <h3 class="q-mb-none">Actividad reciente</h3>
            <q-btn
              flat
              no-caps
              label="Ver todo"
              icon-right="arrow_forward"
              color="primary"
              @click="viewAllActivity"
            />
          </div>

          <div v-if="loading.activity" class="q-py-md">
            <div v-for="n in 3" :key="n" class="q-mb-md">
              <q-skeleton type="rect" height="60px" dark style="border-radius: 8px" />
            </div>
          </div>

          <div v-else-if="activities.length === 0" class="text-center q-py-lg">
            <q-icon name="mdi-timeline-clock" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Aún no hay actividad</h4>
            <p style="color: #8b8ba7">
              Completa lecciones, juegos o quizzes para ver tu actividad aquí.
            </p>
          </div>

          <div v-else class="activity-feed">
            <div
              v-for="activity in activities.slice(0, 5)"
              :key="activity.id + '-' + activity.type"
              class="activity-item q-pa-sm q-mb-sm"
            >
              <div class="row items-center q-gutter-md">
                <q-avatar :color="activity.color" text-color="white" size="40px">
                  <q-icon :name="activity.icon" size="20px" />
                </q-avatar>
                <div class="col">
                  <div class="text-weight-medium">{{ activity.title }}</div>
                  <div style="color: #8b8ba7; font-size: 0.8rem">
                    <template v-if="activity.type === 'game'">
                      Puntaje: {{ activity.score }}/{{ activity.max_score }}
                    </template>
                    <template v-else-if="activity.type === 'quiz'">
                      {{ activity.correct_answers }}/{{ activity.total_questions }} correctas ({{
                        activity.score
                      }}%)
                    </template>
                    <template v-else>
                      {{
                        activity.badge_description || activity.certificate_code
                          ? 'Código: ' + activity.certificate_code
                          : ''
                      }}
                    </template>
                  </div>
                </div>
                <div style="color: #8b8ba7; font-size: 0.75rem">
                  {{ formatDate(activity.date) }}
                </div>
              </div>
              <div
                v-if="activity.course"
                class="q-mt-xs"
                style="color: #5a5a7a; font-size: 0.75rem"
              >
                <q-icon name="mdi-book-open" size="12px" class="q-mr-xs" />
                {{ activity.course.title }}
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Right Column: Badges & Certificates -->
      <div class="col-12 col-lg-4">
        <!-- Recent Badges -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <div class="row items-center justify-between q-mb-md">
            <h3 class="q-mb-none">Badges recientes</h3>
            <q-btn
              flat
              no-caps
              label="Ver todos"
              icon-right="arrow_forward"
              color="primary"
              @click="viewAllBadges"
            />
          </div>

          <div v-if="loading.badges" class="row q-gutter-sm justify-center">
            <div v-for="n in 4" :key="n" class="col-6">
              <q-skeleton type="circle" size="80px" dark />
            </div>
          </div>

          <div v-else-if="recentBadges.length === 0" class="text-center q-py-lg">
            <q-icon name="mdi-trophy-outline" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Aún no tienes badges</h4>
            <p style="color: #8b8ba7">Completa logros para desbloquear badges.</p>
          </div>

          <div v-else class="row q-gutter-sm justify-center">
            <div
              v-for="badge in recentBadges.slice(0, 4)"
              :key="badge.id"
              class="col-6 text-center"
            >
              <q-avatar size="80px" class="badge-avatar">
                <img :src="badge.icon" :alt="badge.name" style="width: 100%; height: 100%" />
              </q-avatar>
              <div class="q-mt-xs" style="color: #8b8ba7; font-size: 0.75rem">{{ badge.name }}</div>
              <div style="color: #5a5a7a; font-size: 0.7rem">{{ formatDate(badge.earned_at) }}</div>
            </div>
          </div>
        </q-card>

        <!-- Recent Certificates -->
        <q-card class="glass-card q-pa-lg">
          <div class="row items-center justify-between q-mb-md">
            <h3 class="q-mb-none">Certificados recientes</h3>
            <q-btn
              flat
              no-caps
              label="Ver todos"
              icon-right="arrow_forward"
              color="primary"
              @click="viewAllCertificates"
            />
          </div>

          <div v-if="loading.certificates" class="q-py-md">
            <div v-for="n in 2" :key="n" class="q-mb-md">
              <q-skeleton type="rect" height="80px" dark style="border-radius: 8px" />
            </div>
          </div>

          <div v-else-if="recentCertificates.length === 0" class="text-center q-py-lg">
            <q-icon name="mdi-certificate-outline" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Aún no tienes certificados</h4>
            <p style="color: #8b8ba7">Completa cursos para obtener certificados.</p>
          </div>

          <div v-else>
            <div v-for="cert in recentCertificates.slice(0, 2)" :key="cert.id" class="q-mb-md">
              <q-card
                class="certificate-card glass-card cursor-pointer q-pa-md"
                @click="viewCertificate(cert)"
              >
                <div class="row items-center q-gutter-md">
                  <q-avatar size="48px" color="green" text-color="white">
                    <q-icon name="mdi-certificate" size="24px" />
                  </q-avatar>
                  <div class="col">
                    <div class="text-weight-medium">{{ cert.course.title }}</div>
                    <div style="color: #8b8ba7; font-size: 0.8rem">
                      Código: {{ cert.certificate_code }}
                    </div>
                    <div style="color: #5a5a7a; font-size: 0.75rem">
                      {{ formatDate(cert.issued_at) }}
                    </div>
                  </div>
                  <q-icon name="mdi-download" color="primary" size="20px" />
                </div>
              </q-card>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'

const auth = useAuthStore()
const router = useRouter()

// Estado reactivo
const stats = ref({})
const courses = ref({
  total: 0,
  completed: 0,
  in_progress: 0,
  recent: [],
})
const achievements = ref({})
const activities = ref([])
const recentBadges = ref([])
const recentCertificates = ref([])

const loading = reactive({
  dashboard: true,
  courses: true,
  activity: true,
  badges: true,
  certificates: true,
})

// Funciones auxiliares
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function viewAllCourses() {
  router.push('/user/courses')
}

function viewAllActivity() {
  router.push('/user/activity')
}

function viewAllBadges() {
  router.push('/badges/my')
}

function viewAllCertificates() {
  router.push('/certificates')
}

function viewCertificate(cert) {
  router.push(`/certificates/${cert.id}`)
}

// Carga de datos
onMounted(async () => {
  try {
    loading.dashboard = true

    // Cargar estadísticas del dashboard
    const [dashboardRes, activityRes, badgesRes, certificatesRes] = await Promise.all([
      api.get('/user/dashboard-stats'),
      api.get('/user/recent-activity?limit=10'),
      api.get('/badges/my'),
      api.get('/certificates?per_page=3'),
    ])

    const dashboardData = dashboardRes.data
    stats.value = dashboardData.stats || {}
    courses.value = dashboardData.courses || {}
    achievements.value = dashboardData.achievements || {}

    // Procesar actividades
    activities.value = activityRes.data.activities || []

    // Procesar badges
    const badgesData = badgesRes.data
    recentBadges.value = badgesData.badges || badgesData || []

    // Procesar certificados
    const certsData = certificatesRes.data
    recentCertificates.value = certsData.data || certsData || []

    // Marcar loading como falso
    Object.keys(loading).forEach((key) => {
      loading[key] = false
    })
  } catch (error) {
    console.error('Error cargando dashboard:', error)
    // En caso de error, mostrar datos de ejemplo para desarrollo
    if (import.meta.env.DEV) {
      // Datos de ejemplo (remover en producción)
      stats.value = {
        total_points: 1250,
        current_streak: 7,
        points_this_month: 320,
      }
      courses.value = {
        total: 3,
        completed: 1,
        in_progress: 2,
        recent: [
          {
            id: 1,
            progress: 75,
            course: {
              slug: 'laravel-profesional-de-cero-a-experto',
              title: 'Laravel Profesional',
              instructor: { name: 'Carlos Mendoza' },
            },
          },
          {
            id: 2,
            progress: 30,
            course: {
              slug: 'vuejs-3-quasar-framework-interfaces-premium',
              title: 'Vue.js 3 + Quasar',
              instructor: { name: 'Carlos Mendoza' },
            },
          },
        ],
      }
      achievements.value = {
        total_badges: 2,
        total_certificates: 1,
        total_games_completed: 5,
        total_quizzes_completed: 3,
        completion_percentage: 40,
      }
      activities.value = [
        {
          id: 1,
          type: 'game',
          title: 'Juego de Memoria - Laravel',
          score: 85,
          max_score: 100,
          color: 'purple',
          icon: 'mdi-gamepad-variant',
          course: { title: 'Laravel Profesional' },
          date: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 2,
          type: 'quiz',
          title: 'Quiz: Fundamentos de Vue',
          score: 90,
          correct_answers: 9,
          total_questions: 10,
          color: 'blue',
          icon: 'mdi-format-list-checks',
          course: { title: 'Vue.js 3 + Quasar' },
          date: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
      recentBadges.value = [
        {
          id: 1,
          name: 'Primer Curso Completado',
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          earned_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          name: 'Racha de 7 Días',
          icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
          earned_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]
      recentCertificates.value = [
        {
          id: 1,
          certificate_code: 'CERT-ABC123',
          course: { title: 'Laravel Profesional' },
          issued_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]

      Object.keys(loading).forEach((key) => {
        loading[key] = false
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  .stats-card {
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }

  .course-card {
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(108, 92, 231, 0.5);
      box-shadow: 0 4px 20px rgba(108, 92, 231, 0.15);
    }
  }

  .activity-item {
    border-radius: 8px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .badge-avatar {
    border: 3px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--q-primary);
      transform: scale(1.05);
    }
  }

  .certificate-card {
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(0, 184, 148, 0.5);
      box-shadow: 0 4px 20px rgba(0, 184, 148, 0.15);
    }
  }
}
</style>
