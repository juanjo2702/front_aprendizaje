<template>
  <q-page class="teacher-page q-pa-xl" data-cy="teacher-students-page">
    <div class="page-wrap">
      <section class="hero-panel q-pa-xl q-mb-lg">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-lg-7">
            <q-badge color="secondary" outline class="q-mb-md">Teacher Control</q-badge>
            <h1 class="q-mb-sm">Mis alumnos y alertas de seguimiento</h1>
            <p class="hero-copy q-mb-none">
              Filtra por curso, detecta alumnos en riesgo y entra al detalle de progreso, errores y preguntas.
            </p>
          </div>

          <div class="col-12 col-lg-5">
            <q-card class="hero-summary q-pa-lg">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Índice de alerta</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-5">Preguntas abiertas</div>
                  <div class="text-h5 text-secondary">{{ alertsSummary.open_questions || 0 }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Alumnos en riesgo</div>
                  <div class="text-h5 text-negative">{{ alertsSummary.risk_students || 0 }}</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </section>

      <section class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-xl-4">
          <q-card flat bordered class="panel-card q-pa-lg">
            <div class="text-h6 text-weight-bold q-mb-md">Contexto del curso</div>
            <q-select
              v-model="selectedCourseId"
              data-cy="teacher-student-course-select"
              outlined
              dense
              emit-value
              map-options
              label="Curso"
              :options="courseOptions"
              @update:model-value="loadStudents"
            />
            <q-input
              v-model="search"
              data-cy="teacher-student-search-input"
              outlined
              dense
              class="q-mt-md"
              label="Buscar alumno"
              debounce="350"
              @update:model-value="loadStudents"
            />
          </q-card>
        </div>

        <div class="col-12 col-xl-8">
          <q-card flat bordered class="panel-card q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-h6 text-weight-bold">Alertas recientes</div>
                <div class="text-caption text-grey-5">Preguntas sin resolver y señales de apoyo prioritario.</div>
              </div>
              <q-btn flat no-caps color="grey-4" icon="refresh" label="Recargar" @click="loadAlerts" />
            </div>

            <q-list v-if="alerts.length" dark separator>
              <q-item v-for="(alert, index) in alerts" :key="`${alert.type}-${index}`">
                <q-item-section avatar>
                  <q-avatar :color="alert.type === 'question' ? 'secondary' : 'negative'" text-color="white">
                    <q-icon :name="alert.type === 'question' ? 'forum' : 'warning' " />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ alert.student_name || 'Alumno' }}</q-item-label>
                  <q-item-label caption>
                    {{ describeAlert(alert) }}
                  </q-item-label>
                  <q-item-label v-if="alert.course_title || alert.lesson_title" caption class="text-secondary">
                    {{ describeAlertContext(alert) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="items-end q-gutter-xs">
                  <div class="text-caption text-grey-6">
                    {{ formatDate(alert.created_at) }}
                  </div>
                  <q-btn
                    v-if="canOpenAlertContext(alert)"
                    flat
                    dense
                    no-caps
                    size="sm"
                    color="secondary"
                    icon="open_in_new"
                    label="Abrir contexto"
                    @click="openAlertContext(alert)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-grey-5">No hay alertas activas por ahora.</div>
          </q-card>
        </div>
      </section>

      <q-card flat bordered class="panel-card q-pa-md">
        <q-table
          flat
          dark
          :rows="students"
          :columns="columns"
          row-key="id"
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
                  <div class="text-caption text-grey-5">{{ slotProps.row.student.level_title }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-progress="slotProps">
            <q-td :props="slotProps">
              <div class="progress-cell">
                <div class="row justify-between text-caption">
                  <span>Avance</span>
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

          <template #body-cell-average_activity_score="slotProps">
            <q-td :props="slotProps">
              <q-chip dense :color="scoreColor(slotProps.row.average_activity_score)" text-color="white">
                {{ slotProps.row.average_activity_score }}%
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-last_activity_at="slotProps">
            <q-td :props="slotProps">
              {{ formatDate(slotProps.row.last_activity_at) || 'Sin actividad' }}
            </q-td>
          </template>

          <template #body-cell-alert="slotProps">
            <q-td :props="slotProps">
              <q-badge :color="alertColor(slotProps.row.alert_index?.severity)">
                {{ alertLabel(slotProps.row.alert_index?.severity) }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="slotProps">
            <q-td :props="slotProps">
              <q-btn flat no-caps color="secondary" :data-cy="`student-drilldown-btn-${slotProps.row.student.id}`" label="Ver detalle" @click="openDrilldown(slotProps.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <q-dialog v-model="detailDialog">
      <q-card class="detail-dialog" data-cy="student-drilldown-dialog">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">{{ selectedStudentDetail?.student?.name || 'Detalle del alumno' }}</div>
            <div class="text-caption text-grey-5">
              {{ selectedStudentDetail?.student?.level_title || 'Sin nivel' }}
            </div>
          </div>
          <q-btn flat round dense icon="close" @click="detailDialog = false" />
        </q-card-section>

        <q-card-section v-if="detailLoading" class="q-pt-none">
          <q-skeleton dark type="rect" height="120px" class="q-mb-md" />
          <q-skeleton dark type="rect" height="120px" />
        </q-card-section>

        <q-card-section v-else-if="selectedStudentDetail" class="q-pt-none">
          <div class="detail-grid">
            <q-card flat bordered class="detail-panel">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Historial de lecciones</div>
              <q-list dark separator>
                <q-item
                  v-for="(entry, index) in selectedStudentDetail.videos_and_lessons.slice(0, 8)"
                  :key="index"
                >
                  <q-item-section>
                    <q-item-label>{{ entry.lesson_title }}</q-item-label>
                    <q-item-label caption>{{ entry.module_title }} · {{ entry.lesson_type }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="entry.is_completed ? 'positive' : 'warning'">
                      {{ entry.watch_ratio || 0 }}%
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>

            <q-card flat bordered class="detail-panel">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Preguntas falladas</div>
              <q-list v-if="selectedStudentDetail.failed_questions.length" dark separator>
                <q-item
                  v-for="(entry, index) in selectedStudentDetail.failed_questions.slice(0, 8)"
                  :key="index"
                >
                  <q-item-section>
                    <q-item-label>{{ entry.question }}</q-item-label>
                    <q-item-label caption>{{ entry.quiz_title }}</q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-caption text-negative">
                    {{ entry.attempt_percentage }}%
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey-5">No hay errores registrados en quizzes.</div>
            </q-card>

            <q-card flat bordered class="detail-panel">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Actividades con bajo rendimiento</div>
              <q-list v-if="selectedStudentDetail.failed_activities.length" dark separator>
                <q-item
                  v-for="(entry, index) in selectedStudentDetail.failed_activities.slice(0, 8)"
                  :key="index"
                >
                  <q-item-section>
                    <q-item-label>{{ entry.lesson_title }}</q-item-label>
                    <q-item-label caption>{{ entry.module_title }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="negative">{{ entry.score }}/{{ entry.max_score }}</q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey-5">No hay actividades críticas en este curso.</div>
            </q-card>

            <q-card flat bordered class="detail-panel">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Preguntas recientes del alumno</div>
              <q-list v-if="selectedStudentDetail.recent_questions.length" dark separator>
                <q-item
                  v-for="question in selectedStudentDetail.recent_questions"
                  :key="question.id"
                >
                  <q-item-section>
                    <q-item-label>{{ question.body }}</q-item-label>
                    <q-item-label caption>
                      {{ question.reply_count }} respuestas · {{ question.resolved_at ? 'Resuelta' : 'Abierta' }}
                    </q-item-label>
                    <q-item-label v-if="question.course_title || question.lesson_title" caption class="text-secondary">
                      {{ describeAlertContext(question) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      v-if="canOpenAlertContext(question)"
                      flat
                      dense
                      no-caps
                      size="sm"
                      color="secondary"
                      icon="open_in_new"
                      label="Responder"
                      @click="openAlertContext(question)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey-5">No abrió hilos recientes en este curso.</div>
            </q-card>

            <q-card flat bordered class="detail-panel">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Intentos de actividades</div>
              <q-list v-if="selectedStudentDetail.activity_attempts.length" dark separator>
                <q-item
                  v-for="(attempt, index) in selectedStudentDetail.activity_attempts.slice(0, 10)"
                  :key="index"
                >
                  <q-item-section>
                    <q-item-label>{{ attempt.lesson_title }}</q-item-label>
                    <q-item-label caption>
                      {{ attempt.module_title }} · intento {{ attempt.attempt_number }} · {{ attempt.score }}%
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="attempt.status === 'passed' ? 'positive' : attempt.status === 'locked' ? 'negative' : 'warning'">
                      {{ attempt.status }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-grey-5">No hay intentos registrados todavía.</div>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api } from 'src/services/api'

const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const detailLoading = ref(false)
const detailDialog = ref(false)
const search = ref('')
const selectedCourseId = ref(null)
const courses = ref([])
const students = ref([])
const alerts = ref([])
const alertsSummary = ref({})
const selectedStudentDetail = ref(null)

const columns = [
  { name: 'student', label: 'Alumno', field: 'student', align: 'left' },
  { name: 'progress', label: 'Progreso', field: 'progress', align: 'left' },
  { name: 'average_activity_score', label: 'Promedio actividades', field: 'average_activity_score', align: 'left' },
  { name: 'last_activity_at', label: 'Última actividad', field: 'last_activity_at', align: 'left' },
  { name: 'alert', label: 'Alerta', field: 'alert_index', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const courseOptions = computed(() => courses.value.map((course) => ({
  label: course.title,
  value: course.id,
})))

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

  return new Date(value).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scoreColor(score) {
  if (score >= 80) return 'positive'
  if (score >= 60) return 'warning'
  return 'negative'
}

function alertColor(severity) {
  return (
    {
      high: 'negative',
      medium: 'warning',
      normal: 'positive',
    }[severity] || 'grey-6'
  )
}

function alertLabel(severity) {
  return (
    {
      high: 'Alta',
      medium: 'Media',
      normal: 'Normal',
    }[severity] || 'Sin datos'
  )
}

function describeAlert(alert) {
  if (alert.type === 'question') {
    return alert.message
  }

  return `${alert.course_title} · ${alert.failed_activities_count || 0} fallos · ${alert.days_inactive || 0} días sin entrar`
}

function describeAlertContext(alert) {
  const courseTitle = alert.course_title || 'Curso'
  const lessonTitle = alert.lesson_title || null

  return lessonTitle ? `${courseTitle} · ${lessonTitle}` : courseTitle
}

function canOpenAlertContext(alert) {
  return Boolean(alert.course_slug || alert.lesson_id)
}

function openAlertContext(alert) {
  if (alert.lesson_id) {
    router.push({
      name: 'teacher-lesson-preview',
      params: { lessonId: alert.lesson_id },
      query: {
        courseTitle: alert.course_title || '',
        focusComment: alert.id ? String(alert.id) : '',
      },
    })
    return
  }

  if (alert.course_slug) {
    router.push({
      name: 'teacher-course-preview',
      params: { slug: alert.course_slug },
      query: {
        focusComment: alert.id ? String(alert.id) : '',
      },
    })
  }
}

async function loadCourses() {
  const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
  courses.value = data?.data || []
  if (!selectedCourseId.value && courses.value.length) {
    selectedCourseId.value = courses.value[0].id
  }
}

async function loadStudents() {
  if (!selectedCourseId.value) return

  loading.value = true

  try {
    const { data } = await api.get(`/instructor/courses/${selectedCourseId.value}/students`, {
      params: {
        search: search.value || undefined,
      },
    })

    students.value = data?.students || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo cargar la lista de alumnos.',
    })
  } finally {
    loading.value = false
  }
}

async function loadAlerts() {
  try {
    const { data } = await api.get('/instructor/alerts')
    alerts.value = data?.alerts || []
    alertsSummary.value = data?.summary || {}
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudieron cargar las alertas.',
    })
  }
}

async function openDrilldown(row) {
  detailDialog.value = true
  detailLoading.value = true
  selectedStudentDetail.value = null

  try {
    const { data } = await api.get(`/instructor/courses/${selectedCourseId.value}/students/${row.student.id}`)
    selectedStudentDetail.value = data
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo abrir el detalle del alumno.',
    })
    detailDialog.value = false
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadCourses()
  await Promise.all([loadStudents(), loadAlerts()])
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
.panel-card,
.detail-panel {
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

.detail-dialog {
  width: min(1180px, 94vw);
  max-width: 94vw;
  background: #111426;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.detail-panel {
  padding: 18px;
}

@media (max-width: 1023px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
