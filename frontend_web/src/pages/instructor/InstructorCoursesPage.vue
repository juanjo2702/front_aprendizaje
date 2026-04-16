<template>
  <q-page class="q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Panel docente</h2>
        <p class="q-mb-none">Administra tus cursos y revisa métricas de contenido.</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
    </div>

    <q-banner v-if="!canAccess" class="bg-negative text-white q-mb-lg" rounded>
      Esta vista está disponible solo para cuentas docente o admin.
    </q-banner>

    <div v-else-if="loading" class="q-py-md">
      <q-skeleton v-for="item in 4" :key="item" type="rect" height="110px" class="q-mb-md" dark />
    </div>

    <div v-else>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Cursos totales</div>
            <div class="text-h4 text-weight-bold text-gradient">{{ summary.total }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Cursos publicados</div>
            <div class="text-h4 text-weight-bold text-positive">{{ summary.published }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Estudiantes totales</div>
            <div class="text-h4 text-weight-bold" style="color: #00d2d3">
              {{ summary.students }}
            </div>
          </q-card>
        </div>
      </div>

      <div v-if="courses.length === 0" class="text-center q-py-xl">
        <q-icon name="school" size="72px" color="grey-7" />
        <h4 class="q-mt-md" style="color: #8b8ba7">Aún no tienes cursos creados</h4>
        <p style="color: #8b8ba7">Crea tu primer curso para comenzar a publicar contenido.</p>
      </div>

      <div v-else class="column q-gutter-md">
        <q-card v-for="course in courses" :key="course.id" class="glass-card q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-xs">{{ course.title }}</div>
              <div class="row items-center q-gutter-sm">
                <q-badge :color="statusColor(course.status)" :label="statusLabel(course.status)" />
                <q-badge outline color="primary">{{ levelLabel(course.level) }}</q-badge>
              </div>
              <div class="text-caption text-grey-5 q-mt-sm">
                {{ course.category?.name || 'Sin categoría' }} · {{ course.language?.toUpperCase() || 'ES' }}
              </div>
            </div>

            <div class="col-12 col-md-3">
              <div class="text-caption text-grey-5">Estudiantes</div>
              <div class="text-subtitle1 text-weight-bold">{{ course.total_students || 0 }}</div>
              <div class="text-caption text-grey-5">Módulos: {{ course.modules_count || 0 }}</div>
              <div class="text-caption text-grey-5">Lecciones: {{ course.lessons_count || 0 }}</div>
            </div>

            <div class="col-12 col-md-3 row justify-end q-gutter-sm">
              <q-btn
                flat
                no-caps
                color="primary"
                icon="visibility"
                label="Ver curso"
                @click="$router.push(`/courses/${course.slug}`)"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'

const auth = useAuthStore()
const loading = ref(true)
const courses = ref([])

const canAccess = computed(() => auth.isInstructor || auth.isAdmin)

const summary = computed(() => {
  const total = courses.value.length
  const published = courses.value.filter((course) => course.status === 'published').length
  const students = courses.value.reduce((sum, course) => sum + Number(course.total_students || 0), 0)

  return { total, published, students }
})

function statusLabel(status) {
  const labels = {
    draft: 'Borrador',
    pending: 'Pendiente',
    published: 'Publicado',
    archived: 'Archivado',
  }
  return labels[status] || status
}

function statusColor(status) {
  const colors = {
    draft: 'grey',
    pending: 'warning',
    published: 'positive',
    archived: 'negative',
  }
  return colors[status] || 'primary'
}

function levelLabel(level) {
  const labels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    all_levels: 'Todos los niveles',
  }
  return labels[level] || level
}

onMounted(async () => {
  if (!canAccess.value) {
    loading.value = false
    return
  }

  try {
    const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
    courses.value = data?.data || []
  } catch (error) {
    console.error('Error cargando cursos del instructor:', error)
  } finally {
    loading.value = false
  }
})
</script>
