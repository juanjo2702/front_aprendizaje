<template>
  <q-page class="student-page">
    <div class="section-head">
      <div>
        <div class="text-h4 text-weight-bold">Marketplace</div>
        <div class="text-caption text-grey-5">Explora cursos con filtros de nivel, precio y gamificacion.</div>
      </div>
      <q-badge outline color="secondary">{{ marketplace.pagination.total }} resultados</q-badge>
    </div>

    <q-card flat bordered class="filter-card">
      <div class="filter-grid">
        <q-input v-model="filters.search" outlined dense label="Buscar cursos" debounce="350" />
        <q-select v-model="filters.category" outlined dense emit-value map-options label="Categoria" :options="categoryOptions" />
        <q-select v-model="filters.level" outlined dense emit-value map-options label="Nivel" :options="levelOptions" />
        <q-select v-model="filters.price" outlined dense emit-value map-options label="Precio" :options="priceOptions" />
        <q-select v-model="filters.gamification" outlined dense emit-value map-options label="Gamificacion" :options="gamificationOptions" />
        <q-select v-model="filters.sort" outlined dense emit-value map-options label="Ordenar" :options="sortOptions" />
      </div>
    </q-card>

    <div v-if="marketplaceLoading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-xl-4">
        <q-skeleton dark type="rect" height="260px" />
      </div>
    </div>

    <div v-else class="course-grid">
      <CourseMarketplaceCard
        v-for="course in marketplace.courses"
        :key="course.id"
        :course="course"
        @open="openCourse(course.slug)"
      />
    </div>

    <div class="row justify-center">
      <q-pagination
        v-if="marketplace.pagination.lastPage > 1"
        v-model="currentPage"
        color="secondary"
        :max="marketplace.pagination.lastPage"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudentStore } from 'src/stores/student'
import CourseMarketplaceCard from 'src/components/course/CourseMarketplaceCard.vue'

const router = useRouter()
const studentStore = useStudentStore()
const { marketplace, marketplaceLoading } = storeToRefs(studentStore)

const filters = reactive({
  search: '',
  category: null,
  level: null,
  price: null,
  gamification: null,
  sort: 'newest',
})

const currentPage = computed({
  get: () => marketplace.value.pagination.page,
  set: (value) => studentStore.loadMarketplace({ ...filters, page: value }),
})

const categoryOptions = computed(() => [
  { label: 'Todas', value: null },
  ...marketplace.value.categories.map((category) => ({ label: category.name, value: category.slug })),
])

const levelOptions = [
  { label: 'Todos', value: null },
  { label: 'Principiante', value: 'beginner' },
  { label: 'Intermedio', value: 'intermediate' },
  { label: 'Avanzado', value: 'advanced' },
  { label: 'Todos los niveles', value: 'all_levels' },
]

const priceOptions = [
  { label: 'Todos', value: null },
  { label: 'Gratis', value: 'free' },
  { label: 'De pago', value: 'paid' },
]

const gamificationOptions = [
  { label: 'Todos', value: null },
  { label: 'Con gamificacion', value: true },
  { label: 'Sin gamificacion', value: false },
]

const sortOptions = [
  { label: 'Mas recientes', value: 'newest' },
  { label: 'Mas populares', value: 'popular' },
  { label: 'Precio ascendente', value: 'price_low' },
  { label: 'Precio descendente', value: 'price_high' },
]

onMounted(() => {
  studentStore.loadMarketplace(filters)
})

watch(
  () => ({ ...filters }),
  (value) => {
    studentStore.loadMarketplace({ ...value, page: 1 })
  },
  { deep: true },
)

function openCourse(slug) {
  router.push({ name: 'student-course-detail', params: { slug } })
}
</script>

<style scoped>
.student-page {
  padding: 28px;
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
  .filter-grid,
  .course-grid {
    grid-template-columns: 1fr;
  }
}
</style>
