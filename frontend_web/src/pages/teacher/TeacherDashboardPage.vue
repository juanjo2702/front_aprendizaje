<template>
  <q-page class="q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Panel de Instructor</h2>
        <p class="q-mb-none">Resumen de ventas, estudiantes y rendimiento de tus cursos.</p>
      </div>
      <q-btn flat no-caps icon="school" label="Gestor de cursos" to="/teacher/courses" />
    </div>

    <div v-if="loading" class="q-py-md">
      <q-skeleton v-for="n in 4" :key="n" type="rect" height="90px" class="q-mb-md" dark />
    </div>

    <div v-else>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Cursos propios</div>
            <div class="text-h4 text-weight-bold text-gradient">{{ metrics.totalCourses }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Estudiantes totales</div>
            <div class="text-h4 text-weight-bold" style="color: #00d2d3">{{ metrics.totalStudents }}</div>
          </q-card>
        </div>
        <div class="col-12 col-sm-4">
          <q-card class="glass-card q-pa-md">
            <div class="text-caption text-grey-5">Ventas estimadas</div>
            <div class="text-h4 text-weight-bold text-positive">${{ metrics.estimatedSales }}</div>
          </q-card>
        </div>
      </div>

      <q-banner class="glass-card">
        <div class="text-subtitle1 text-weight-medium">Valoración promedio</div>
        <div class="text-caption">Pendiente de integración de módulo de reseñas. Hoy se muestra solo resumen comercial.</div>
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const courses = ref([])

const metrics = computed(() => {
  const totalCourses = courses.value.length
  const totalStudents = courses.value.reduce((sum, course) => sum + Number(course.total_students || 0), 0)
  const estimatedSales = courses.value
    .reduce((sum, course) => sum + (Number(course.price || 0) * Number(course.total_students || 0)), 0)
    .toFixed(2)

  return { totalCourses, totalStudents, estimatedSales }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
    courses.value = data?.data || []
  } catch (error) {
    console.error('Error cargando panel instructor:', error)
  } finally {
    loading.value = false
  }
})
</script>

