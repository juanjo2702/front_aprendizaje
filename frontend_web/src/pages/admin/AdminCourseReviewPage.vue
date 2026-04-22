<template>
  <q-page class="admin-page q-pa-xl" data-cy="admin-course-review-page">
    <div class="page-wrap">
      <div v-if="loading" class="q-py-md">
        <q-skeleton v-for="n in 4" :key="n" type="rect" height="140px" class="q-mb-md" dark />
      </div>

      <template v-else-if="course">
        <section class="hero-panel q-pa-xl q-mb-lg">
          <div class="row q-col-gutter-xl items-center">
            <div class="col-12 col-lg-8">
              <q-badge :color="statusColor(course.status)" outline class="q-mb-md">
                {{ statusLabel(course.status) }}
              </q-badge>
              <h1 class="q-mb-sm">{{ course.title }}</h1>
              <p class="hero-copy q-mb-lg">
                {{ course.short_description || course.description || 'Este curso aún no tiene descripción.' }}
              </p>
              <div class="row q-gutter-sm">
                <q-btn color="primary" no-caps icon="visibility" data-cy="admin-preview-course-btn" label="Preview curso" @click="previewCourse" />
                <q-btn flat no-caps color="secondary" icon="folder" label="Abrir builder" @click="openBuilder" />
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <q-card class="hero-summary q-pa-lg">
                <div class="text-subtitle1 text-weight-bold q-mb-md">Checklist rápido</div>
                <div class="text-caption text-grey-5 q-mb-xs">Docente</div>
                <div class="text-body1 q-mb-sm">{{ course.instructor?.name }} · {{ course.instructor?.email }}</div>
                <div class="text-caption text-grey-5 q-mb-xs">Estructura</div>
                <div class="text-body2 q-mb-sm">{{ course.modules?.length || 0 }} módulos · {{ totalLessons }} lecciones</div>
                <div class="text-caption text-grey-5 q-mb-xs">Ventas completadas</div>
                <div class="text-body2">{{ formatCurrency(course.completed_sales_amount || 0) }}</div>
              </q-card>
            </div>
          </div>
        </section>

        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-xl-7">
            <q-card class="panel-card">
              <q-card-section>
                <div class="text-h6 text-weight-bold">Inspección del contenido</div>
                <div class="text-caption text-grey-5">
                  Navega módulo por módulo y entra al Learning Player en modo preview cuando lo necesites.
                </div>
              </q-card-section>
              <q-separator dark />
              <q-card-section class="column q-gutter-md">
                <q-card
                  v-for="module in course.modules || []"
                  :key="module.id"
                  flat
                  bordered
                  class="module-card"
                >
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">{{ module.title }}</div>
                    <div class="text-caption text-grey-5">{{ module.description || 'Sin descripción del módulo.' }}</div>
                  </q-card-section>
                  <q-separator dark />
                  <q-list separator dark>
                    <q-item v-for="lesson in module.lessons || []" :key="lesson.id">
                      <q-item-section>
                        <q-item-label>{{ lesson.title }}</q-item-label>
                        <q-item-label caption>
                          {{ lessonTypeLabel(lesson.type) }} · {{ lesson.is_free ? 'Libre' : 'Inscritos' }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side class="row items-center q-gutter-sm">
                        <q-badge outline color="secondary">{{ lessonTypeLabel(lesson.type) }}</q-badge>
                        <q-btn flat round color="primary" icon="play_circle" :data-cy="`admin-preview-lesson-btn-${lesson.id}`" @click="previewLesson(lesson)" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-xl-5">
            <q-card class="panel-card q-mb-lg">
              <q-card-section>
                <div class="text-h6 text-weight-bold">Decisión administrativa</div>
                <div class="text-caption text-grey-5">El único flujo que puede publicar el curso vive aquí.</div>
              </q-card-section>
              <q-separator dark />
              <q-card-section class="column q-gutter-md">
                <q-input
                  v-model="reviewNotes"
                  type="textarea"
                  outlined
                  autogrow
                  label="Notas para el docente / auditoría"
                />

                <div class="row q-gutter-sm">
                  <q-btn color="positive" no-caps data-cy="course-publish-btn" label="Aprobar y publicar" :loading="savingStatus" @click="updateStatus('published')" />
                  <q-btn color="warning" no-caps label="Mantener en revisión" :loading="savingStatus" @click="updateStatus('pending')" />
                  <q-btn flat no-caps color="secondary" label="Devolver a borrador" :loading="savingStatus" @click="updateStatus('draft')" />
                </div>
              </q-card-section>
            </q-card>

            <q-card class="panel-card">
              <q-card-section>
                <div class="text-h6 text-weight-bold">Historial comercial</div>
                <div class="text-caption text-grey-5">Pagos recientes ligados a este curso.</div>
              </q-card-section>
              <q-separator dark />
              <q-card-section class="q-pa-none">
                <q-list separator dark>
                  <q-item v-for="payment in course.payments || []" :key="payment.id">
                    <q-item-section>
                      <q-item-label>{{ payment.user?.name || 'Estudiante' }}</q-item-label>
                      <q-item-label caption>{{ payment.transaction_id || 'Sin transacción' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side class="text-right">
                      <div>{{ formatCurrency(payment.amount) }}</div>
                      <q-badge :color="payment.status === 'completed' ? 'positive' : (payment.status === 'pending' ? 'warning' : 'negative')" rounded>
                        {{ payment.status }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!(course.payments || []).length">
                    <q-item-section class="text-grey-5">Todavía no hay pagos registrados para este curso.</q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const props = defineProps({
  courseId: { type: [String, Number], required: true },
})

const $q = useQuasar()
const router = useRouter()
const loading = ref(true)
const savingStatus = ref(false)
const course = ref(null)
const reviewNotes = ref('')

const totalLessons = computed(() =>
  (course.value?.modules || []).reduce((sum, module) => sum + Number(module.lessons?.length || 0), 0),
)

function statusLabel(status) {
  return ({ draft: 'Borrador', pending: 'Pendiente', published: 'Publicado' }[status] || status)
}

function statusColor(status) {
  return ({ draft: 'secondary', pending: 'warning', published: 'positive' }[status] || 'grey-6')
}

function lessonTypeLabel(type) {
  return ({ video: 'Video', resource: 'Documento', reading: 'Lectura', interactive: 'Actividad' }[type] || type)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(Number(amount || 0))
}

async function loadCourse() {
  loading.value = true
  try {
    const { data } = await api.get(`/admin/courses/${props.courseId}/review`)
    course.value = data
    reviewNotes.value = data.review_notes || ''
  } finally {
    loading.value = false
  }
}

function previewCourse() {
  if (!course.value?.slug) return
  router.push({
    name: 'admin-course-preview',
    params: { slug: course.value.slug },
    query: {
      courseId: String(course.value.id),
      courseTitle: course.value.title,
    },
  })
}

function previewLesson(lesson) {
  router.push({
    name: 'admin-lesson-preview',
    params: { lessonId: lesson.id },
    query: {
      courseId: String(course.value.id),
      courseTitle: course.value.title,
    },
  })
}

function openBuilder() {
  if (!course.value?.id) return
  router.push({
    name: 'teacher-course-builder',
    params: { courseId: course.value.id },
    query: { courseTitle: course.value.title },
  })
}

async function updateStatus(status) {
  if (!course.value?.id) return
  savingStatus.value = true
  try {
    const { data } = await api.put(`/admin/courses/${course.value.id}/approval-status`, {
      status,
      review_notes: reviewNotes.value || null,
    })
    $q.notify({ type: 'positive', message: data.message })
    await loadCourse()
  } finally {
    savingStatus.value = false
  }
}

onMounted(loadCourse)
</script>

<style scoped lang="scss">
.admin-page {
  background: transparent;
}

.page-wrap {
  max-width: 1340px;
  margin: 0 auto;
}

.hero-panel {
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(0, 196, 180, 0.16), transparent 36%),
    radial-gradient(circle at bottom left, rgba(39, 112, 255, 0.14), transparent 30%),
    linear-gradient(145deg, rgba(12, 27, 50, 0.98), rgba(8, 18, 36, 0.98));
  border: 1px solid rgba(93, 122, 255, 0.18);
}

.hero-panel h1 {
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.08;
  margin: 0;
}

.hero-copy {
  color: #c1d0eb;
}

.hero-summary,
.panel-card,
.module-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}
</style>
