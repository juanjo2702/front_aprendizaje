<template>
  <q-page class="user-activity-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Mi actividad</h2>
        <p class="q-mb-none">Historial completo de tu aprendizaje y logros</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
    </div>

    <!-- Filters -->
    <q-card class="glass-card q-pa-md q-mb-lg">
      <div class="row items-center q-gutter-md">
        <q-select
          v-model="filter.type"
          :options="typeOptions"
          label="Tipo de actividad"
          outlined
          dense
          style="min-width: 180px"
        />
        <q-select
          v-model="filter.course"
          :options="courseOptions"
          label="Curso"
          outlined
          dense
          style="min-width: 180px"
        />
        <q-input
          v-model="filter.dateRange"
          label="Rango de fechas"
          outlined
          dense
          readonly
          @click="datePicker = true"
        >
          <template #append>
            <q-icon name="mdi-calendar" />
          </template>
        </q-input>
        <q-space />
        <q-btn flat no-caps label="Limpiar filtros" color="primary" @click="clearFilters" />
      </div>
    </q-card>

    <!-- Activity Timeline -->
    <div v-if="loading" class="q-py-xl">
      <div v-for="n in 5" :key="n" class="q-mb-lg">
        <q-skeleton type="rect" height="80px" dark style="border-radius: 8px" />
      </div>
    </div>

    <div v-else-if="activities.length === 0" class="text-center q-py-xl">
      <q-icon name="mdi-timeline-clock" size="96px" color="grey-7" />
      <h3 class="q-mt-md" style="color: #8b8ba7">Aún no hay actividad</h3>
      <p style="color: #8b8ba7">Completa lecciones, juegos o quizzes para ver tu actividad aquí.</p>
    </div>

    <div v-else class="activity-timeline">
      <div
        v-for="activity in filteredActivities"
        :key="activity.id + '-' + activity.type"
        class="activity-item q-pa-lg q-mb-md glass-card"
      >
        <div class="row items-center q-gutter-md">
          <q-avatar :color="activity.color" text-color="white" size="56px">
            <q-icon :name="activity.icon" size="28px" />
          </q-avatar>

          <div class="col">
            <div class="text-weight-medium" style="font-size: 1.1rem">{{ activity.title }}</div>
            <div style="color: #8b8ba7; font-size: 0.9rem">
              <template v-if="activity.type === 'game'">
                Puntaje: {{ activity.score }}/{{ activity.max_score }} • Tiempo:
                {{ activity.time_spent }}s
              </template>
              <template v-else-if="activity.type === 'quiz'">
                {{ activity.correct_answers }}/{{ activity.total_questions }} correctas ({{
                  activity.percentage
                }}%) • Tiempo: {{ activity.time_spent }}s
              </template>
              <template v-else-if="activity.type === 'badge'">
                {{ activity.badge_description || 'Nuevo badge desbloqueado' }}
              </template>
              <template v-else-if="activity.type === 'certificate'">
                Código: {{ activity.certificate_code }} • Curso completado
              </template>
              <template v-else>
                {{ activity.description }}
              </template>
            </div>
            <div v-if="activity.course" class="q-mt-xs" style="color: #5a5a7a; font-size: 0.85rem">
              <q-icon name="mdi-book-open" size="12px" class="q-mr-xs" />
              {{ activity.course.title }}
            </div>
          </div>

          <div class="text-right">
            <div style="color: #8b8ba7; font-size: 0.85rem">{{ formatDate(activity.date) }}</div>
            <div style="color: #5a5a7a; font-size: 0.75rem">{{ formatTime(activity.date) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="activities.length > 0" class="row justify-center q-mt-xl">
      <q-pagination v-model="pagination.page" :max="pagination.totalPages" direction-links />
    </div>

    <!-- Date Picker Dialog -->
    <q-dialog v-model="datePicker">
      <q-date v-model="filter.dateRange" range />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const activities = ref([])
const userCourses = ref([])
const datePicker = ref(false)

const filter = reactive({
  type: 'all',
  course: 'all',
  dateRange: { from: null, to: null },
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  totalPages: 1,
})

const typeOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Juegos', value: 'game' },
  { label: 'Quizzes', value: 'quiz' },
  { label: 'Badges', value: 'badge' },
  { label: 'Certificados', value: 'certificate' },
  { label: 'Lecciones', value: 'lesson' },
]

const courseOptions = computed(() => [
  { label: 'Todos los cursos', value: 'all' },
  ...userCourses.value.map((course) => ({ label: course.title, value: course.id })),
])

const filteredActivities = computed(() => {
  let filtered = activities.value

  if (filter.type !== 'all') {
    filtered = filtered.filter((act) => act.type === filter.type)
  }

  if (filter.course !== 'all') {
    filtered = filtered.filter((act) => act.course && act.course.id == filter.course)
  }

  if (filter.dateRange.from && filter.dateRange.to) {
    const from = new Date(filter.dateRange.from)
    const to = new Date(filter.dateRange.to)
    filtered = filtered.filter((act) => {
      const actDate = new Date(act.date)
      return actDate >= from && actDate <= to
    })
  }

  // Pagination slicing
  const start = (pagination.page - 1) * pagination.perPage
  const end = start + pagination.perPage
  return filtered.slice(start, end)
})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

async function loadActivities() {
  try {
    const [activityRes, coursesRes] = await Promise.all([
      api.get('/user/recent-activity?limit=100'),
      api.get('/user/courses'),
    ])

    activities.value = activityRes.data.activities || activityRes.data || []
    userCourses.value = coursesRes.data.data || coursesRes.data || []

    // Calcular paginación
    pagination.totalPages = Math.ceil(activities.value.length / pagination.perPage)
  } catch (error) {
    console.error('Error cargando actividad:', error)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filter.type = 'all'
  filter.course = 'all'
  filter.dateRange = { from: null, to: null }
}

onMounted(() => {
  loadActivities()
})
</script>

<style lang="scss" scoped>
.user-activity-page {
  .activity-item {
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
