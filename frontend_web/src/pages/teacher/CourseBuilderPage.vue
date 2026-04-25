<template>
  <q-page class="q-pa-xl page-wrap" data-cy="teacher-course-builder-page">
    <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md">
        <h2 class="q-mb-xs">Course Builder 2.0</h2>
        <p class="q-mb-none">Gestiona cursos con jerarquía explícita: Curso > Módulo > Lección.</p>
      </div>
      <div class="col-12 col-md-auto row q-gutter-sm">
        <q-btn outline no-caps color="secondary" icon="science" label="Crear demo" data-cy="create-demo-course-btn" :loading="creatingDemo" @click="createDemoCourse" />
        <q-btn color="primary" no-caps icon="add" label="Crear curso" data-cy="create-course-btn" @click="openCreateDialog" />
      </div>
    </div>

    <q-banner class="bg-primary text-white q-mb-md" rounded>
      Primero creas un <strong>Curso</strong>. Luego agregas <strong>Módulos</strong>. Dentro de cada módulo creas
      <strong>Lecciones</strong> de tipo video, documento o actividad gamificada.
    </q-banner>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4"><q-card class="glass-card q-pa-md"><div class="text-caption text-grey-5">Cursos</div><div class="text-h4 text-weight-bold">{{ courses.length }}</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card class="glass-card q-pa-md"><div class="text-caption text-grey-5">Publicados</div><div class="text-h4 text-weight-bold text-positive">{{ publishedCount }}</div></q-card></div>
      <div class="col-12 col-sm-4"><q-card class="glass-card q-pa-md"><div class="text-caption text-grey-5">Draft + revisión</div><div class="text-h4 text-weight-bold text-warning">{{ draftCount }}</div></q-card></div>
    </div>

    <q-card class="glass-card q-pa-md q-mb-lg">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-6">
          <q-input v-model="filters.search" data-cy="course-search-input" outlined dense clearable label="Buscar curso">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-select v-model="filters.status" data-cy="course-status-filter" :options="statusOptions" emit-value map-options outlined dense clearable label="Estado" />
        </div>
        <div class="col-12 col-md-3 row justify-end">
          <q-btn flat no-caps color="grey-4" label="Limpiar filtros" @click="resetFilters" />
        </div>
      </div>
    </q-card>

    <div v-if="loading" class="q-py-md">
      <q-skeleton v-for="n in 4" :key="n" type="rect" height="140px" class="q-mb-md" dark />
    </div>
    <div v-else-if="filteredCourses.length === 0" class="text-center q-py-xl">
      <q-icon name="auto_stories" size="80px" color="grey-7" />
      <h4 class="q-mt-md" style="color:#8b8ba7">Todavía no hay cursos para mostrar</h4>
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="course in filteredCourses" :key="course.id" class="glass-card q-pa-md" :data-cy="`course-card-${course.id}`">
        <div class="row q-col-gutter-lg items-center">
          <div class="col-12 col-md-7">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div class="text-h6 text-weight-bold">{{ course.title }}</div>
              <q-badge :color="statusColor(course.status)" rounded>{{ statusLabel(course.status) }}</q-badge>
              <q-badge v-if="course.has_certificate" color="secondary" outline rounded>Certificado</q-badge>
              <q-badge
                v-if="course.has_certificate && course.certificate_requires_final_exam"
                color="warning"
                outline
                rounded
              >
                Examen final
              </q-badge>
            </div>
            <div class="text-caption text-grey-5 q-mb-sm">{{ course.category?.name || 'Sin categoría' }} · {{ levelLabel(course.level) }} · {{ (course.language || 'es').toUpperCase() }}</div>
            <div class="text-body2 text-grey-4">{{ course.short_description || course.description || 'Sin descripción todavía.' }}</div>
          </div>
          <div class="col-12 col-md-2">
            <div class="text-caption">Precio: {{ formatPrice(course.price) }}</div>
            <div class="text-caption">Módulos: {{ course.modules_count || 0 }}</div>
            <div class="text-caption">Lecciones: {{ course.lessons_count || 0 }}</div>
            <div class="text-caption">Estudiantes: {{ course.total_students || 0 }}</div>
            <div class="text-caption">Activos 7d: {{ course.active_students || 0 }}</div>
          </div>
          <div class="col-12 col-md-3">
            <div class="column q-gutter-sm">
              <q-btn flat no-caps color="primary" icon="edit" label="Editar curso" :data-cy="`edit-course-btn-${course.id}`" @click="openEditDialog(course)" />
              <q-btn flat no-caps color="deep-purple-3" icon="account_tree" label="Abrir Builder 2.0" :data-cy="`open-course-builder-btn-${course.id}`" @click="openBuilder(course)" />
              <q-btn
                flat
                no-caps
                :data-cy="`course-status-toggle-${course.id}`"
                :color="course.status === 'published' ? 'warning' : (course.status === 'pending' ? 'secondary' : 'positive')"
                :icon="course.status === 'published' ? 'edit_off' : (course.status === 'pending' ? 'schedule_send' : 'publish')"
                :label="statusActionLabel(course)"
                @click="toggleCourseStatus(course)"
              />
              <div class="row justify-end q-gutter-sm">
                <q-btn flat round color="secondary" icon="visibility" :data-cy="`preview-course-btn-${course.id}`" @click="previewCourse(course)" />
                <q-btn flat round color="negative" icon="delete" @click="confirmDelete(course)" />
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <TeacherCourseDialog
      v-model="courseDialog"
      :course="editingCourse"
      :category-options="categoryOptions"
      :level-options="levelOptions"
      :status-options="statusOptions"
      :saving="saving"
      @save="saveCourse"
    />

    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width:360px">
        <q-card-section><div class="text-h6">Eliminar curso</div><div class="q-mt-sm">¿Seguro que quieres eliminar <strong>{{ selectedCourse?.title }}</strong>?</div></q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" color="primary" v-close-popup />
          <q-btn flat no-caps label="Eliminar" color="negative" :loading="deleting" @click="deleteCourse" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'
import TeacherCourseDialog from 'src/components/teacher/TeacherCourseDialog.vue'

const $q = useQuasar()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const creatingDemo = ref(false)
const courseDialog = ref(false)
const deleteDialog = ref(false)
const editingCourse = ref(null)
const selectedCourse = ref(null)
const courses = ref([])
const categoryOptions = ref([])
const filters = ref({ search: '', status: null })
const levelOptions = [{ label: 'Principiante', value: 'beginner' }, { label: 'Intermedio', value: 'intermediate' }, { label: 'Avanzado', value: 'advanced' }, { label: 'Todos los niveles', value: 'all_levels' }]
const statusOptions = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Pendiente de revisión', value: 'pending' },
  { label: 'Publicado', value: 'published' },
]

const filteredCourses = computed(() => {
  const search = filters.value.search.trim().toLowerCase()
  return courses.value.filter((course) => {
    const matchesSearch =
      !search ||
      [course.title, course.short_description, course.description, course.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))

    return matchesSearch && (!filters.value.status || course.status === filters.value.status)
  })
})

const publishedCount = computed(() => courses.value.filter((course) => course.status === 'published').length)
const draftCount = computed(() => courses.value.filter((course) => ['draft', 'pending'].includes(course.status)).length)

function resetFilters() {
  filters.value = { search: '', status: null }
}

function formatError(error, fallback) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length) return errors[firstKey][0]
  }
  return error?.response?.data?.message || error?.message || fallback
}

function normalizeCategoryOptions(categories) {
  return categories.flatMap((category) => [
    { label: category.name, value: category.id },
    ...(category.children || []).map((child) => ({
      label: `${category.name} / ${child.name}`,
      value: child.id,
    })),
  ])
}

function statusLabel(status) {
  return ({ draft: 'Borrador', pending: 'Pendiente', published: 'Publicado', archived: 'Archivado' }[status] || status)
}

function statusColor(status) {
  return ({ draft: 'warning', pending: 'orange', published: 'positive', archived: 'grey-6' }[status] || 'primary')
}

function levelLabel(level) {
  return ({ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', all_levels: 'Todos los niveles' }[level] || level)
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(Number(price || 0))
}

async function loadCategories() {
  const { data } = await api.get('/categories')
  categoryOptions.value = normalizeCategoryOptions(data || [])
}

async function loadCourses() {
  loading.value = true
  try {
    const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
    courses.value = data?.data || []
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudieron cargar tus cursos.') })
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingCourse.value = null
  courseDialog.value = true
}

function openEditDialog(course) {
  editingCourse.value = course
  courseDialog.value = true
}

async function saveCourse(payload) {
  saving.value = true
  try {
    const wasEditing = Boolean(editingCourse.value)
    const hasLocalThumbnail = Boolean(payload.thumbnail_file)
    const requestPayload = hasLocalThumbnail ? buildCourseFormData(payload, wasEditing) : payload
    const { data } = wasEditing
      ? (
        hasLocalThumbnail
          ? await api.post(`/courses/${editingCourse.value.id}`, requestPayload)
          : await api.put(`/courses/${editingCourse.value.id}`, requestPayload)
      )
      : await api.post('/courses', requestPayload)
    await loadCourses()
    courseDialog.value = false
    $q.notify({ type: 'positive', message: wasEditing ? `Curso "${data.title}" actualizado correctamente.` : `Curso "${data.title}" creado correctamente.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar el curso.') })
  } finally {
    saving.value = false
  }
}

async function createDemoCourse() {
  creatingDemo.value = true
  try {
    if (!categoryOptions.value.length) {
      await loadCategories()
    }
    const payload = {
      title: `Curso Demo ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      description: 'Curso de prueba para validar flujos del docente.',
      short_description: 'Demo editable para pruebas funcionales del rol docente.',
      price: 0,
      category_id: categoryOptions.value[0]?.value || null,
      level: 'beginner',
      language: 'es',
      status: 'draft',
      requirements: ['Acceso como docente', 'Entorno local disponible'],
      what_you_learn: ['Probar el CRUD', 'Preparar contenido base', 'Verificar permisos'],
      has_certificate: false,
      certificate_requires_final_exam: false,
      certificate_min_score: 70,
    }
    const { data } = await api.post('/courses', payload)
    await loadCourses()
    const createdCourse = courses.value.find((course) => course.id === data.id) || data
    $q.notify({ type: 'positive', message: `Se creó "${createdCourse.title}" como curso demo editable.` })
    openBuilder(createdCourse)
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo crear el curso demo.') })
  } finally {
    creatingDemo.value = false
  }
}

function confirmDelete(course) {
  selectedCourse.value = course
  deleteDialog.value = true
}

async function deleteCourse() {
  if (!selectedCourse.value) return
  deleting.value = true
  try {
    const title = selectedCourse.value.title
    await api.delete(`/courses/${selectedCourse.value.id}`)
    deleteDialog.value = false
    selectedCourse.value = null
    await loadCourses()
    $q.notify({ type: 'positive', message: `Curso "${title}" eliminado correctamente.` })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo eliminar el curso.') })
  } finally {
    deleting.value = false
  }
}

function previewCourse(course) {
  router.push({ name: 'teacher-course-preview', params: { slug: course.slug } })
}

function openBuilder(course) {
  router.push({
    name: 'teacher-course-builder',
    params: { courseId: course.id },
    query: { courseTitle: course.title },
  })
}

async function toggleCourseStatus(course) {
  const nextStatus = course.status === 'published'
    ? 'draft'
    : (course.status === 'pending' ? 'draft' : 'pending')

  try {
    await api.put(`/courses/${course.id}/status`, { status: nextStatus })
    await loadCourses()
    $q.notify({
      type: 'positive',
      message: nextStatus === 'pending'
        ? `Curso "${course.title}" enviado a revisión.`
        : `Curso "${course.title}" devuelto a borrador.`,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo actualizar el estado del curso.'),
    })
  }
}

function statusActionLabel(course) {
  if (course.status === 'published') return 'Pasar a borrador'
  if (course.status === 'pending') return 'Retirar de revisión'
  return 'Enviar a revisión'
}

function buildCourseFormData(payload, isUpdate = false) {
  const formData = new FormData()

  if (isUpdate) {
    formData.append('_method', 'PUT')
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'thumbnail_file') {
      if (value) {
        formData.append('thumbnail_file', value, value.name || 'thumbnail')
      }
      return
    }

    if (value === null || value === undefined || value === '') {
      if (key === 'thumbnail') {
        formData.append(key, '')
      }
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        formData.append(`${key}[${index}]`, entry)
      })
      return
    }

    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
      return
    }

    formData.append(key, value)
  })

  return formData
}

onMounted(async () => {
  try {
    await loadCategories()
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
  await loadCourses()
})

watch(courseDialog, (open) => {
  if (!open && !saving.value) {
    editingCourse.value = null
  }
})
</script>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
</style>
