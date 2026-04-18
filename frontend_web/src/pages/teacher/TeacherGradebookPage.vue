<template>
  <q-page class="teacher-page q-pa-xl">
    <div class="page-wrap">
      <section class="hero-panel q-pa-xl q-mb-lg">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-lg-7">
            <q-badge color="secondary" outline class="q-mb-md">Gradebook</q-badge>
            <h1 class="q-mb-sm">Libreta de notas e intentos</h1>
            <p class="hero-copy q-mb-none">
              Revisa cuántos intentos necesitó cada alumno, su mejor puntaje y si la actividad quedó bloqueada.
            </p>
          </div>

          <div class="col-12 col-lg-5">
            <q-card class="hero-summary q-pa-lg">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Actividad seleccionada</div>
              <div class="text-body1 text-weight-medium">{{ selectedActivity?.lesson_title || 'Sin actividad' }}</div>
              <div class="text-caption text-grey-5 q-mt-xs">
                {{ selectedActivity?.module_title || 'Sin módulo' }} · {{ selectedActivity?.activity_type || 'Sin tipo' }}
              </div>
              <div class="text-caption text-grey-5 q-mt-sm">
                {{ selectedActivity?.max_attempts || 0 }} intentos · {{ selectedActivity?.passing_score || 0 }}% · {{ selectedActivity?.xp_reward || 0 }} XP
              </div>
            </q-card>
          </div>
        </div>
      </section>

      <section class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-xl-4">
          <q-card flat bordered class="panel-card q-pa-lg">
            <div class="text-h6 text-weight-bold q-mb-md">Filtros</div>
            <q-select
              v-model="selectedCourseId"
              outlined
              dense
              emit-value
              map-options
              label="Curso"
              :options="courseOptions"
              @update:model-value="handleCourseChange"
            />
            <q-select
              v-model="selectedActivityId"
              outlined
              dense
              emit-value
              map-options
              class="q-mt-md"
              label="Actividad"
              :options="activityOptions"
              @update:model-value="loadGradebook"
            />
          </q-card>
        </div>

        <div class="col-12 col-xl-8">
          <q-card flat bordered class="panel-card q-pa-lg">
            <div class="row items-center justify-between">
              <div>
                <div class="text-h6 text-weight-bold">Resumen de resultados</div>
                <div class="text-caption text-grey-5">Enfócate rápido en bloqueos, intentos altos y notas bajas.</div>
              </div>
              <q-btn flat no-caps color="grey-4" icon="refresh" label="Recargar" @click="loadGradebook" />
            </div>

            <div class="row q-col-gutter-md q-mt-md">
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-5">Aprobados</div>
                <div class="text-h5 text-positive">{{ approvedCount }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-5">Bloqueados</div>
                <div class="text-h5 text-negative">{{ lockedCount }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-5">Promedio de intentos</div>
                <div class="text-h5 text-secondary">{{ averageAttempts }}</div>
              </div>
            </div>
          </q-card>
        </div>
      </section>

      <q-card flat bordered class="panel-card q-pa-md">
        <q-table
          flat
          dark
          row-key="id"
          :rows="rows"
          :columns="columns"
          :loading="loading"
          rows-per-page-label="Filas"
        >
          <template #body-cell-student="slotProps">
            <q-td :props="slotProps">
              <div class="row items-center q-gutter-sm">
                <q-avatar size="38px">
                  <img v-if="slotProps.row.student.avatar" :src="slotProps.row.student.avatar" />
                  <span v-else>{{ initialsFrom(slotProps.row.student.name) }}</span>
                </q-avatar>
                <div>
                  <div class="text-weight-medium">{{ slotProps.row.student.name }}</div>
                  <div class="text-caption text-grey-5">{{ slotProps.row.student.email }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-progress="slotProps">
            <q-td :props="slotProps">
              <div class="progress-cell">
                <div class="row justify-between text-caption">
                  <span>Progreso curso</span>
                  <span>{{ slotProps.row.progress }}%</span>
                </div>
                <q-linear-progress
                  rounded
                  size="10px"
                  :color="slotProps.row.progress >= 70 ? 'positive' : slotProps.row.progress >= 40 ? 'warning' : 'negative'"
                  :value="slotProps.row.progress / 100"
                />
              </div>
            </q-td>
          </template>

          <template #body-cell-attempts_used="slotProps">
            <q-td :props="slotProps">
              <q-chip dense :color="attemptChipColor(slotProps.row.attempts_used)" text-color="white">
                {{ slotProps.row.attempts_used }} intento(s)
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-best_score="slotProps">
            <q-td :props="slotProps">
              <div class="text-weight-medium">{{ slotProps.row.best_score }}%</div>
              <div class="text-caption text-grey-5">Promedio: {{ slotProps.row.average_score }}%</div>
            </q-td>
          </template>

          <template #body-cell-status="slotProps">
            <q-td :props="slotProps">
              <q-badge :color="statusColor(slotProps.row)">
                {{ statusLabel(slotProps.row) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-last_activity_at="slotProps">
            <q-td :props="slotProps">
              {{ formatDate(slotProps.row.last_activity_at) || 'Sin intentos' }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()

const loading = ref(false)
const courses = ref([])
const rows = ref([])
const activities = ref([])
const selectedActivity = ref(null)
const selectedCourseId = ref(null)
const selectedActivityId = ref(null)

const columns = [
  { name: 'student', label: 'Alumno', field: 'student', align: 'left' },
  { name: 'progress', label: 'Progreso', field: 'progress', align: 'left' },
  { name: 'attempts_used', label: 'Intentos', field: 'attempts_used', align: 'left' },
  { name: 'best_score', label: 'Puntaje', field: 'best_score', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'last_activity_at', label: 'Último intento', field: 'last_activity_at', align: 'left' },
]

const courseOptions = computed(() => courses.value.map((course) => ({ label: course.title, value: course.id })))
const activityOptions = computed(() => activities.value.map((activity) => ({
  label: `${activity.module_title || 'Sin módulo'} · ${activity.label}`,
  value: activity.id,
})))
const approvedCount = computed(() => rows.value.filter((row) => row.status === 'completed').length)
const lockedCount = computed(() => rows.value.filter((row) => row.is_locked).length)
const averageAttempts = computed(() => {
  if (!rows.value.length) return 0
  return (rows.value.reduce((acc, row) => acc + Number(row.attempts_used || 0), 0) / rows.value.length).toFixed(1)
})

function formatError(error, fallback) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length) return errors[firstKey][0]
  }
  return error?.response?.data?.message || error?.message || fallback
}

function initialsFrom(name = '') {
  return String(name || '')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-BO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function attemptChipColor(attempts) {
  if (attempts <= 1) return 'positive'
  if (attempts <= 2) return 'warning'
  return 'negative'
}

function statusColor(row) {
  if (row.is_locked) return 'negative'
  if (row.status === 'completed') return 'positive'
  if (row.status === 'failed') return 'warning'
  return 'grey-6'
}

function statusLabel(row) {
  if (row.is_locked) return 'Bloqueado'
  if (row.status === 'completed') return 'Aprobado'
  if (row.status === 'failed') return 'Pendiente'
  return 'Sin intentos'
}

async function loadCourses() {
  const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
  courses.value = data?.data || []
  if (!selectedCourseId.value && courses.value.length) {
    selectedCourseId.value = courses.value[0].id
  }
}

async function loadGradebook() {
  if (!selectedCourseId.value) return

  loading.value = true
  try {
    const { data } = await api.get(`/instructor/courses/${selectedCourseId.value}/gradebook`, {
      params: {
        interactive_config_id: selectedActivityId.value || undefined,
      },
    })

    activities.value = data?.activities || []
    selectedActivity.value = data?.selected_activity || null
    if (!selectedActivityId.value && data?.selected_activity?.id) {
      selectedActivityId.value = data.selected_activity.id
    }
    rows.value = data?.rows || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo cargar la libreta de notas.'),
    })
  } finally {
    loading.value = false
  }
}

async function handleCourseChange() {
  selectedActivityId.value = null
  await loadGradebook()
}

onMounted(async () => {
  loading.value = true
  try {
    await loadCourses()
    await loadGradebook()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo iniciar la libreta de notas.'),
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.teacher-page {
  background: transparent;
}

.page-wrap {
  max-width: 1320px;
  margin: 0 auto;
}

.hero-panel,
.panel-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 28px;
}

.hero-panel {
  background:
    radial-gradient(circle at top right, rgba(108, 92, 231, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(0, 210, 211, 0.1), transparent 28%),
    linear-gradient(145deg, rgba(29, 31, 66, 0.98), rgba(18, 20, 46, 0.98));
}

.hero-panel h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
  margin: 0;
}

.hero-copy {
  color: #b8bbd8;
}

.hero-summary {
  border-radius: 24px;
  background: rgba(13, 15, 35, 0.58);
  border: 1px solid rgba(118, 122, 180, 0.16);
}

.progress-cell {
  min-width: 180px;
}
</style>
