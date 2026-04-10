<template>
  <q-page class="badge-detail-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Back button -->
    <q-btn flat icon="arrow_back" label="Volver a badges" to="/badges/my" class="q-mb-lg" />

    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-md">Cargando badge...</div>
    </div>

    <div v-else-if="!badge" class="text-center q-py-xl">
      <q-icon name="mdi-alert-circle" size="4em" color="warning" />
      <div class="text-h6 q-mt-md">Badge no encontrado</div>
      <p class="q-mt-sm">El badge que buscas no existe o no tienes acceso.</p>
      <q-btn label="Ver todos los badges" to="/badges/my" color="primary" class="q-mt-md" />
    </div>

    <div v-else>
      <!-- Badge header -->
      <div class="row items-center q-mb-xl">
        <div class="col-auto">
          <div class="badge-icon-large" :style="{ backgroundColor: badge.color || '#7B61FF' }">
            <q-icon :name="badge.icon || 'mdi-trophy'" size="3em" color="white" />
          </div>
        </div>
        <div class="col q-pl-xl">
          <div class="text-h4 q-mb-xs">{{ badge.name }}</div>
          <div class="text-h6 text-grey-7 q-mb-md">{{ badge.description }}</div>
          <div class="row items-center q-gutter-lg">
            <div class="row items-center">
              <q-icon name="mdi-star" color="amber" size="1.5em" />
              <div class="q-pl-sm">{{ badge.points || 0 }} puntos</div>
            </div>
            <div class="row items-center">
              <q-icon name="mdi-account-group" color="primary" size="1.5em" />
              <div class="q-pl-sm">{{ badge.earned_count || 0 }} usuarios lo tienen</div>
            </div>
            <div v-if="badge.earned" class="row items-center">
              <q-icon name="mdi-check-circle" color="positive" size="1.5em" />
              <div class="q-pl-sm">¡Obtenido el {{ formatDate(badge.earned_at) }}!</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress and details -->
      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-8">
          <!-- Progress section -->
          <q-card class="q-pa-lg q-mb-lg">
            <div class="text-h6 q-mb-md">Tu progreso</div>
            <q-linear-progress
              :value="badge.progress / 100"
              :color="badge.earned ? 'positive' : 'primary'"
              size="20px"
              class="q-mb-md"
            />
            <div class="row justify-between">
              <div class="text-h5">
                {{ badge.earned ? '¡Completado!' : `${badge.progress}% completado` }}
              </div>
              <div class="text-h5">
                {{ badge.current_value || 0 }} / {{ badge.required_value || 100 }}
              </div>
            </div>
            <div class="q-mt-lg">
              <div class="text-subtitle1 q-mb-sm">Requisitos:</div>
              <p>
                {{
                  badge.requirements ||
                  'Completa las actividades relacionadas para obtener este badge.'
                }}
              </p>
            </div>
          </q-card>

          <!-- How to earn -->
          <q-card class="q-pa-lg">
            <div class="text-h6 q-mb-md">¿Cómo obtener este badge?</div>
            <div class="q-gutter-y-md">
              <div v-for="(step, index) in badge.steps" :key="index" class="row items-start">
                <div class="col-auto">
                  <q-icon
                    name="mdi-check-circle"
                    :color="step.completed ? 'positive' : 'grey-4'"
                    size="1.5em"
                    class="q-pt-xs"
                  />
                </div>
                <div class="col q-pl-md">
                  <div class="text-subtitle1">{{ step.title }}</div>
                  <div class="text-caption text-grey-7">{{ step.description }}</div>
                  <div v-if="step.progress !== undefined" class="q-mt-xs">
                    <q-linear-progress :value="step.progress / 100" size="8px" />
                    <div class="text-caption text-right">{{ step.progress }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <!-- Badge info -->
          <q-card class="q-pa-lg q-mb-lg">
            <div class="text-h6 q-mb-md">Información del badge</div>
            <div class="q-gutter-y-md">
              <div>
                <div class="text-caption text-grey-7">Categoría</div>
                <div class="text-subtitle1">{{ badge.category || 'General' }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-7">Dificultad</div>
                <div class="text-subtitle1">
                  <q-badge :color="getDifficultyColor(badge.difficulty)">
                    {{ badge.difficulty || 'Media' }}
                  </q-badge>
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-7">Tipo</div>
                <div class="text-subtitle1">{{ badge.type || 'Logro' }}</div>
              </div>
              <div>
                <div class="text-caption text-grey-7">Fecha de creación</div>
                <div class="text-subtitle1">{{ formatDate(badge.created_at) }}</div>
              </div>
            </div>
          </q-card>

          <!-- Actions -->
          <q-card class="q-pa-lg">
            <div class="text-h6 q-mb-md">Acciones</div>
            <div class="q-gutter-y-sm">
              <q-btn
                v-if="!badge.earned"
                color="primary"
                icon="mdi-rocket"
                label="Continuar progreso"
                class="full-width"
                @click="continueProgress"
              />
              <q-btn
                color="secondary"
                icon="mdi-share"
                label="Compartir badge"
                class="full-width"
              />
              <q-btn
                flat
                color="grey"
                icon="mdi-information"
                label="Ver reglas completas"
                class="full-width"
              />
            </div>
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
const badge = ref(null)

async function fetchBadgeDetail() {
  try {
    loading.value = true
    const badgeId = route.params.id
    const { data } = await api.get(`/badges/${badgeId}`)
    badge.value = data
  } catch (error) {
    console.error('Error fetching badge details:', error)
    // Datos de ejemplo para desarrollo
    badge.value = {
      id: route.params.id,
      name: 'Quiz Master',
      description: 'Responde 10 quizzes correctamente',
      icon: 'mdi-help-circle',
      color: '#FF9F43',
      points: 150,
      earned: false,
      progress: 75,
      current_value: 7,
      required_value: 10,
      earned_count: 42,
      category: 'Habilidades',
      difficulty: 'Media',
      type: 'Quiz',
      created_at: new Date().toISOString(),
      earned_at: null,
      requirements: 'Debes responder correctamente 10 quizzes en cualquier curso.',
      steps: [
        {
          title: 'Completar primer quiz',
          description: 'Responde tu primer quiz',
          completed: true,
          progress: 100,
        },
        {
          title: 'Acumular 5 respuestas correctas',
          description: 'Responde 5 quizzes correctamente',
          completed: true,
          progress: 100,
        },
        {
          title: 'Acumular 10 respuestas correctas',
          description: 'Responde 10 quizzes correctamente',
          completed: false,
          progress: 75,
        },
      ],
    }
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'No disponible'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getDifficultyColor(difficulty) {
  const map = {
    Fácil: 'positive',
    Media: 'warning',
    Difícil: 'negative',
    Experto: 'purple',
  }
  return map[difficulty] || 'grey'
}

function continueProgress() {
  // Navegar a cursos o quizzes
  window.location.href = '/catalog'
}

onMounted(() => {
  fetchBadgeDetail()
})
</script>

<style scoped>
.badge-icon-large {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
