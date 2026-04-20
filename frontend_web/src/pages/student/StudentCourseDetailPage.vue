<template>
  <q-page class="student-page">
    <div v-if="currentCourseLoading" class="row q-col-gutter-md">
      <div class="col-12 col-lg-8"><q-skeleton dark type="rect" height="420px" /></div>
      <div class="col-12 col-lg-4"><q-skeleton dark type="rect" height="420px" /></div>
    </div>

    <div v-else-if="!currentCourse" class="text-center text-grey-5">
      No se pudo cargar este curso.
    </div>

    <template v-else>
      <section class="detail-grid">
        <div class="course-main">
          <q-badge outline color="secondary" class="q-mb-sm">{{ currentCourse.category?.name || 'General' }}</q-badge>
          <h1 class="detail-title">{{ currentCourse.title }}</h1>
          <p class="detail-copy">{{ currentCourse.short_description || currentCourse.description }}</p>

          <div class="detail-metrics">
            <span>{{ currentCourse.total_students || 0 }} estudiantes</span>
            <span>{{ currentCourse.level }}</span>
            <span>{{ currentCourse.language || 'ES' }}</span>
            <span v-if="currentCourse.has_interactive_activities">Gamificacion activa</span>
            <span>Nivel requerido {{ currentCourse.required_level || 1 }}</span>
          </div>

          <q-banner v-if="currentCourse.is_level_locked" rounded class="bg-negative text-white q-mb-lg">
            Este curso se desbloquea cuando llegues al nivel {{ currentCourse.required_level }}. Tu nivel actual es {{ currentCourse.user_level || 1 }}.
          </q-banner>

          <div class="detail-player">
            <iframe
              v-if="isYouTube(currentCourse.preview_video_url)"
              :src="toEmbedUrl(currentCourse.preview_video_url)"
              frameborder="0"
              allowfullscreen
            />
            <StudentVideoPlayer
              v-else-if="currentCourse.preview_video_url"
              :source="currentCourse.preview_video_url"
            />
            <div v-else class="preview-empty">
              <q-icon name="ondemand_video" size="60px" />
              <div>Este curso no tiene trailer cargado todavia.</div>
            </div>
          </div>

          <q-card flat bordered class="section-card">
            <div class="text-h6 text-weight-bold q-mb-md">Lo que aprenderas</div>
            <div class="bullet-grid">
              <div v-for="(item, index) in learningItems" :key="index" class="bullet-item">
                <q-icon name="task_alt" color="secondary" />
                <span>{{ item }}</span>
              </div>
            </div>
          </q-card>

          <q-card flat bordered class="section-card">
            <div class="text-h6 text-weight-bold q-mb-md">Temario</div>
            <q-expansion-item
              v-for="module in currentCourse.modules || []"
              :key="module.id"
              default-opened
              header-class="text-weight-medium"
              :label="module.title"
            >
              <q-list separator dark>
                <q-item v-for="lesson in module.lessons || []" :key="lesson.id">
                  <q-item-section avatar>
                    <q-icon :name="lessonIcon(lesson.normalized_type || lesson.type)" color="secondary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ lesson.title }}</q-item-label>
                    <q-item-label caption>
                      {{ lesson.normalized_type || lesson.type }} · {{ lesson.duration || 0 }} seg
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge v-if="lesson.is_free" outline color="positive">Vista previa</q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-card>
        </div>

        <aside class="purchase-card">
          <q-card flat bordered class="purchase-card__shell">
            <div class="text-overline text-secondary">Ficha del curso</div>
            <div class="text-h4 text-weight-bold q-mt-xs">
              {{ formatPrice(currentCourse.price) }}
            </div>
            <div class="text-caption text-grey-5 q-mt-sm">
              {{ currentCourse.is_enrolled ? 'Ya estas inscrito en este curso.' : 'Checkout QR asincrono listo para pagos.' }}
            </div>

            <div v-if="currentCourseProgress" class="progress-box">
              <div class="row items-center justify-between">
                <span>Avance actual</span>
                <strong>{{ currentCourseProgress.overall_progress?.percentage || 0 }}%</strong>
              </div>
              <q-linear-progress
                class="q-mt-sm"
                rounded
                size="10px"
                color="secondary"
                :value="(currentCourseProgress.overall_progress?.percentage || 0) / 100"
              />
            </div>

            <div class="column q-gutter-sm q-mt-lg">
              <q-btn
                v-if="currentCourse.is_enrolled"
                color="primary"
                no-caps
                icon="play_arrow"
                label="Continuar curso"
                @click="goToLearning"
              />
              <q-btn
                v-else
                color="primary"
                no-caps
                icon="qr_code_2"
                :loading="paymentLoading"
                :disable="currentCourse.is_level_locked"
                label="Comprar con QR"
                @click="openCheckout"
              />
              <q-btn
                flat
                color="secondary"
                no-caps
                icon="school"
                label="Volver al marketplace"
                :to="{ name: 'student-marketplace' }"
              />
            </div>

            <q-separator class="q-my-lg" dark />

            <div class="column q-gutter-sm text-grey-4">
              <div><q-icon name="workspace_premium" class="q-mr-sm" /> Certificado: {{ currentCourse.has_certificate ? 'Incluido' : 'No incluido' }}</div>
              <div><q-icon name="sports_esports" class="q-mr-sm" /> Gamificacion: {{ currentCourse.has_interactive_activities ? 'Si' : 'No' }}</div>
              <div><q-icon name="public" class="q-mr-sm" /> Idioma: {{ currentCourse.language || 'ES' }}</div>
              <div><q-icon name="military_tech" class="q-mr-sm" /> Nivel requerido: {{ currentCourse.required_level || 1 }}</div>
            </div>
          </q-card>
        </aside>
      </section>

      <q-card v-if="currentCourse.shop_preview?.length" flat bordered class="section-card q-mt-lg">
        <div class="text-h6 text-weight-bold q-mb-md">Recompensas y desbloqueables del curso</div>
        <div class="reward-preview-grid">
          <div v-for="item in currentCourse.shop_preview" :key="item.id" class="reward-preview-item">
            <q-icon :name="rewardIcon(item.type)" color="secondary" size="26px" />
            <div>
              <div class="text-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey-5">
                {{ item.cost_coins }} monedas · nivel {{ item.minimum_level_required }}
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </template>

    <q-dialog v-model="checkoutDialog">
      <q-card class="checkout-card">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Checkout QR</div>
            <div class="text-caption text-grey-5">El pago queda en espera hasta que el backend confirme la transaccion.</div>
          </div>
          <q-btn flat round dense icon="close" @click="closeCheckout" />
        </q-card-section>
        <q-card-section v-if="paymentIntent">
          <div class="text-center">
            <img class="checkout-qr" :src="paymentIntent.qr_code" alt="QR de pago" />
            <div class="text-subtitle1 q-mt-md">Escanea para completar la compra</div>
            <div class="text-caption text-grey-5">
              Transaccion: {{ paymentIntent.transaction_id }} · {{ formatPrice(paymentIntent.amount) }}
            </div>
            <q-badge class="q-mt-md" :color="paymentCompleted ? 'positive' : 'warning'" text-color="dark">
              {{ paymentCompleted ? 'Pago confirmado' : 'Esperando pago' }}
            </q-badge>
            <q-btn
              v-if="showSimulateButton && !paymentCompleted"
              class="q-mt-md"
              outline
              color="warning"
              no-caps
              icon="bug_report"
              label="Simular pago (demo)"
              :loading="simulatingPayment"
              @click="simulatePayment"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from 'src/stores/student'
import StudentVideoPlayer from 'src/components/student/StudentVideoPlayer.vue'
import { api } from 'src/services/api'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const studentStore = useStudentStore()
const { currentCourse, currentCourseLoading, currentCourseProgress, paymentIntent, paymentLoading } = storeToRefs(studentStore)

const checkoutDialog = ref(false)
const paymentCompleted = ref(false)
const simulatingPayment = ref(false)
const showSimulateButton = computed(() => import.meta.env.DEV || window.location.hostname === 'localhost')

const learningItems = computed(() => {
  const items = currentCourse.value?.what_you_learn || []
  return items.length ? items : ['Contenido estructurado', 'Seguimiento de progreso', 'Actividades interactivas']
})

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) studentStore.loadCourseDetail(slug)
  },
  { immediate: true },
)

function lessonIcon(type) {
  return ({
    video: 'play_circle_outline',
    reading: 'article',
    resource: 'description',
    interactive: 'extension',
  }[type] || 'radio_button_checked')
}

function isYouTube(url = '') {
  return String(url).includes('youtube.com') || String(url).includes('youtu.be')
}

function toEmbedUrl(url = '') {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }

  if (url.includes('youtu.be')) {
    return `https://www.youtube.com/embed/${url.split('/').pop()}`
  }

  return url
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function rewardIcon(type) {
  return (
    {
      discount_coupon: 'sell',
      premium_content: 'lock_open',
      avatar_frame: 'style',
      profile_title: 'workspace_premium',
    }[type] || 'redeem'
  )
}

function goToLearning() {
  const firstLesson = currentCourse.value?.modules?.flatMap((module) => module.lessons || []).find(Boolean)
  if (!firstLesson) return
  router.push({ name: 'student-learning', params: { lessonId: firstLesson.id } })
}

async function openCheckout() {
  paymentCompleted.value = false
  const intent = await studentStore.createPaymentIntent(currentCourse.value.id)
  checkoutDialog.value = true
  studentStore.startPaymentStatusPolling(intent.transaction_id, async () => {
    paymentCompleted.value = true
    $q.notify({ type: 'positive', message: 'Pago confirmado. Ya puedes ingresar al curso.' })
    await studentStore.loadCourseDetail(route.params.slug)
  })
}

function closeCheckout() {
  checkoutDialog.value = false
  studentStore.clearPaymentIntent()
}

async function simulatePayment() {
  if (!paymentIntent.value?.transaction_id) return

  simulatingPayment.value = true
  try {
    await api.post('/payments/webhook', {
      transaction_id: paymentIntent.value.transaction_id,
    })

    paymentCompleted.value = true
    $q.notify({
      type: 'positive',
      message: 'Pago simulado correctamente. El curso quedó desbloqueado.',
    })

    studentStore.clearPaymentIntent()
    await studentStore.loadCourseDetail(route.params.slug)
  } finally {
    simulatingPayment.value = false
  }
}
</script>

<style scoped>
.student-page {
  padding: 28px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 360px;
  gap: 24px;
}

.detail-title {
  font-size: 2.7rem;
  line-height: 1.05;
  margin: 0 0 16px;
}

.detail-copy,
.detail-metrics {
  color: #97a0cc;
}

.detail-metrics {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.detail-player {
  margin: 20px 0 24px;
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  min-height: 340px;
}

.detail-player iframe {
  width: 100%;
  min-height: 420px;
  border: 0;
}

.preview-empty,
.purchase-card__shell,
.section-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.preview-empty {
  min-height: 340px;
  display: grid;
  place-items: center;
  gap: 8px;
  color: #7f89c5;
}

.section-card,
.purchase-card__shell {
  border-radius: 28px;
  padding: 22px;
}

.course-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.purchase-card {
  position: sticky;
  top: 94px;
  align-self: start;
}

.progress-box {
  margin-top: 18px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.bullet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.bullet-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #eef1ff;
}

.checkout-card {
  width: min(520px, 92vw);
  background: #101326;
}

.reward-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.reward-preview-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
}

.checkout-qr {
  width: min(280px, 80vw);
  max-width: 100%;
}

@media (max-width: 1100px) {
  .detail-grid,
  .bullet-grid,
  .reward-preview-grid {
    grid-template-columns: 1fr;
  }

  .purchase-card {
    position: static;
  }
}
</style>
