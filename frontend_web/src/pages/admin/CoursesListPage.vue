<template>
  <q-page class="admin-page q-pa-xl" data-cy="admin-review-inbox-page">
    <div class="page-wrap">
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-lg">
          <h2 class="q-mb-xs">Bandeja de revisión de cursos</h2>
          <p class="q-mb-none text-grey-5">
            El administrador decide qué pasa de borrador o pendiente a publicado, y puede inspeccionar el player antes
            de aprobar.
          </p>
        </div>
        <div class="col-12 col-lg-auto row q-gutter-sm">
          <q-btn flat no-caps color="secondary" icon="refresh" label="Recargar" :loading="loading" @click="loadCourses" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <q-card class="summary-card q-pa-md">
            <div class="text-caption text-grey-5">Pendientes</div>
            <div class="text-h4 text-weight-bold text-warning">{{ pendingCount }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="summary-card q-pa-md">
            <div class="text-caption text-grey-5">Publicados</div>
            <div class="text-h4 text-weight-bold text-positive">{{ publishedCount }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="summary-card q-pa-md">
            <div class="text-caption text-grey-5">Borradores</div>
            <div class="text-h4 text-weight-bold text-secondary">{{ draftCount }}</div>
          </q-card>
        </div>
      </div>

      <q-card class="panel-card q-pa-md q-mb-lg">
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-5">
            <q-input v-model="filters.search" outlined dense clearable label="Buscar curso o docente">
              <template #prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Estado"
            />
          </div>
          <div class="col-12 col-md-4 row justify-end q-gutter-sm">
            <q-btn flat no-caps color="grey-5" label="Limpiar" @click="resetFilters" />
            <q-btn color="primary" no-caps label="Aplicar" @click="loadCourses" />
          </div>
        </div>
      </q-card>

      <q-card class="panel-card">
        <q-card-section class="q-pa-none">
          <q-table
            data-cy="admin-review-table"
            :rows="courses"
            :columns="columns"
            row-key="id"
            flat
            dark
            :loading="loading"
            :pagination="{ rowsPerPage: 15 }"
          >
            <template #body-cell-title="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.title }}</div>
                <div class="text-caption text-grey-5">{{ props.row.category?.name || 'Sin categoría' }}</div>
              </q-td>
            </template>

            <template #body-cell-instructor="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.instructor?.name || 'Sin docente' }}</div>
                <div class="text-caption text-grey-5">{{ props.row.instructor?.email || '-' }}</div>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="statusColor(props.row.status)" rounded>
                  {{ statusLabel(props.row.status) }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-structure="props">
              <q-td :props="props">
                <div class="text-caption">{{ props.row.modules_count || 0 }} módulos</div>
                <div class="text-caption text-grey-5">{{ props.row.lessons_count || 0 }} lecciones</div>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row justify-end q-gutter-xs">
                  <q-btn flat round color="primary" icon="assignment_turned_in" :data-cy="`review-course-btn-${props.row.id}`" @click="openReview(props.row)" />
                  <q-btn flat round color="secondary" icon="visibility" @click="previewCourse(props.row)" />
                  <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <q-dialog v-model="deleteDialog" persistent>
        <q-card style="min-width: 360px">
          <q-card-section>
            <div class="text-h6">Eliminar curso</div>
            <div class="q-mt-sm">
              ¿Seguro que deseas eliminar <strong>{{ selectedCourse?.title }}</strong> de la plataforma?
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn color="negative" no-caps label="Eliminar" :loading="deleting" @click="deleteCourse" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const selectedCourse = ref(null)
const courses = ref([])
const filters = ref({
  search: '',
  status: null,
})

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Publicado', value: 'published' },
]

const columns = [
  { name: 'title', label: 'Curso', field: 'title', align: 'left' },
  { name: 'instructor', label: 'Docente', field: 'instructor', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'structure', label: 'Estructura', field: 'modules_count', align: 'center' },
  { name: 'total_students', label: 'Estudiantes', field: 'total_students', align: 'center' },
  { name: 'created_at', label: 'Creado', field: (row) => formatDate(row.created_at), align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

const pendingCount = computed(() => courses.value.filter((course) => course.status === 'pending').length)
const publishedCount = computed(() => courses.value.filter((course) => course.status === 'published').length)
const draftCount = computed(() => courses.value.filter((course) => course.status === 'draft').length)

function statusLabel(status) {
  return ({ draft: 'Borrador', pending: 'Pendiente', published: 'Publicado' }[status] || status)
}

function statusColor(status) {
  return ({ draft: 'secondary', pending: 'warning', published: 'positive' }[status] || 'grey-6')
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function resetFilters() {
  filters.value = {
    search: '',
    status: null,
  }
  loadCourses()
}

async function loadCourses() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.status) params.status = filters.value.status

    const { data } = await api.get('/admin/courses/review-inbox', { params })
    courses.value = data.data || []
  } finally {
    loading.value = false
  }
}

function openReview(course) {
  router.push({
    name: 'admin-course-review',
    params: { courseId: course.id },
    query: { courseTitle: course.title },
  })
}

function previewCourse(course) {
  router.push({
    name: 'admin-course-preview',
    params: { slug: course.slug },
    query: {
      courseId: String(course.id),
      courseTitle: course.title,
    },
  })
}

function confirmDelete(course) {
  selectedCourse.value = course
  deleteDialog.value = true
}

async function deleteCourse() {
  if (!selectedCourse.value) return
  deleting.value = true
  try {
    await api.delete(`/admin/courses/${selectedCourse.value.id}`)
    $q.notify({
      type: 'positive',
      message: `Curso "${selectedCourse.value.title}" eliminado correctamente.`,
    })
    deleteDialog.value = false
    selectedCourse.value = null
    await loadCourses()
  } finally {
    deleting.value = false
  }
}

onMounted(loadCourses)
</script>

<style scoped lang="scss">
.admin-page {
  background: transparent;
}

.page-wrap {
  max-width: 1340px;
  margin: 0 auto;
}

.summary-card,
.panel-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}
</style>
