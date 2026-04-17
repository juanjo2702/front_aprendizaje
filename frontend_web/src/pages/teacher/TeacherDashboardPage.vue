<template>
  <q-page class="teacher-dashboard q-pa-xl">
    <div class="page-wrap">
      <section class="hero-panel q-pa-xl q-mb-lg">
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
                  <div class="text-caption text-grey-5">Cursos publicados</div>
                  <div class="text-h5 text-positive">{{ metrics.publishedCourses }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Borradores activos</div>
                  <div class="text-h5 text-warning">{{ metrics.draftCourses }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Actividades</div>
                  <div class="text-h5 text-secondary">{{ metrics.interactiveActivities }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Reglas de juego</div>
                  <div class="text-h5 text-info">{{ metrics.gameRules }}</div>
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
              label="Estudiantes totales"
              :value="metrics.totalStudents"
              hint="Suma de alumnos inscritos en tus cursos."
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
              label="Ingresos estimados"
              :value="metrics.estimatedRevenue"
              hint="Cálculo base por precio y estudiantes inscritos."
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
        </section>

        <section class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-xl-6">
            <TeacherCourseHealthList
              title="Pendientes de publicación"
              subtitle="Cursos que todavía necesitan revisión antes de salir al alumno."
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
              class="recent-course-card q-pa-lg"
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

          <q-card v-else class="recent-course-card q-pa-xl text-center">
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

const greetingTitle = computed(() => {
  const name = auth.user?.name?.split(' ')[0] || 'Docente'
  return `Hola, ${name}. Este es tu panel real de trabajo.`
})

const metrics = computed(() => {
  const totalCourses = courses.value.length
  const publishedCourses = courses.value.filter((course) => course.status === 'published').length
  const draftCourses = courses.value.filter((course) => ['draft', 'pending'].includes(course.status)).length
  const totalStudents = courses.value.reduce((sum, course) => sum + Number(course.total_students || 0), 0)
  const totalModules = courses.value.reduce((sum, course) => sum + Number(course.modules_count || 0), 0)
  const totalLessons = courses.value.reduce((sum, course) => sum + Number(course.lessons_count || 0), 0)
  const estimatedRevenue = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'USD',
  }).format(
    courses.value.reduce(
      (sum, course) => sum + (Number(course.price || 0) * Number(course.total_students || 0)),
      0,
    ),
  )

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalStudents,
    totalModules,
    totalLessons,
    estimatedRevenue,
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

async function loadDashboard() {
  loading.value = true
  try {
    const [coursesResponse, interactiveResponse, rulesResponse] = await Promise.all([
      api.get('/instructor/courses', { params: { per_page: 100 } }),
      api.get('/interactive-configs', { params: { per_page: 100 } }),
      api.get('/game-configurations', { params: { per_page: 100 } }),
    ])

    courses.value = coursesResponse.data?.data || []
    interactiveConfigs.value = interactiveResponse.data?.data || []
    gameRules.value = rulesResponse.data?.data || []
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
  max-width: 1320px;
  margin: 0 auto;
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
}

.section-title {
  font-size: 1.5rem;
}

.recent-course-card {
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(28, 30, 66, 0.95), rgba(19, 21, 48, 0.95));
  border: 1px solid rgba(118, 122, 180, 0.18);
}
</style>
