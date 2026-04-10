<template>
  <q-page class="catalog-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Header -->
    <div class="q-mb-xl animate-fade-in-up">
      <h2 class="q-mb-xs">Explorar cursos</h2>
      <p>Encuentra el curso perfecto para ti</p>
    </div>

    <!-- Filters -->
    <div class="row q-gutter-md q-mb-xl animate-fade-in-up animate-delay-1">
      <q-input
        v-model="filters.search"
        dense
        outlined
        dark
        placeholder="Buscar..."
        class="col-12 col-sm-4"
        @keyup.enter="loadCourses"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-select
        v-model="filters.category"
        dense
        outlined
        dark
        emit-value
        map-options
        :options="categoryOptions"
        label="Categoría"
        class="col-12 col-sm-3"
        clearable
        @update:model-value="loadCourses"
      />

      <q-select
        v-model="filters.level"
        dense
        outlined
        dark
        emit-value
        map-options
        :options="levelOptions"
        label="Nivel"
        class="col-12 col-sm-2"
        clearable
        @update:model-value="loadCourses"
      />

      <q-select
        v-model="filters.sort"
        dense
        outlined
        dark
        emit-value
        map-options
        :options="sortOptions"
        label="Ordenar"
        class="col-12 col-sm-2"
        @update:model-value="loadCourses"
      />
    </div>

    <!-- Results -->
    <div v-if="loading" class="row q-gutter-lg">
      <div v-for="n in 6" :key="n" class="col-12 col-sm-6 col-md-4">
        <q-skeleton type="rect" height="180px" dark style="border-radius: 12px" />
        <q-skeleton type="text" dark class="q-mt-sm" />
        <q-skeleton type="text" width="70%" dark />
      </div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center q-py-xl">
      <q-icon name="search_off" size="64px" color="grey-7" />
      <h4 class="q-mt-md" style="color: #8b8ba7">No se encontraron cursos</h4>
      <p>Intenta cambiar tus filtros de búsqueda</p>
    </div>

    <div v-else>
      <div class="row q-gutter-lg">
        <div
          v-for="(course, i) in courses"
          :key="course.id"
          class="col-12 col-sm-6 col-md-4 animate-fade-in-up"
          :class="'animate-delay-' + ((i % 4) + 1)"
        >
          <q-card
            class="course-card glass-card cursor-pointer"
            @click="$router.push('/courses/' + course.slug)"
          >
            <div class="course-thumb">
              <div class="course-thumb-placeholder">
                <q-icon name="play_circle_outline" size="48px" color="white" />
              </div>
            </div>
            <q-card-section>
              <div class="row items-center q-mb-sm">
                <q-avatar size="24px" color="primary" text-color="white" class="q-mr-sm">
                  <span style="font-size: 10px">{{ course.instructor?.name?.[0] }}</span>
                </q-avatar>
                <span style="color: #8b8ba7; font-size: 0.8rem">{{ course.instructor?.name }}</span>
                <q-space />
                <span class="badge-premium badge-primary" style="font-size: 0.7rem">{{
                  course.category?.name
                }}</span>
              </div>
              <h4 style="font-size: 1rem; line-height: 1.4" class="q-mb-sm">{{ course.title }}</h4>
              <p class="ellipsis-2-lines" style="font-size: 0.85rem">
                {{ course.short_description }}
              </p>
              <div class="row items-center justify-between q-mt-md">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="people" color="grey-6" size="16px" />
                  <span style="color: #8b8ba7; font-size: 0.8rem">{{ course.total_students }}</span>
                </div>
                <div class="text-h6 text-weight-bold" style="color: #00d2d3">
                  ${{ course.price }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Pagination -->
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'

const route = useRoute()
const courses = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const categories = ref([])

const filters = reactive({
  search: route.query.search || '',
  category: route.query.category || null,
  level: null,
  sort: 'newest',
})

const levelOptions = [
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

const categoryOptions = ref([])

async function loadCourses() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: 12 }
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.level) params.level = filters.level
    if (filters.sort) params.sort = filters.sort

    const { data } = await api.get('/courses', { params })
    courses.value = data.data
    totalPages.value = data.last_page
  } catch (e) {
    console.error('Error loading courses:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/categories')
    categories.value = data
    categoryOptions.value = data.map((c) => ({ label: c.name, value: c.slug }))
  } catch (e) {
    /* ignore */
  }
  loadCourses()
})
</script>

<style lang="scss" scoped>
.course-card {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(108, 92, 231, 0.15);
  }
}
.course-thumb {
  height: 180px;
  overflow: hidden;
}
.course-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a3e 0%, #232350 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
