<template>
  <q-page class="course-progress-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Progreso del curso</h2>
        <p class="q-mb-none">Seguimiento detallado de tu avance</p>
      </div>
      <q-btn
        flat
        no-caps
        icon="arrow_back"
        label="Volver al curso"
        :to="'/courses/' + course.slug"
      />
    </div>

    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <div v-else>
      <!-- Course Header -->
      <q-card class="glass-card q-pa-lg q-mb-lg">
        <div class="row items-center q-gutter-md">
          <q-avatar size="80px" rounded>
            <img
              :src="
                course.thumbnail ||
                'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
              "
            />
          </q-avatar>
          <div class="col">
            <h3 class="q-mb-xs">{{ course.title }}</h3>
            <div style="color: #8b8ba7">{{ course.description?.substring(0, 150) }}...</div>
          </div>
          <div class="text-right">
            <div class="text-h4" style="color: #6c5ce7">{{ overallProgress.percentage }}%</div>
            <div style="color: #8b8ba7">Progreso general</div>
          </div>
        </div>
      </q-card>

      <div class="row q-gutter-xl">
        <!-- Left Column: Modules & Lessons -->
        <div class="col-12 col-lg-8">
          <q-card class="glass-card q-pa-lg q-mb-lg">
            <h3 class="q-mb-md">Módulos y lecciones</h3>

            <div v-for="module in modules" :key="module.id" class="q-mb-lg">
              <div class="row items-center justify-between q-mb-md">
                <h4 class="q-mb-none">{{ module.title }}</h4>
                <div style="color: #8b8ba7">{{ module.progress }}% completado</div>
              </div>

              <q-linear-progress
                :value="module.progress / 100"
                color="primary"
                track-color="dark"
                rounded
                size="6px"
                class="q-mb-md"
              />

              <div class="q-gutter-y-sm">
                <div
                  v-for="lesson in module.lessons"
                  :key="lesson.id"
                  class="lesson-item q-pa-sm glass-card cursor-pointer"
                  @click="$router.push('/lessons/' + lesson.id)"
                >
                  <div class="row items-center q-gutter-md">
                    <q-avatar
                      :color="lesson.completed ? 'positive' : 'dark'"
                      text-color="white"
                      size="36px"
                    >
                      <q-icon :name="lesson.completed ? 'mdi-check' : 'mdi-play'" />
                    </q-avatar>
                    <div class="col">
                      <div class="text-weight-medium">{{ lesson.title }}</div>
                      <div style="color: #8b8ba7; font-size: 0.85rem">
                        {{ lesson.duration }} min •
                        {{ lesson.type === 'video' ? 'Video' : 'Texto' }}
                        <span v-if="lesson.has_game"> • 🎮 Juego</span>
                        <span v-if="lesson.has_quiz"> • 📝 Quiz</span>
                      </div>
                    </div>
                    <div style="color: #8b8ba7; font-size: 0.85rem">
                      {{ lesson.completed ? 'Completada' : 'Pendiente' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- Right Column: Stats -->
        <div class="col-12 col-lg-4">
          <!-- Overall Stats -->
          <q-card class="glass-card q-pa-lg q-mb-lg">
            <h3 class="q-mb-md">Estadísticas</h3>
            <div class="q-gutter-y-md">
              <div class="row items-center justify-between">
                <span style="color: #8b8ba7">Lecciones completadas</span>
                <span class="text-h6">{{ stats.completed_lessons }}/{{ stats.total_lessons }}</span>
              </div>
              <div class="row items-center justify-between">
                <span style="color: #8b8ba7">Tiempo invertido</span>
                <span class="text-h6">{{ stats.time_spent }} horas</span>
              </div>
              <div class="row items-center justify-between">
                <span style="color: #8b8ba7">Puntos obtenidos</span>
                <span class="text-h6">{{ stats.points_earned }}</span>
              </div>
              <div class="row items-center justify-between">
                <span style="color: #8b8ba7">Juegos completados</span>
                <span class="text-h6">{{ stats.games_completed }}</span>
              </div>
              <div class="row items-center justify-between">
                <span style="color: #8b8ba7">Quizzes completados</span>
                <span class="text-h6">{{ stats.quizzes_completed }}</span>
              </div>
            </div>
          </q-card>

          <!-- Certificate Eligibility -->
          <q-card v-if="overallProgress.percentage >= 100" class="glass-card q-pa-lg">
            <h3 class="q-mb-md">🎉 ¡Curso completado!</h3>
            <p style="color: #8b8ba7">Has completado todos los requisitos del curso.</p>
            <q-btn
              color="positive"
              icon="mdi-certificate"
              label="Obtener certificado"
              class="full-width"
              @click="generateCertificate"
            />
          </q-card>
          <q-card v-else class="glass-card q-pa-lg">
            <h3 class="q-mb-md">Certificado</h3>
            <p style="color: #8b8ba7">
              Completa el {{ 100 - overallProgress.percentage }}% restante para obtener tu
              certificado.
            </p>
            <q-linear-progress
              :value="overallProgress.percentage / 100"
              color="positive"
              track-color="dark"
              rounded
              size="8px"
            />
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'

const route = useRoute()
const loading = ref(true)
const course = ref({})
const modules = ref([])
const overallProgress = ref({})
const stats = ref({})

async function loadProgress() {
  const courseSlug = route.params.slug
  try {
    const [progressRes, courseRes] = await Promise.all([
      api.get(`/user/courses/${courseSlug}/progress`),
      api.get(`/courses/${courseSlug}`),
    ])

    overallProgress.value = progressRes.data.overall_progress || {}
    modules.value = progressRes.data.modules || []
    stats.value = progressRes.data.stats || {}
    course.value = courseRes.data
  } catch (error) {
    console.error('Error cargando progreso:', error)
  } finally {
    loading.value = false
  }
}

function generateCertificate() {
  // Implementar generación de certificado
  api
    .post(`/certificates/course/${course.value.id}/generate`)
    .then(() => {
      // Redirigir a certificados
      window.location.href = '/certificates'
    })
    .catch((err) => console.error(err))
}

onMounted(() => {
  loadProgress()
})
</script>

<style lang="scss" scoped>
.course-progress-page {
  .lesson-item {
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 20px rgba(108, 92, 231, 0.15);
    }
  }
}
</style>
