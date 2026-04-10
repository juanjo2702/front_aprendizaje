<template>
  <q-page class="badges-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Mis badges</h2>
        <p class="q-mb-none">Colección de logros y reconocimientos</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          flat
          no-caps
          label="Badges disponibles"
          icon="mdi-trophy-outline"
          color="primary"
          to="/badges/available"
        />
        <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
      </div>
    </div>

    <!-- Stats -->
    <div class="row q-gutter-lg q-mb-xl">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #ff9f43">
              {{ stats.total_badges || 0 }}
            </div>
            <div style="color: #8b8ba7">Badges obtenidos</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #00b894">
              {{ stats.recent_badges || 0 }}
            </div>
            <div style="color: #8b8ba7">Este mes</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #00d2d3">
              {{ stats.completion_percentage || 0 }}%
            </div>
            <div style="color: #8b8ba7">Progreso total</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #6c5ce7">
              {{ stats.rarest_badge || '-' }}
            </div>
            <div style="color: #8b8ba7">Badge más raro</div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Badges Grid -->
    <div v-if="loading" class="row q-gutter-lg">
      <div v-for="n in 8" :key="n" class="col-6 col-sm-4 col-md-3">
        <q-skeleton type="circle" size="100%" dark />
      </div>
    </div>

    <div v-else-if="badges.length === 0" class="text-center q-py-xl">
      <q-icon name="mdi-trophy-outline" size="96px" color="grey-7" />
      <h3 class="q-mt-md" style="color: #8b8ba7">Aún no tienes badges</h3>
      <p style="color: #8b8ba7">Completa logros para desbloquear badges.</p>
      <q-btn
        class="btn-gradient q-mt-md"
        no-caps
        label="Explorar badges disponibles"
        icon="explore"
        to="/badges/available"
      />
    </div>

    <div v-else class="row q-gutter-lg">
      <div v-for="badge in badges" :key="badge.id" class="col-6 col-sm-4 col-md-3">
        <q-card
          class="badge-card glass-card cursor-pointer text-center q-pa-lg"
          @click="$router.push('/badges/' + badge.id)"
        >
          <q-avatar size="120px" class="q-mb-md">
            <img :src="badge.icon" :alt="badge.name" style="width: 100%; height: 100%" />
          </q-avatar>
          <div class="text-weight-medium q-mb-xs">{{ badge.name }}</div>
          <div style="color: #8b8ba7; font-size: 0.85rem">{{ badge.category }}</div>
          <q-badge v-if="badge.rarity === 'legendary'" color="orange" label="Legendario" />
          <q-badge v-else-if="badge.rarity === 'epic'" color="purple" label="Épico" />
          <q-badge v-else-if="badge.rarity === 'rare'" color="blue" label="Raro" />
          <q-badge v-else color="green" label="Común" />
          <div style="color: #5a5a7a; font-size: 0.75rem" class="q-mt-xs">
            Obtenido: {{ formatDate(badge.earned_at) }}
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const badges = ref([])
const stats = ref({})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadBadges() {
  try {
    const [badgesRes, statsRes] = await Promise.all([
      api.get('/badges/my'),
      api.get('/badges/stats'),
    ])

    badges.value = badgesRes.data.badges || badgesRes.data || []
    stats.value = statsRes.data || {}
  } catch (error) {
    console.error('Error cargando badges:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBadges()
})
</script>

<style lang="scss" scoped>
.badges-page {
  .stats-card {
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }

  .badge-card {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 40px rgba(255, 159, 67, 0.2);
    }
  }
}
</style>
