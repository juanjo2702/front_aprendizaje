<template>
  <q-page class="badges-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Badges Disponibles</h2>
        <p class="q-mb-none">Logros que puedes obtener en la plataforma</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps icon="mdi-trophy" label="Mis badges" color="primary" to="/badges/my" />
        <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
      </div>
    </div>

    <!-- Stats -->
    <div class="row q-gutter-lg q-mb-xl">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #ff9f43">
              {{ stats.available || 0 }}
            </div>
            <div class="text-subtitle1">Disponibles</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #36bd7e">
              {{ stats.completed || 0 }}
            </div>
            <div class="text-subtitle1">Completados</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #7b61ff">
              {{ stats.in_progress || 0 }}
            </div>
            <div class="text-subtitle1">En progreso</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #ff6b8b">
              {{ stats.locked || 0 }}
            </div>
            <div class="text-subtitle1">Bloqueados</div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Available badges grid -->
    <div class="q-mb-lg">
      <h3 class="q-mb-md">Todos los badges</h3>
      <div v-if="loading" class="text-center q-py-xl">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-md">Cargando badges...</div>
      </div>
      <div v-else-if="badges.length === 0" class="text-center q-py-xl">
        <q-icon name="mdi-trophy-outline" size="4em" color="grey-5" />
        <div class="text-h6 q-mt-md">No hay badges disponibles</div>
        <p class="q-mt-sm">Completa cursos y actividades para desbloquear badges.</p>
      </div>
      <div v-else class="row q-col-gutter-lg">
        <div v-for="badge in badges" :key="badge.id" class="col-12 col-sm-6 col-md-4">
          <q-card class="badge-card q-pa-lg">
            <div class="row items-center">
              <div class="col-auto">
                <div class="badge-icon" :style="{ backgroundColor: badge.color || '#7B61FF' }">
                  <q-icon :name="badge.icon || 'mdi-trophy'" size="2em" color="white" />
                </div>
              </div>
              <div class="col q-pl-md">
                <div class="text-h6 q-mb-xs">{{ badge.name }}</div>
                <div class="text-caption text-grey-7">{{ badge.description }}</div>
              </div>
            </div>
            <div class="q-mt-md">
              <q-linear-progress
                :value="badge.progress / 100"
                :color="badge.earned ? 'positive' : 'primary'"
                class="q-mb-sm"
              />
              <div class="row justify-between">
                <div class="text-caption">
                  {{ badge.earned ? '¡Completado!' : `${badge.progress}% completado` }}
                </div>
                <div class="text-caption">{{ badge.points }} pts</div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- How to earn badges -->
    <q-card class="q-pa-lg q-mb-xl">
      <h4 class="q-mb-md">¿Cómo obtener badges?</h4>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <div class="text-center q-pa-md">
            <q-icon name="mdi-book-open-variant" size="3em" color="primary" class="q-mb-sm" />
            <div class="text-h6 q-mb-xs">Completa cursos</div>
            <p class="q-mb-none">
              Termina cursos y módulos para desbloquear badges de especialización.
            </p>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-center q-pa-md">
            <q-icon name="mdi-gamepad-variant" size="3em" color="secondary" class="q-mb-sm" />
            <div class="text-h6 q-mb-xs">Juega y aprende</div>
            <p class="q-mb-none">
              Participa en juegos educativos y quizzes para ganar badges de juego.
            </p>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-center q-pa-md">
            <q-icon name="mdi-trending-up" size="3em" color="positive" class="q-mb-sm" />
            <div class="text-h6 q-mb-xs">Mejora continuamente</div>
            <p class="q-mb-none">Mantén tu racha de aprendizaje y participa regularmente.</p>
          </div>
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const badges = ref([])
const stats = ref({
  available: 0,
  completed: 0,
  in_progress: 0,
  locked: 0,
})

async function fetchAvailableBadges() {
  try {
    loading.value = true
    const { data } = await api.get('/badges/available')
    badges.value = data.badges || []
    stats.value = data.stats || stats.value
  } catch (error) {
    console.error('Error fetching badges:', error)
    // Datos de ejemplo para desarrollo
    badges.value = [
      {
        id: 1,
        name: 'Primer Curso',
        description: 'Completa tu primer curso',
        icon: 'mdi-book-check',
        color: '#7B61FF',
        progress: 75,
        earned: false,
        points: 100,
      },
      {
        id: 2,
        name: 'Quiz Master',
        description: 'Responde 10 quizzes correctamente',
        icon: 'mdi-help-circle',
        color: '#FF9F43',
        progress: 100,
        earned: true,
        points: 150,
      },
      {
        id: 3,
        name: 'Racha de 7 días',
        description: 'Accede a la plataforma 7 días seguidos',
        icon: 'mdi-calendar-check',
        color: '#36BD7E',
        progress: 43,
        earned: false,
        points: 200,
      },
    ]
    stats.value = { available: 12, completed: 3, in_progress: 5, locked: 4 }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAvailableBadges()
})
</script>

<style scoped>
.badge-card {
  border-radius: 16px;
  transition: transform 0.3s;
}
.badge-card:hover {
  transform: translateY(-4px);
}
.badge-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.glass-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
