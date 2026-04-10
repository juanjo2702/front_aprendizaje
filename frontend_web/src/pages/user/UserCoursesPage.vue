<template>
  <q-page class="user-courses-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Mis cursos</h2>
        <p class="q-mb-none">Gestiona tu progreso y continúa aprendiendo</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
    </div>

    <!-- Filters -->
    <q-card class="glass-card q-pa-md q-mb-lg">
      <div class="row items-center q-gutter-md">
        <q-select
          v-model="filter.status"
          :options="statusOptions"
          label="Estado"
          outlined
          dense
          style="min-width: 150px"
        />
        <q-select
          v-model="filter.category"
          :options="categoryOptions"
          label="Categoría"
          outlined
          dense
          style="min-width: 150px"
        />
        <q-space />
        <q-btn flat no-caps label="Limpiar filtros" color="primary" @click="clearFilters" />
      </div>
    </q-card>

    <!-- Courses Grid -->
    <div v-if="loading" class="row q-gutter-lg">
      <div v-for="n in 6" :key="n" class="col-12 col-sm-6 col-md-4">
        <q-skeleton type="rect" height="200px" dark style="border-radius: 12px" />
      </div>
    </div>

    <div v-else-if="courses.length === 0" class="text-center q-py-xl">
      <q-icon name="mdi-school" size="96px" color="grey-7" />
      <h3 class="q-mt-md" style="color: #8b8ba7">No estás inscrito en ningún curso</h3>
      <p style="color: #8b8ba7">Explora nuestro catálogo y comienza tu aprendizaje.</p>
      <q-btn
        class="btn-gradient q-mt-md"
        no-caps
        label="Explorar cursos"
        icon="explore"
        to="/catalog"
      />
    </div>

    <div v-else class="row q-gutter-lg">
      <div
        v-for="enrollment in filteredCourses"
        :key="enrollment.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card
          class="course-card glass-card cursor-pointer"
          @click="$router.push('/courses/' + enrollment.course.slug)"
        >
          <q-img
            :src="
              enrollment.course.thumbnail ||
              'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            "
            height="120px"
          />

          <q-card-section>
            <div class="row items-center q-mb-sm">
              <h4 style="font-size: 1rem; line-height: 1.3" class="col">
                {{ enrollment.course.title }}
              </h4>
              <q-badge v-if="enrollment.progress >= 100" color="positive" label="Completado" />
              <q-badge v-else color="primary" :label="enrollment.progress + '%'" />
            </div>

            <div style="color: #8b8ba7; font-size: 0.85rem" class="q-mb-sm">
              {{ enrollment.course.instructor?.name }}
            </div>

            <q-linear-progress
              :value="enrollment.progress / 100"
              color="primary"
              track-color="dark"
              rounded
              size="8px"
            />

            <div class="row justify-between q-mt-sm" style="color: #8b8ba7; font-size: 0.8rem">
              <span>Progreso</span>
              <span>{{ enrollment.progress }}%</span>
            </div>
          </q-card-section>

          <q-card-actions>
            <q-btn
              flat
              no-caps
              label="Continuar"
              icon="play_arrow"
              color="primary"
              @click.stop="continueCourse(enrollment)"
            />
            <q-space />
            <q-btn flat round icon="more_vert" dense>
              <q-menu>
                <q-list>
                  <q-item clickable @click="viewProgress(enrollment)">
                    <q-item-section avatar><q-icon name="mdi-chart-line" /></q-item-section>
                    <q-item-section>Ver progreso</q-item-section>
                  </q-item>
                  <q-item
                    v-if="enrollment.progress >= 100"
                    clickable
                    @click="viewCertificate(enrollment)"
                  >
                    <q-item-section avatar><q-icon name="mdi-certificate" /></q-item-section>
                    <q-item-section>Ver certificado</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const courses = ref([])
const categories = ref([])

const filter = reactive({
  status: 'all',
  category: 'all',
})

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completados', value: 'completed' },
  { label: 'No iniciados', value: 'not_started' },
]

const categoryOptions = computed(() => [
  { label: 'Todas', value: 'all' },
  ...categories.value.map((cat) => ({ label: cat.name, value: cat.id })),
])

const filteredCourses = computed(() => {
  let filtered = courses.value

  if (filter.status !== 'all') {
    filtered = filtered.filter((enrollment) => {
      if (filter.status === 'in_progress')
        return enrollment.progress > 0 && enrollment.progress < 100
      if (filter.status === 'completed') return enrollment.progress >= 100
      if (filter.status === 'not_started') return enrollment.progress === 0
      return true
    })
  }

  if (filter.category !== 'all') {
    filtered = filtered.filter((enrollment) => enrollment.course.category_id == filter.category)
  }

  return filtered
})

async function loadCourses() {
  try {
    const [coursesRes, categoriesRes] = await Promise.all([
      api.get('/user/courses'),
      api.get('/categories'),
    ])

    courses.value = coursesRes.data.data || coursesRes.data
    categories.value = categoriesRes.data.data || categoriesRes.data
  } catch (error) {
    console.error('Error cargando cursos:', error)
  } finally {
    loading.value = false
  }
}

function continueCourse(enrollment) {
  // Navegar a la última lección o primera lección
  // Por ahora navega al detalle del curso
  window.location.href = `/courses/${enrollment.course.slug}`
}

function viewProgress(enrollment) {
  // Navegar a página de progreso detallado
  window.location.href = `/courses/${enrollment.course.slug}/progress`
}

function viewCertificate(enrollment) {
  // Navegar a certificado si existe
  window.location.href = `/certificates?course=${enrollment.course.id}`
}

function clearFilters() {
  filter.status = 'all'
  filter.category = 'all'
}

onMounted(() => {
  loadCourses()
})
</script>

<style lang="scss" scoped>
.user-courses-page {
  .course-card {
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(108, 92, 231, 0.2);
    }
  }
}
</style>
