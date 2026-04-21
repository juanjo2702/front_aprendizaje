<template>
  <q-page class="admin-page workspace-page">
    <div class="page-wrap workspace-wrap">
      <section class="hero-panel workspace-hero q-mb-lg">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-lg-8">
            <q-badge color="secondary" outline class="q-mb-md">Business Intelligence</q-badge>
            <h1 class="q-mb-sm">Supervisión global del LMS</h1>
            <p class="hero-copy q-mb-lg">
              Controla curación de cursos, flujo financiero QR, equilibrio de gamificación y crecimiento operativo desde
              una sola consola.
            </p>
            <div class="row q-gutter-sm">
              <q-btn color="primary" no-caps icon="fact_check" label="Ir a revisión" :to="{ name: 'admin-courses' }" />
              <q-btn flat no-caps color="secondary" icon="paid" label="Abrir finanzas" :to="{ name: 'admin-finances' }" />
            </div>
          </div>
          <div class="col-12 col-lg-4">
            <q-card class="hero-summary q-pa-lg">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Colas críticas</div>
              <div class="row q-col-gutter-md">
                <div class="col-4">
                  <div class="text-caption text-grey-5">Cursos</div>
                  <div class="text-h6 text-weight-bold text-warning">{{ overview.pending_reviews || 0 }}</div>
                </div>
                <div class="col-4">
                  <div class="text-caption text-grey-5">Pagos</div>
                  <div class="text-h6 text-weight-bold text-secondary">{{ overview.pending_payments || 0 }}</div>
                </div>
                <div class="col-4">
                  <div class="text-caption text-grey-5">Retiros</div>
                  <div class="text-h6 text-weight-bold text-info">{{ overview.pending_payouts || 0 }}</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </section>

      <div v-if="loading" class="q-py-md">
        <q-skeleton v-for="n in 5" :key="n" type="rect" height="120px" class="q-mb-md" dark />
      </div>

      <template v-else>
        <div class="row q-col-gutter-md q-mb-lg">
          <div v-for="card in metricCards" :key="card.label" class="col-12 col-sm-6 col-xl-3">
            <q-card class="metric-card workspace-summary-card">
              <div class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <q-avatar size="54px" :color="card.color" text-color="white" :icon="card.icon" />
                </div>
                <div class="col">
                  <div class="text-caption text-grey-5">{{ card.label }}</div>
                  <div class="text-h5 text-weight-bold">{{ card.value }}</div>
                  <div class="text-caption" :class="card.captionClass || 'text-grey-5'">{{ card.caption }}</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-xl-7">
            <q-card class="panel-card workspace-panel full-height">
              <q-card-section>
                <div class="text-h6 text-weight-bold">Popularidad por categoría</div>
                <div class="text-caption text-grey-5">Las categorías con más matrículas completadas.</div>
              </q-card-section>
              <q-separator dark />
              <q-card-section>
                <div v-if="!popularCategories.length" class="workspace-empty">
                  <strong>Aún no hay datos suficientes.</strong>
                  <span>La popularidad por categoría aparecerá cuando haya matrículas completadas y actividad real.</span>
                </div>
                <div v-else class="column q-gutter-md">
                  <div v-for="category in popularCategories" :key="category.id" class="category-row">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-body1 text-weight-medium">{{ category.name }}</div>
                      <div class="text-caption text-grey-5">{{ category.total_enrollments }} matrículas</div>
                    </div>
                    <q-linear-progress
                      rounded
                      size="10px"
                      color="secondary"
                      :value="category.total_enrollments / topCategoryTotal"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-xl-5">
            <q-card class="panel-card workspace-panel full-height">
              <q-card-section>
                <div class="text-h6 text-weight-bold">Monitor de almacenamiento</div>
                <div class="text-caption text-grey-5">Peso actual de videos y presión del disco local.</div>
              </q-card-section>
              <q-separator dark />
              <q-card-section class="column q-gutter-lg">
                <div>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-body2">Videos del LMS</div>
                    <div class="text-weight-medium">{{ storage.video_human }}</div>
                  </div>
                  <q-linear-progress
                    rounded
                    size="12px"
                    color="primary"
                    :value="videoRatio"
                  />
                </div>

                <div>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-body2">Uso total del disco</div>
                    <div class="text-weight-medium">{{ storage.disk_used_percentage || 0 }}%</div>
                  </div>
                  <q-linear-progress
                    rounded
                    size="12px"
                    color="warning"
                    :value="(storage.disk_used_percentage || 0) / 100"
                  />
                  <div class="text-caption text-grey-5 q-mt-sm">
                    {{ formatBytes(storage.disk_used_bytes || 0) }} usados de
                    {{ formatBytes(storage.disk_total_bytes || 0) }}.
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-xl-6">
            <q-card class="panel-card workspace-panel full-height">
              <q-card-section class="row items-center justify-between">
                <div>
                  <div class="text-h6 text-weight-bold">Cuellos pedagógicos</div>
                  <div class="text-caption text-grey-5">Actividades donde los estudiantes más fallan.</div>
                </div>
                <q-btn flat no-caps color="secondary" label="Ver auditoría" :to="{ name: 'admin-reports' }" />
              </q-card-section>
              <q-separator dark />
              <q-card-section class="q-pa-none">
                <q-list separator dark>
                  <q-item v-for="item in bottlenecks" :key="item.interactive_config_id">
                    <q-item-section>
                      <q-item-label>{{ item.lesson_title || 'Actividad sin lección' }}</q-item-label>
                      <q-item-label caption>{{ item.course_title || 'Curso sin nombre' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side class="text-right">
                      <div class="text-body2 text-negative">{{ item.failed_results }} fallos</div>
                      <div class="text-caption text-grey-5">{{ item.average_attempts }} intentos prom.</div>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!bottlenecks.length">
                    <q-item-section class="text-grey-5">No se detectaron cuellos críticos todavía.</q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-xl-6">
            <q-card class="panel-card workspace-panel full-height">
              <q-card-section class="row items-center justify-between">
                <div>
                  <div class="text-h6 text-weight-bold">Logs recientes</div>
                  <div class="text-caption text-grey-5">Quién aprobó, rechazó o ajustó algo y cuándo.</div>
                </div>
                <q-btn flat no-caps color="secondary" label="Ver reportes" :to="{ name: 'admin-reports' }" />
              </q-card-section>
              <q-separator dark />
              <q-card-section class="q-pa-none">
                <q-list separator dark>
                  <q-item v-for="log in recentLogs" :key="log.id">
                    <q-item-section>
                      <q-item-label>{{ actionLabel(log.action) }}</q-item-label>
                      <q-item-label caption>
                        {{ log.actor?.name || 'Sistema' }} · {{ log.target_label || 'Sin objetivo' }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side class="text-caption text-grey-5">
                      {{ formatDate(log.created_at) }}
                    </q-item-section>
                  </q-item>
                  <q-item v-if="!recentLogs.length">
                    <q-item-section class="text-grey-5">No hay registros administrativos todavía.</q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const overview = ref({})
const popularCategories = ref([])
const storage = ref({})
const recentLogs = ref([])
const bottlenecks = ref([])

const metricCards = computed(() => [
  {
    label: 'Usuarios activos',
    value: overview.value.active_users || 0,
    caption: 'Actividad real últimos 7 días',
    icon: 'groups',
    color: 'primary',
  },
  {
    label: 'Ingresos del mes',
    value: formatCurrency(overview.value.monthly_revenue || 0),
    caption: 'Pagos confirmados por QR / webhook',
    icon: 'payments',
    color: 'positive',
  },
  {
    label: 'Tasa de deserción',
    value: `${overview.value.dropout_rate || 0}%`,
    caption: 'Matrículas con bajo avance a 14+ días',
    icon: 'trending_down',
    color: 'warning',
  },
  {
    label: 'Cursos publicados',
    value: overview.value.published_courses || 0,
    caption: `${overview.value.pending_reviews || 0} en revisión`,
    icon: 'verified',
    color: 'secondary',
  },
])

const topCategoryTotal = computed(() => {
  const first = popularCategories.value[0]?.total_enrollments || 1
  return Math.max(first, 1)
})

const videoRatio = computed(() => {
  const total = Number(storage.value.disk_total_bytes || 0)
  const used = Number(storage.value.video_bytes || 0)
  if (!total) return 0
  return Math.min(1, used / total)
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0))
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionLabel(action = '') {
  return ({
    'course.status_changed': 'Cambio de estado de curso',
    'payment.approved': 'Pago aprobado',
    'payment.rejected': 'Pago rechazado',
    'payout.status_changed': 'Retiro actualizado',
    'platform.settings_updated': 'Configuración global editada',
    'badge.created': 'Badge creado',
    'reward.created': 'Recompensa creada',
  }[action] || action)
}

async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/dashboard-stats')
    overview.value = data.overview || {}
    popularCategories.value = data.popular_categories || []
    storage.value = data.storage || {}
    recentLogs.value = data.recent_logs || []
    bottlenecks.value = data.bottlenecks_preview || []
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<style scoped lang="scss">
.admin-page {
  background: transparent;
}

.page-wrap {
  width: min(100%, 1340px);
}

.hero-panel {
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(0, 196, 180, 0.16), transparent 36%),
    radial-gradient(circle at bottom left, rgba(39, 112, 255, 0.14), transparent 30%),
    linear-gradient(145deg, rgba(12, 27, 50, 0.98), rgba(8, 18, 36, 0.98));
  border: 1px solid rgba(93, 122, 255, 0.18);
}

.hero-panel h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.08;
  margin: 0;
}

.hero-copy {
  color: #c1d0eb;
  max-width: 760px;
}

.hero-summary,
.metric-card,
.panel-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}

.category-row {
  display: grid;
  gap: 8px;
}

@media (max-width: 768px) {
  .metric-card {
    padding: 18px;
  }
}
</style>
