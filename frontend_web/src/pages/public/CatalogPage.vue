<template>
  <q-page class="catalog-page">
    <div class="section-head animate-fade-in-up">
      <div>
        <div class="text-h4 text-weight-bold">Explorar cursos</div>
        <div class="text-caption text-grey-5">Encuentra el curso perfecto para ti.</div>
      </div>
      <q-badge outline color="secondary">{{ totalResults }} resultados</q-badge>
    </div>

    <q-card flat bordered class="filter-card animate-fade-in-up animate-delay-1">
      <div class="filter-grid">
        <q-input
          v-model="filters.search"
          outlined
          dense
          label="Buscar cursos"
          debounce="350"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select
          v-model="filters.category"
          outlined
          dense
          emit-value
          map-options
          :options="categoryOptions"
          label="Categoría"
          clearable
        />

        <q-select
          v-model="filters.level"
          outlined
          dense
          emit-value
          map-options
          :options="levelOptions"
          label="Nivel"
          clearable
        />

        <q-select
          v-model="filters.price"
          outlined
          dense
          emit-value
          map-options
          :options="priceOptions"
          label="Precio"
          clearable
        />

        <q-select
          v-model="filters.gamification"
          outlined
          dense
          emit-value
          map-options
          :options="gamificationOptions"
          label="Gamificación"
          clearable
        />

        <q-select
          v-model="filters.sort"
          outlined
          dense
          emit-value
          map-options
          :options="sortOptions"
          label="Ordenar"
        />
      </div>
    </q-card>

    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-xl-4">
        <q-skeleton dark type="rect" height="260px" />
      </div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center q-py-xl">
      <q-icon name="search_off" size="64px" color="grey-7" />
      <h4 class="q-mt-md" style="color: #8b8ba7">No se encontraron cursos</h4>
      <p>Intenta cambiar tus filtros de búsqueda</p>
    </div>

    <div v-else>
      <div class="course-grid">
        <CourseMarketplaceCard
          v-for="(course, i) in courses"
          :key="course.id"
          :course="course"
          class="animate-fade-in-up"
          :class="'animate-delay-' + ((i % 4) + 1)"
          @open="openCourse"
        />
      </div>

      <div v-if="totalPages > 1" class="flex flex-center q-mt-xl">
        <q-pagination
          v-model="page"
          :max="totalPages"
          direction-links
          boundary-links
          color="primary"
          active-design="unelevated"
          active-color="primary"
          @update:model-value="loadCourses"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/services/api'
import CourseMarketplaceCard from 'src/components/course/CourseMarketplaceCard.vue'

const route = useRoute()
const router = useRouter()
const courses = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

const filters = reactive({
  search: route.query.search || '',
  category: route.query.category || null,
  level: null,
  price: null,
  gamification: null,
  sort: 'newest',
})

const totalResults = computed(() => totalItems.value || courses.value.length)

const levelOptions = [
  { label: 'Todos', value: null },
  { label: 'Principiante', value: 'beginner' },
  { label: 'Intermedio', value: 'intermediate' },
  { label: 'Avanzado', value: 'advanced' },
  { label: 'Todos los niveles', value: 'all_levels' },
]

const sortOptions = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más populares', value: 'popular' },
  { label: 'Precio: menor', value: 'price_low' },
  { label: 'Precio: mayor', value: 'price_high' },
]

const priceOptions = [
  { label: 'Todos', value: null },
  { label: 'Gratis', value: 'free' },
  { label: 'De pago', value: 'paid' },
]

const gamificationOptions = [
  { label: 'Todos', value: null },
  { label: 'Con gamificación', value: true },
  { label: 'Sin gamificación', value: false },
]

const categoryOptions = ref([])

async function loadCourses() {
  loading.value = true

  try {
    const params = { page: page.value, per_page: 12 }

    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.level) params.level = filters.level
    if (filters.price) params.price = filters.price
    if (filters.gamification !== null) params.gamification = filters.gamification
    if (filters.sort) params.sort = filters.sort

    const { data } = await api.get('/courses', { params })
    courses.value = data.data
    totalPages.value = data.last_page
    totalItems.value = data.total || data.data?.length || 0
  } catch (e) {
    console.error('Error loading courses:', e)
  } finally {
    loading.value = false
  }
}

function openCourse(course) {
  if (!course?.slug) return

  if (route.path.startsWith('/teacher/marketplace')) {
    router.push({ name: 'teacher-marketplace-course', params: { slug: course.slug } })
    return
  }

  router.push({ name: 'public-course-detail', params: { slug: course.slug } })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/categories')
    categoryOptions.value = [
      { label: 'Todas', value: null },
      ...data.map((category) => ({ label: category.name, value: category.slug })),
    ]
  } catch {
    categoryOptions.value = [{ label: 'Todas', value: null }]
  }

  loadCourses()
})

watch(
  () => ({ ...filters }),
  () => {
    page.value = 1
    loadCourses()
  },
  { deep: true },
)
</script>

<style lang="scss" scoped>
.catalog-page {
  padding: 28px;
  max-width: 1560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.filter-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 20px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1280px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-grid,
  .course-grid {
    grid-template-columns: 1fr;
  }
}
</style>
