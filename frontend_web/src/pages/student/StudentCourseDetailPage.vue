<template>
  <q-page class="student-page" data-cy="student-course-detail-page">
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
                <q-item
                  v-for="lesson in module.lessons || []"
                  :key="lesson.id"
                  :clickable="lesson.is_free"
                  @click="openFreeLesson(lesson)"
                >
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
                <strong>{{ courseProgressPercent }}%</strong>
              </div>
              <q-linear-progress
                class="q-mt-sm"
                rounded
                size="10px"
                color="secondary"
                :value="courseProgressPercent / 100"
              />
            </div>

            <q-banner
              v-if="currentCourse.has_certificate"
              rounded
              class="q-mt-md"
              :class="currentCourseProgress?.certificate?.qualifies ? 'bg-positive text-white' : 'bg-dark text-grey-3'"
            >
              <div class="text-weight-medium q-mb-xs">Ruta para el certificado</div>
              <div>
                {{
                  currentCourseProgress?.certificate?.message
                    || (
                      currentCourse.certificate_requires_final_exam
                        ? `Este curso exige aprobar el examen final${currentCourse.certificate_final_lesson?.title ? `: ${currentCourse.certificate_final_lesson.title}` : ''}.`
                        : `Necesitas completar el curso y alcanzar al menos ${currentCourse.certificate_min_score || 70}% para certificarte.`
                    )
                }}
              </div>
            </q-banner>

            <div class="column q-gutter-sm q-mt-lg">
              <q-btn
                v-if="currentCourse.is_enrolled"
                color="primary"
                no-caps
                data-cy="continue-course-btn"
                icon="play_arrow"
                label="Continuar curso"
                @click="goToLearning"
              />
              <q-btn
                v-else
                color="primary"
                no-caps
                data-cy="buy-course-qr-btn"
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
              <div v-if="currentCourse.has_certificate && currentCourse.certificate_requires_final_exam">
                <q-icon name="fact_check" class="q-mr-sm" /> Examen final: {{ currentCourse.certificate_final_lesson?.title || 'Pendiente de configuración' }}
              </div>
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
      <q-card class="checkout-card" data-cy="checkout-dialog">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Checkout QR</div>
            <div class="text-caption text-grey-5">El pago queda en espera hasta que el backend confirme la transaccion.</div>
          </div>
          <q-btn flat round dense icon="close" @click="closeCheckout" />
        </q-card-section>
        <q-card-section class="column q-gutter-md">
          <q-banner rounded class="bg-dark text-grey-3">
            <div class="text-weight-medium">Resumen de la compra</div>
            <div class="q-mt-xs">{{ currentCourse.title }}</div>
            <div class="text-caption text-grey-5 q-mt-xs">
              Precio base: {{ formatPrice(currentCourse.price) }}
            </div>
          </q-banner>

          <q-input
            v-model="couponCode"
            data-cy="apply-coupon-input"
            outlined
            dark
            dense
            label="Aplicar cupón"
            hint="Opcional. Solo se aceptan cupones comprados por tu cuenta."
          >
            <template #append>
              <q-btn
                flat
                dense
                no-caps
                color="secondary"
                data-cy="generate-qr-btn"
                label="Aplicar y generar QR"
                :loading="paymentLoading"
                @click="startCheckout"
              />
            </template>
          </q-input>

          <q-select
            v-if="availableCoupons.length"
            v-model="couponCode"
            data-cy="available-coupons-select"
            outlined
            dark
            dense
            emit-value
            map-options
            clearable
            label="Mis cupones disponibles"
            :options="availableCouponOptions"
            hint="Selecciona uno de tus cupones comprados o escribe el código manualmente arriba."
          />

          <q-banner v-else rounded class="bg-dark text-grey-4">
            <div class="text-weight-medium">No tienes cupones disponibles</div>
            <div class="q-mt-xs">
              Puedes continuar la compra sin cupón o ir a la Tienda de monedas para desbloquear uno.
            </div>
            <div class="row justify-center q-gutter-sm q-mt-sm checkout-empty-actions">
              <q-btn
                flat
                dense
                no-caps
                color="secondary"
                icon="qr_code_2"
                label="Continuar sin cupón"
                @click="startCheckout"
              />
              <q-btn
                flat
                dense
                no-caps
                color="secondary"
                icon="storefront"
                label="Ir a Coin Shop"
                :to="{ name: 'student-shop' }"
                @click="closeCheckout"
              />
            </div>
          </q-banner>

          <q-banner v-if="checkoutError" rounded class="bg-negative text-white">
            {{ checkoutError }}
          </q-banner>

          <q-banner v-if="paymentIntent" rounded class="bg-dark text-grey-3">
            <div class="text-weight-medium">Resumen del cobro</div>
            <div class="q-mt-xs">
              Original: {{ formatPrice(paymentIntent.original_amount || currentCourse.price) }}
            </div>
            <div v-if="paymentIntent.discount_amount" class="q-mt-xs">
              Descuento: -{{ formatPrice(paymentIntent.discount_amount) }}
              <span v-if="paymentIntent.discount_percent">({{ paymentIntent.discount_percent }}%)</span>
            </div>
            <div class="q-mt-xs">
              Total a pagar: {{ formatPrice(paymentIntent.amount) }}
            </div>
          </q-banner>

          <div v-if="paymentIntent?.qr_code" class="checkout-qr-panel">
            <img class="checkout-qr" :src="paymentIntent.qr_code" alt="QR de pago" />
            <div class="text-subtitle1 q-mt-md text-center">Escanea para completar la compra</div>
            <div class="text-caption text-grey-5 text-center">
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
              data-cy="simulate-payment-btn"
              icon="bug_report"
              label="Simular pago (demo)"
              :loading="simulatingPayment"
              @click="simulatePayment"
            />
          </div>

          <q-banner v-else-if="paymentIntent?.status === 'completed'" rounded class="bg-positive text-white">
            Compra confirmada. El curso quedó desbloqueado con el cupón aplicado.
          </q-banner>

          <div v-if="!paymentIntent" class="row justify-end q-gutter-sm">
            <q-btn flat no-caps label="Cancelar" @click="closeCheckout" />
            <q-btn
              color="primary"
              no-caps
              icon="qr_code_2"
              label="Generar QR sin cupón"
              :loading="paymentLoading"
              @click="startCheckout"
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
const { currentCourse, currentCourseLoading, currentCourseProgress, paymentIntent, paymentLoading, inventory } = storeToRefs(studentStore)

const checkoutDialog = ref(false)
const paymentCompleted = ref(false)
const simulatingPayment = ref(false)
const couponCode = ref('')
const checkoutError = ref('')
const showSimulateButton = computed(() => import.meta.env.DEV || window.location.hostname === 'localhost')
const availableCoupons = computed(() =>
  (inventory.value?.locker?.coupons || []).filter((coupon) => !coupon.is_used),
)
const availableCouponOptions = computed(() =>
  availableCoupons.value.map((coupon) => ({
    label: `${coupon.code} · ${Number(coupon.discount_percent || 0)}% · ${coupon.shop_item?.name || 'Cupón'}`,
    value: coupon.code,
  })),
)
const courseProgressPercent = computed(() => {
  const raw = currentCourseProgress.value?.overall_progress
  if (typeof raw === 'number') return raw
  return Number(raw?.percentage || 0)
})

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

function openFreeLesson(lesson) {
  if (!lesson?.id || !lesson.is_free) return
  router.push({ name: 'student-learning', params: { lessonId: lesson.id } })
}

async function openCheckout() {
  paymentCompleted.value = false
  checkoutError.value = ''
  couponCode.value = ''
  studentStore.clearPaymentIntent()
  await studentStore.loadInventory()
  checkoutDialog.value = true
}

function closeCheckout() {
  checkoutDialog.value = false
  checkoutError.value = ''
  couponCode.value = ''
  studentStore.clearPaymentIntent()
}

async function startCheckout() {
  checkoutError.value = ''
  studentStore.clearPaymentIntent()
  paymentCompleted.value = false

  try {
    const intent = await studentStore.createPaymentIntent(currentCourse.value.id, couponCode.value.trim())
    paymentCompleted.value = intent.status === 'completed'

    if (intent.status === 'completed') {
      $q.notify({ type: 'positive', message: 'Compra confirmada. Ya puedes ingresar al curso.' })
      await Promise.all([studentStore.loadCourseDetail(route.params.slug), studentStore.loadInventory()])
      return
    }

    studentStore.startPaymentStatusPolling(intent.transaction_id, async () => {
      paymentCompleted.value = true
      $q.notify({ type: 'positive', message: 'Pago confirmado. Ya puedes ingresar al curso.' })
      await Promise.all([studentStore.loadCourseDetail(route.params.slug), studentStore.loadInventory()])
    })
  } catch (error) {
    checkoutError.value = error?.response?.data?.message || 'No se pudo generar el checkout.'
  }
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
    await Promise.all([studentStore.loadCourseDetail(route.params.slug), studentStore.loadInventory()])
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

.checkout-empty-actions {
  width: 100%;
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
  display: block;
  margin: 0 auto;
}

.checkout-qr-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
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
