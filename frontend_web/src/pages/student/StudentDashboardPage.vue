<template>
  <q-page class="student-page">
    <section class="hero-grid">
      <q-card flat bordered class="hero-card hero-card--primary">
        <div class="hero-card__badge">Lobby de aprendizaje</div>
        <h1 class="hero-card__title">Sube de nivel mientras avanzas en tus cursos</h1>
        <p class="hero-card__copy">
          Tu progreso, tus rachas y tus cursos activos ahora viven en un solo espacio de estudio.
        </p>

        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat__label">Nivel</span>
            <strong>{{ gamificationSummary.level }}</strong>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__label">Monedas</span>
            <strong>{{ gamificationSummary.coins }}</strong>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__label">Racha</span>
            <strong>{{ gamificationSummary.streak }} dias</strong>
          </div>
        </div>

        <div class="text-caption text-grey-5 q-mb-md">
          Estatus desbloqueado: {{ gamificationSummary.levelTitle }}
        </div>

        <div class="xp-track">
          <div class="row items-center justify-between q-mb-xs">
            <span>XP hacia nivel {{ gamificationSummary.level + 1 }}</span>
            <span>{{ gamificationSummary.currentXp }}/{{ gamificationSummary.requiredXp }}</span>
          </div>
          <q-linear-progress rounded size="12px" color="secondary" :value="gamificationSummary.progress" />
        </div>
      </q-card>

      <StudentRadarChart :skills="dashboard.radarSkills" />
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="text-h5 text-weight-bold">Continuar viendo</div>
          <div class="text-caption text-grey-5">Tus cursos activos con avance exacto y acceso rapido.</div>
        </div>
        <q-btn flat no-caps color="secondary" label="Ver mi aprendizaje" :to="{ name: 'student-my-learning' }" />
      </div>

      <div v-if="dashboardLoading" class="row q-col-gutter-md">
        <div v-for="n in 3" :key="n" class="col-12 col-md-4">
          <q-skeleton dark type="rect" height="190px" />
        </div>
      </div>

      <div v-else class="course-rail">
        <q-card
          v-for="course in activeCourses"
          :key="course.slug || course.id"
          flat
          bordered
          class="rail-card"
          @click="openCourse(course.slug)"
        >
          <div class="rail-card__content">
            <div>
              <div class="text-overline text-secondary">{{ course.instructor || 'Instructor' }}</div>
              <div class="text-h6 text-weight-bold">{{ course.title }}</div>
            </div>
            <q-circular-progress
              show-value
              font-size="12px"
              color="secondary"
              track-color="rgba(255,255,255,0.08)"
              size="68px"
              :value="course.progress"
            >
              {{ course.progress }}%
            </q-circular-progress>
          </div>
          <q-linear-progress class="q-mt-md" rounded size="10px" color="primary" :value="course.progress / 100" />
        </q-card>
      </div>
    </section>

    <section class="section-grid">
      <q-card flat bordered class="student-panel">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Actividad reciente</div>
            <div class="text-caption text-grey-5">Tus ultimas partidas, quizzes y certificados.</div>
          </div>
        </div>

        <q-list v-if="dashboard.recentActivity.length" separator dark>
          <q-item v-for="activity in dashboard.recentActivity.slice(0, 6)" :key="`${activity.type}-${activity.id}`">
            <q-item-section avatar>
              <q-avatar :color="activity.color || 'primary'" text-color="white">
                <q-icon :name="activity.icon || 'bolt'" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ activity.title }}</q-item-label>
              <q-item-label caption>{{ describeActivity(activity) }}</q-item-label>
            </q-item-section>
            <q-item-section side class="text-caption text-grey-6">
              {{ formatDate(activity.date) }}
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-5">Cuando completes actividades, apareceran aqui.</div>
      </q-card>

      <q-card flat bordered class="student-panel">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Atajos utiles</div>
            <div class="text-caption text-grey-5">Acciones frecuentes para entrar en flujo rapido.</div>
          </div>
        </div>

        <div class="shortcut-grid">
          <q-btn class="shortcut-card" flat no-caps icon="storefront" label="Marketplace" :to="{ name: 'student-marketplace' }" />
          <q-btn class="shortcut-card" flat no-caps icon="redeem" label="Coin Shop" :to="{ name: 'student-shop' }" />
          <q-btn class="shortcut-card" flat no-caps icon="school" label="Mi aprendizaje" :to="{ name: 'student-my-learning' }" />
          <q-btn class="shortcut-card" flat no-caps icon="workspace_premium" label="Inventario" :to="{ name: 'student-inventory' }" />
          <q-btn class="shortcut-card" flat no-caps icon="verified" label="Certificados" :to="{ name: 'student-certificates-vault' }" />
        </div>
      </q-card>
    </section>

    <q-card flat bordered class="student-panel">
      <div class="section-head">
        <div>
          <div class="text-h6 text-weight-bold">Canjes recientes</div>
          <div class="text-caption text-grey-5">Así se ve la utilidad real de tus monedas dentro de la plataforma.</div>
        </div>
        <q-btn flat no-caps color="secondary" label="Ir a la tienda" :to="{ name: 'student-shop' }" />
      </div>

      <q-list v-if="dashboard.recentPurchases.length" dark separator>
        <q-item v-for="purchase in dashboard.recentPurchases" :key="purchase.id">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              <q-icon name="redeem" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ purchase.shopItem?.name || 'Recompensa' }}</q-item-label>
            <q-item-label caption>
              {{ purchase.shopItem?.type || 'compra' }} · {{ purchase.costCoins }} monedas
            </q-item-label>
          </q-item-section>
          <q-item-section side class="text-caption text-grey-6">
            {{ formatDate(purchase.purchasedAt) }}
          </q-item-section>
        </q-item>
      </q-list>
      <div v-else class="text-grey-5">Todavía no has gastado monedas. La tienda ya está lista para usarse.</div>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudentStore } from 'src/stores/student'
import StudentRadarChart from 'src/components/student/StudentRadarChart.vue'

const router = useRouter()
const studentStore = useStudentStore()
const { dashboard, dashboardLoading, activeCourses, gamificationSummary } = storeToRefs(studentStore)

onMounted(() => {
  studentStore.loadDashboard()
})

function openCourse(slug) {
  if (!slug) return
  router.push({ name: 'student-course-detail', params: { slug } })
}

function describeActivity(activity) {
  if (activity.type === 'game') return `Puntaje ${activity.score}/${activity.max_score}`
  if (activity.type === 'quiz') return `${activity.correct_answers}/${activity.total_questions} correctas`
  if (activity.type === 'certificate') return `Codigo ${activity.certificate_code}`
  return 'Actividad registrada'
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.student-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 24px;
}

.hero-card,
.student-panel,
.rail-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.hero-card {
  border-radius: 32px;
  padding: 28px;
}

.hero-card--primary {
  background:
    radial-gradient(circle at top left, rgba(94, 107, 255, 0.28), transparent 40%),
    linear-gradient(160deg, rgba(11, 16, 39, 0.98), rgba(17, 22, 48, 0.96));
}

.hero-card__badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #20d5ec;
  margin-bottom: 14px;
}

.hero-card__title {
  font-size: 2.5rem;
  line-height: 1.05;
  margin: 0;
}

.hero-card__copy {
  color: #97a0cc;
  max-width: 640px;
  margin: 16px 0 20px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.hero-stat {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-stat__label {
  color: #97a0cc;
  font-size: 0.78rem;
}

.xp-track {
  color: #d7dcff;
}

.section-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.course-rail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.rail-card {
  border-radius: 24px;
  padding: 20px;
  cursor: pointer;
}

.rail-card__content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.student-panel {
  border-radius: 28px;
  padding: 22px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.shortcut-card {
  min-height: 88px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 1100px) {
  .hero-grid,
  .section-grid,
  .course-rail {
    grid-template-columns: 1fr;
  }
}
</style>
