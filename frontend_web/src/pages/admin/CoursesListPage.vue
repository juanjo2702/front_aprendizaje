<template>
  <q-page class="q-pa-lg">
    <!-- Header y acciones -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Gestión de Cursos</div>
        <div class="text-subtitle1 text-grey-7">
          Administra todos los cursos de la plataforma
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add_circle"
          label="Nuevo curso"
          :to="{ name: 'admin-courses-create' }"
        />
        <q-btn
          outline
          color="primary"
          icon="filter_list"
          label="Filtros"
          class="q-ml-sm"
          @click="showFilters = !showFilters"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-slide-transition>
      <div v-show="showFilters" class="q-mb-lg">
        <q-card class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model="filters.search"
                label="Buscar cursos"
                outlined
                dense
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.status"
                :options="statusOptions"
                label="Estado"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.category"
                :options="categoryOptions"
                label="Categoría"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <div class="row q-col-gutter-xs">
                <div class="col">
                  <q-btn
                    color="primary"
                    label="Aplicar"
                    @click="applyFilters"
                    class="full-width"
                  />
                </div>
                <div class="col">
                  <q-btn
                    outline
                    label="Limpiar"
                    @click="clearFilters"
                    class="full-width"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </q-slide-transition>

    <!-- Tabla de cursos -->
    <q-card>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="courses"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          @request="onRequest"
          flat
          bordered
        >
          <!-- Imagen del curso -->
          <template #body-cell-image="props">
            <q-td :props="props">
              <q-avatar size="60px" square v-if="props.row.image_url">
                <img :src="props.row.image_url" />
              </q-avatar>
              <q-avatar size="60px" square color="primary" text-color="white" v-else>
                <q-icon name="school" size="28px" />
              </q-avatar>
            </q-td>
          </template>

          <!-- Título y descripción -->
          <template #body-cell-title="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.title }}</div>
              <div class="text-caption text-grey-7 line-clamp-2">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <!-- Instructor -->
          <template #body-cell-instructor="props">
            <q-td :props="props">
              <div v-if="props.row.instructor">
                <div class="text-weight-medium">{{ props.row.instructor.name }}</div>
                <div class="text-caption text-grey-7">{{ props.row.instructor.email }}</div>
              </div>
              <div v-else class="text-grey-7">-</div>
            </q-td>
          </template>

          <!-- Estado -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_published ? 'positive' : 'warning'" rounded>
                {{ props.row.is_published ? 'Publicado' : 'Borrador' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Precio -->
          <template #body-cell-price="props">
            <q-td :props="props">
              <div v-if="props.row.price > 0" class="text-weight-medium">
                {{ formatCurrency(props.row.price) }}
              </div>
              <q-badge v-else color="info" rounded>Gratis</q-badge>
            </q-td>
          </template>

          <!-- Inscripciones -->
          <template #body-cell-enrollments="props">
            <q-td :props="props">
              <q-badge color="primary" rounded>
                {{ props.row.enrollments_count || 0 }}
              </q-badge>
            </q-td>
          </template>

          <!-- Acciones -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="visibility"
                size="sm"
                @click="viewCourse(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="edit"
                size="sm"
                class="q-ml-xs"
                @click="editCourse(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                size="sm"
                color="negative"
                class="q-ml-xs"
                @click="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de confirmación de eliminación -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Eliminar curso</div>
          <div class="text-subtitle2 q-mt-sm">
            ¿Estás seguro de eliminar el curso <strong>{{ selectedCourse?.title }}</strong>?
            Esta acción no se puede deshacer y afectará a todos los usuarios inscritos.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="deleteCourse" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()

const loading = ref(false)
const showFilters = ref(false)
const deleteDialog = ref(false)
const selectedCourse = ref(null)

const courses = ref([])
const filters = ref({
  search: '',
  status: '',
  category: ''
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const statusOptions = [
  { label: 'Publicados', value: 'published' },
  { label: 'Borradores', value: 'draft' }
]

const categoryOptions = ref([])

const columns = [
  { name: 'image', label: '', field: 'image_url', align: 'center', style: 'width: 70px' },
  { name: 'title', label: 'Curso', field: 'title', align: 'left', sortable: true },
  { name: 'instructor', label: 'Instructor', field: row => row.instructor?.name, align: 'left' },
  { name: 'status', label: 'Estado', field: 'is_published', align: 'center' },
  { name: 'price', label: 'Precio', field: 'price', align: 'center', sortable: true },
  { name: 'enrollments', label: 'Inscripciones', field: 'enrollments_count', align: 'center', sortable: true },
  { name: 'rating', label: 'Rating', field: 'average_rating', align: 'center', sortable: true, format: (val) => val ? val.toFixed(1) : '-' },
  { name: 'created_at', label: 'Creado', field: 'created_at', align: 'center', sortable: true, format: (val) => formatDate(val) },
  { name: 'actions', label: 'Acciones', align: 'center', style: 'width: 120px' }
]

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

async function loadCourses() {
  try {
    loading.value = true
    
    // TODO: Implementar endpoint real para listar cursos admin
    // Por ahora usamos datos mock
    courses.value = [
      { id: 1, title: 'Introducción a JavaScript', description: 'Aprende JavaScript desde cero', instructor: { id: 2, name: 'María López', email: 'maria@example.com' }, image_url: null, is_published: true, price: 49.99, enrollments_count: 245, average_rating: 4.8, created_at: '2024-01-15' },
      { id: 2, title: 'Diseño UI/UX', description: 'Principios de diseño de interfaces', instructor: { id: 3, name: 'Carlos Ruiz', email: 'carlos@example.com' }, image_url: null, is_published: true, price: 59.99, enrollments_count: 189, average_rating: 4.7, created_at: '2024-02-10' },
      { id: 3, title: 'React Avanzado', description: 'Patrones avanzados de React', instructor: { id: 4, name: 'Ana García', email: 'ana@example.com' }, image_url: null, is_published: true, price: 79.99, enrollments_count: 156, average_rating: 4.9, created_at: '2024-02-25' },
      { id: 4, title: 'Node.js Backend', description: 'Construye APIs con Node.js', instructor: { id: 5, name: 'Pedro Martínez', email: 'pedro@example.com' }, image_url: null, is_published: false, price: 69.99, enrollments_count: 0, average_rating: null, created_at: '2024-03-05' },
      { id: 5, title: 'Base de Datos SQL', description: 'Dominia SQL y diseño de bases de datos', instructor: { id: 2, name: 'María López', email: 'maria@example.com' }, image_url: null, is_published: true, price: 49.99, enrollments_count: 98, average_rating: 4.5, created_at: '2024-03-12' },
      { id: 6, title: 'Python para Ciencia de Datos', description: 'Análisis de datos con Python', instructor: { id: 3, name: 'Carlos Ruiz', email: 'carlos@example.com' }, image_url: null, is_published: true, price: 89.99, enrollments_count: 123, average_rating: 4.6, created_at: '2024-03-18' },
      { id: 7, title: 'Flutter Desarrollo Móvil', description: 'Crea apps móviles con Flutter', instructor: { id: 4, name: 'Ana García', email: 'ana@example.com' }, image_url: null, is_published: false, price: 74.99, enrollments_count: 0, average_rating: null, created_at: '2024-03-20' },
      { id: 8, title: 'DevOps Fundamentals', description: 'Introducción a prácticas DevOps', instructor: { id: 5, name: 'Pedro Martínez', email: 'pedro@example.com' }, image_url: null, is_published: true, price: 99.99, enrollments_count: 67, average_rating: 4.7, created_at: '2024-03-22' }
    ]
    
    pagination.value.rowsNumber = courses.value.length
    
    // Cargar categorías para filtros
    try {
      const categoriesRes = await api.get('/categories')
      categoryOptions.value = categoriesRes.data.map(cat => ({
        label: cat.name,
        value: cat.id
      }))
    } catch (error) {
      console.log('No se pudieron cargar categorías:', error.message)
    }
    
    // Intento cargar datos reales
    // try {
    //   const response = await api.get('/admin/courses', { params: { ...filters.value, ...pagination.value } })
    //   courses.value = response.data.data
    //   pagination.value = response.data.meta
    // } catch (error) {
    //   console.log('Usando datos mock para cursos:', error.message)
    // }
  } catch (error) {
    console.error('Error cargando cursos:', error)
    $q.notify({
      type: 'negative',
      message: 'Error cargando la lista de cursos'
    })
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pagination.value.page = 1
  loadCourses()
}

function clearFilters() {
  filters.value = {
    search: '',
    status: '',
    category: ''
  }
  applyFilters()
}

function onRequest(props) {
  const { page, rowsPerPage } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  loadCourses()
}

function viewCourse(course) {
  $q.notify({
    message: `Ver curso: ${course.title}`,
    color: 'info'
  })
  // Redirigir a detalle del curso
  // router.push(`/admin/courses/${course.id}`)
}

function editCourse(course) {
  $q.notify({
    message: `Editar curso: ${course.title}`,
    color: 'warning'
  })
  // Redirigir a edición
  // router.push(`/admin/courses/${course.id}/edit`)
}

function confirmDelete(course) {
  selectedCourse.value = course
  deleteDialog.value = true
}

async function deleteCourse() {
  if (!selectedCourse.value) return
  
  try {
    // TODO: Implementar eliminación real
    // await api.delete(`/admin/courses/${selectedCourse.value.id}`)
    
    $q.notify({
      type: 'positive',
      message: `Curso "${selectedCourse.value.title}" eliminado correctamente`
    })
    
    // Recargar lista
    loadCourses()
  } catch (error) {
    console.error('Error eliminando curso:', error)
    $q.notify({
      type: 'negative',
      message: 'Error eliminando el curso'
    })
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style lang="scss" scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>