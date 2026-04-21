<template>
  <q-page class="teacher-dashboard workspace-page">
    <div class="page-wrap workspace-wrap">
      <section class="hero-panel workspace-hero q-mb-lg">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-lg-7">
            <q-badge color="secondary" outline class="q-mb-md">Centro de control docente</q-badge>
            <h1 class="q-mb-sm">
              {{ greetingTitle }}
            </h1>
            <p class="hero-copy q-mb-lg">
              Gestiona tu catálogo, revisa la salud de tus cursos y entra directo a creación,
              gamificación, actividades y vista previa.
            </p>

            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                no-caps
                icon="add_circle"
                label="Gestionar cursos"
                :to="{ name: 'teacher-courses' }"
              />
              <q-btn
                outline
                no-caps
                color="secondary"
                icon="travel_explore"
                label="Ver catálogo público"
                :to="{ name: 'teacher-marketplace' }"
              />
            </div>
          </div>

          <div class="col-12 col-lg-5">
            <q-card class="hero-summary q-pa-lg">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Estado del workspace</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-5">Ventas cerradas</div>
                  <div class="text-h5 text-positive">{{ metrics.totalSales }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Alumnos activos (7d)</div>
                  <div class="text-h5 text-secondary">{{ metrics.activeStudents }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Cursos publicados</div>
                  <div class="text-h5 text-info">{{ metrics.publishedCourses }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Borradores activos</div>
                  <div class="text-h5 text-warning">{{ metrics.draftCourses }}</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </section>

      <div v-if="loading" class="q-py-md">
        <q-skeleton v-for="n in 6" :key="n" type="rect" height="120px" class="q-mb-md" dark />
      </div>

      <template v-else>
        <section class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-xl-3">
            <TeacherMetricCard
              label="Cursos propios"
              :value="metrics.totalCourses"
              hint="Cursos creados por tu cuenta docente."
              icon="school"
            />
          </div>
          <div class="col-12 col-sm-6 col-xl-3">
            <TeacherMetricCard
              label="Estudiantes activos"
              :value="metrics.activeStudents"
              hint="Alumnos con actividad reciente dentro de tus cursos."
              icon="groups"
              icon-color="secondary"
              value-color="#00d2d3"
            />
          </div>
          <div class="col-12 col-sm-6 col-xl-3">
            <TeacherMetricCard
              label="Módulos y lecciones"
              :value="`${metrics.totalModules} / ${metrics.totalLessons}`"
              hint="Cobertura total de estructura creada."
              icon="account_tree"
              icon-color="warning"
            />
          </div>
          <div class="col-12 col-sm-6 col-xl-3">
            <TeacherMetricCard
              label="Ventas cerradas"
              :value="metrics.totalSales"
              hint="Suma de pagos completados en los cursos del instructor."
              icon="payments"
              icon-color="positive"
              value-color="#7ee081"
            />
          </div>
        </section>

        <section class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-lg-4">
            <TeacherQuickActionCard
              icon="edit_note"
              title="Construir cursos"
              description="Crea cursos, abre la estructura, agrega módulos, lecciones, recursos y vista previa."
              action-label="Abrir Course Builder"
              @action="router.push({ name: 'teacher-courses' })"
            />
          </div>
          <div class="col-12 col-lg-4">
            <TeacherQuickActionCard
              icon="extension"
              title="Actividades interactivas"
              description="Configura las lecciones activas que se reproducen desde el course player."
              action-label="Ir a actividades"
              :badge="String(metrics.interactiveActivities)"
              @action="router.push({ name: 'teacher-activities' })"
            />
          </div>
          <div class="col-12 col-lg-4">
            <TeacherQuickActionCard
              icon="emoji_events"
              title="Gamificación"
              description="Controla puntajes, límites e incentivos por curso, módulo o lección."
              action-label="Abrir reglas"
              :badge="String(metrics.gameRules)"
              @action="router.push({ name: 'teacher-gamification' })"
            />
          </div>
          <div class="col-12 col-lg-4">
            <TeacherQuickActionCard
              icon="groups"
              title="Mis alumnos"
              description="Tabla operativa con progreso, promedio y drill-down por curso."
              action-label="Abrir seguimiento"
              :badge="String(alertSummary.open_questions || 0)"
              @action="router.push({ name: 'teacher-students' })"
            />
          </div>
        </section>

        <section class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-xl-6">
            <TeacherCourseHealthList
              title="Pendientes de publicación"
              subtitle="Cursos en borrador que todavía necesitan revisión antes de salir al alumno."
              :items="draftItems"
              @action="openCourseManager"
            />
          </div>
          <div class="col-12 col-xl-6">
            <TeacherCourseHealthList
              title="Cursos sin contenido suficiente"
              subtitle="Detecta rápido lo que todavía no tiene módulos o lecciones."
              :items="structureItems"
              @action="openCourseManager"
            />
          </div>
          <div class="col-12 col-xl-6">
            <TeacherCourseHealthList
              title="Cursos destacados por rendimiento"
              subtitle="Mientras no exista rating formal, usamos score promedio de actividades."
              :items="topRatedItems"
              @action="openCourseManager"
            />
          </div>
          <div class="col-12 col-xl-6">
            <q-card class="recent-course-card workspace-panel">
              <div class="row items-center justify-between q-mb-md">
                <div>
                  <div class="text-subtitle1 text-weight-bold">Alertas docentes</div>
                  <div class="text-caption text-grey-5">Preguntas abiertas y alumnos en seguimiento.</div>
                </div>
                <q-btn flat no-caps color="secondary" label="Ver seguimiento" :to="{ name: 'teacher-students' }" />
              </div>

              <q-list v-if="recentAlerts.length" separator dark>
                <q-item v-for="(alert, index) in recentAlerts" :key="`${alert.type}-${index}`">
                  <q-item-section avatar>
                    <q-avatar :color="alert.type === 'question' ? 'secondary' : 'negative'" text-color="white">
                      <q-icon :name="alert.type === 'question' ? 'forum' : 'warning'" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ alert.student_name || 'Alumno' }}</q-item-label>
                    <q-item-label caption v-if="alert.course_title">
                      {{ alert.course_title }}<span v-if="alert.lesson_title"> · {{ alert.lesson_title }}</span>
                    </q-item-label>
                    <q-item-label caption>{{ describeAlert(alert) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="workspace-empty">
                <strong>No hay alertas activas por ahora.</strong>
                <span>Cuando existan preguntas abiertas o alumnos en riesgo, se resumirán aquí.</span>
              </div>
            </q-card>
          </div>
        </section>

        <section class="q-mb-lg">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <h2 class="section-title q-mb-xs">Cursos recientes</h2>
              <p class="q-mb-none text-grey-5">
                Accesos rápidos para seguir editando o lanzar la vista previa docente.
              </p>
            </div>
            <q-btn flat no-caps color="primary" label="Ver todos" :to="{ name: 'teacher-courses' }" />
          </div>

          <div v-if="recentCourses.length" class="column q-gutter-md">
            <q-card
              v-for="course in recentCourses"
              :key="course.id"
              class="recent-course-card workspace-panel"
            >
              <div class="row q-col-gutter-lg items-center">
                <div class="col-12 col-lg-7">
                  <div class="row items-center q-gutter-sm q-mb-sm">
                    <div class="text-subtitle1 text-weight-bold">{{ course.title }}</div>
                    <q-badge :color="statusColor(course.status)" rounded>{{ statusLabel(course.status) }}</q-badge>
                  </div>
                  <div class="text-body2 text-grey-4 q-mb-sm">
                    {{ course.short_description || course.description || 'Sin descripción todavía.' }}
                  </div>
                  <div class="row q-col-gutter-md text-caption text-grey-5">
                    <div class="col-auto">Módulos: {{ course.modules_count || 0 }}</div>
                    <div class="col-auto">Lecciones: {{ course.lessons_count || 0 }}</div>
                    <div class="col-auto">Estudiantes: {{ course.total_students || 0 }}</div>
                    <div class="col-auto">Activos 7d: {{ course.active_students || 0 }}</div>
                    <div class="col-auto">Score: {{ Number(course.average_learning_score || 0).toFixed(1) }}</div>
                    <div class="col-auto">Precio: {{ formatCurrency(course.price) }}</div>
                  </div>
                </div>
                <div class="col-12 col-lg-5">
                  <div class="row justify-end q-gutter-sm">
                    <q-btn
                      flat
                      no-caps
                      color="primary"
                      icon="edit"
                      label="Gestionar"
                      @click="router.push({ name: 'teacher-courses' })"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="secondary"
                      icon="visibility"
                      label="Vista previa"
                      @click="previewCourse(course)"
                    />
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <q-card v-else class="recent-course-card workspace-panel text-center">
            <q-icon name="school" size="64px" color="grey-6" />
            <div class="text-h6 q-mt-md">Todavía no tienes cursos creados</div>
            <div class="text-body2 text-grey-5 q-mt-sm">
              Empieza por el builder y luego vuelve aquí para revisar el estado del catálogo.
            </div>
          </q-card>
        </section>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'
import TeacherCourseHealthList from 'src/components/teacher/TeacherCourseHealthList.vue'
import TeacherMetricCard from 'src/components/teacher/TeacherMetricCard.vue'
import TeacherQuickActionCard from 'src/components/teacher/TeacherQuickActionCard.vue'

const $q = useQuasar()
const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const courses = ref([])
const interactiveConfigs = ref([])
const gameRules = ref([])
const recentAlerts = ref([])
const alertSummary = ref({})

const greetingTitle = computed(() => {
  const name = auth.user?.name?.split(' ')[0] || 'Docente'
  return `Hola, ${name}. Este es tu panel real de trabajo.`
})

const metrics = computed(() => {
  const totalCourses = courses.value.length
  const publishedCourses = courses.value.filter((course) => course.status === 'published').length
  const draftCourses = courses.value.filter((course) => ['draft', 'pending'].includes(course.status)).length
  const totalStudents = courses.value.reduce((sum, course) => sum + Number(course.total_students || 0), 0)
  const activeStudents = courses.value.reduce((sum, course) => sum + Number(course.active_students || 0), 0)
  const totalModules = courses.value.reduce((sum, course) => sum + Number(course.modules_count || 0), 0)
  const totalLessons = courses.value.reduce((sum, course) => sum + Number(course.lessons_count || 0), 0)
  const totalSales = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'USD',
  }).format(
    courses.value.reduce(
      (sum, course) => sum + Number(course.completed_sales_amount || 0),
      0,
    ),
  )

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalStudents,
    activeStudents,
    totalModules,
    totalLessons,
    totalSales,
    interactiveActivities: interactiveConfigs.value.length,
    gameRules: gameRules.value.length,
  }
})

const recentCourses = computed(() => courses.value.slice(0, 5))

const draftItems = computed(() =>
  courses.value
    .filter((course) => ['draft', 'pending'].includes(course.status))
    .slice(0, 5)
    .map((course) => ({
      id: course.id,
      title: course.title,
      caption: `Estado actual: ${statusLabel(course.status)}. Ajusta contenido, portada lógica y luego publícalo.`,
      actionLabel: 'Abrir gestor',
    })),
)

const structureItems = computed(() =>
  courses.value
    .filter((course) => Number(course.modules_count || 0) === 0 || Number(course.lessons_count || 0) === 0)
    .slice(0, 5)
    .map((course) => ({
      id: course.id,
      title: course.title,
      caption:
        Number(course.modules_count || 0) === 0
          ? 'Aún no tiene módulos creados.'
          : 'Tiene módulos, pero todavía faltan lecciones para completarlo.',
      actionLabel: 'Completar estructura',
    })),
)

const topRatedItems = computed(() =>
  [...courses.value]
    .sort((left, right) => Number(right.average_learning_score || 0) - Number(left.average_learning_score || 0))
    .filter((course) => Number(course.average_learning_score || 0) > 0)
    .slice(0, 5)
    .map((course) => ({
      id: course.id,
      title: course.title,
      caption: `${Number(course.average_learning_score || 0).toFixed(1)} pts promedio · ${course.active_students || 0} activos`,
      actionLabel: 'Abrir builder',
    })),
)

function statusLabel(status) {
  return (
    {
      draft: 'Borrador',
      pending: 'Pendiente',
      published: 'Publicado',
      archived: 'Archivado',
    }[status] || status
  )
}

function statusColor(status) {
  return (
    {
      draft: 'warning',
      pending: 'orange',
      published: 'positive',
      archived: 'grey-6',
    }[status] || 'primary'
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

function formatError(error, fallback) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length) return errors[firstKey][0]
  }
  return error?.response?.data?.message || error?.message || fallback
}

function previewCourse(course) {
  if (!course?.slug) return
  router.push({ name: 'teacher-course-preview', params: { slug: course.slug } })
}

function openCourseManager() {
  router.push({ name: 'teacher-courses' })
}

function describeAlert(alert) {
  if (alert.type === 'question') return `${alert.message}${alert.reply_count ? ` · ${alert.reply_count} respuestas` : ''}`
  return `${alert.course_title} · ${alert.failed_activities_count || 0} fallos · ${alert.days_inactive || 0} días sin entrar`
}

async function loadDashboard() {
  loading.value = true
  try {
    const [coursesResponse, interactiveResponse, rulesResponse, alertsResponse] = await Promise.all([
      api.get('/instructor/courses', { params: { per_page: 100 } }),
      api.get('/interactive-configs', { params: { per_page: 100 } }),
      api.get('/game-configurations', { params: { per_page: 100 } }),
      api.get('/instructor/alerts'),
    ])

    courses.value = coursesResponse.data?.data || []
    interactiveConfigs.value = interactiveResponse.data?.data || []
    gameRules.value = rulesResponse.data?.data || []
    recentAlerts.value = alertsResponse.data?.alerts || []
    alertSummary.value = alertsResponse.data?.summary || {}
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo cargar el dashboard docente.'),
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<style scoped lang="scss">
.teacher-dashboard {
  background: transparent;
}

.page-wrap {
  width: min(100%, 1320px);
}

.hero-panel {
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(108, 92, 231, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(0, 210, 211, 0.12), transparent 28%),
    linear-gradient(145deg, rgba(29, 31, 66, 0.98), rgba(18, 20, 46, 0.98));
  border: 1px solid rgba(118, 122, 180, 0.18);
}

.hero-panel h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.08;
  margin: 0;
}

.hero-copy {
  color: #b8bbd8;
  max-width: 640px;
  font-size: 1.02rem;
}

.hero-summary {
  border-radius: 24px;
  background: rgba(13, 15, 35, 0.58);
  border: 1px solid rgba(118, 122, 180, 0.16);
  padding: 20px;
}

.section-title {
  font-size: 1.5rem;
}

.recent-course-card {
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(28, 30, 66, 0.95), rgba(19, 21, 48, 0.95));
  border: 1px solid rgba(118, 122, 180, 0.18);
}

@media (max-width: 768px) {
  .hero-summary {
    padding: 16px;
  }
}
</style>
