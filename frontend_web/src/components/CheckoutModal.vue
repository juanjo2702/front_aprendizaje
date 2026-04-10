<template>
  <q-dialog v-model="isOpen" persistent seamless>
    <q-card class="glass-card q-pa-md" style="min-width: 400px; max-width: 90vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-gradient text-weight-bold">Inscripción al Curso</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense color="white" @click="closeModal" />
      </q-card-section>

      <q-card-section v-if="loading" class="text-center q-pa-xl">
        <q-spinner-orbit color="primary" size="3em" />
        <div class="q-mt-md text-text-secondary">Generando orden de pago...</div>
      </q-card-section>

      <q-card-section v-else-if="paymentComplete" class="text-center q-pa-xl animate-fade-in-up">
        <q-icon name="check_circle" color="positive" size="80px" />
        <h4 class="q-mt-md q-mb-sm text-white">¡Pago Exitoso!</h4>
        <p class="text-text-secondary">Te has inscrito correctamente en el curso.</p>
        <q-btn
          class="btn-gradient q-mt-md"
          no-caps
          label="Ir a Mis Cursos"
          @click="goToDashboard"
        />
      </q-card-section>

      <q-card-section v-else-if="qrCode" class="text-center animate-fade-in-up">
        <div class="q-mb-md">
          <div class="text-subtitle1 text-white q-mb-xs">{{ course?.title }}</div>
          <div class="text-h4 text-weight-bold" style="color: #00d2d3">${{ course?.price }}</div>
        </div>

        <div
          class="q-pa-md q-mb-md"
          style="background: white; border-radius: 12px; display: inline-block"
        >
          <img :src="qrCode" alt="Código QR de Pago" style="width: 250px; height: 250px" />
        </div>

        <p class="text-text-secondary q-mb-md">
          Escanea el código QR desde tu app bancaria para completar la compra.
        </p>

        <!-- Dev Only Mock Button -->
        <q-btn
          outline
          color="warning"
          no-caps
          icon="bug_report"
          label="Simular Escaneo (Dev Mode)"
          class="full-width q-mb-sm"
          :loading="simulating"
          @click="simulatePayment"
        />
      </q-card-section>

      <q-card-section v-else class="text-center text-negative">
        <q-icon name="error" size="3em" />
        <div class="q-mt-md">Ocurrió un error al generar la orden. Inténtalo más tarde.</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'
import { useQuasar } from 'quasar'

const props = defineProps({
  course: Object,
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const auth = useAuthStore()
const $q = useQuasar()

const isOpen = ref(false)
const loading = ref(false)
const qrCode = ref(null)
const transactionId = ref(null)
const paymentComplete = ref(false)
const simulating = ref(false)

let pollInterval = null

const open = async () => {
  if (!auth.isAuthenticated) {
    $q.notify({ type: 'warning', message: 'Debes iniciar sesión para inscribirte.' })
    router.push('/login')
    return
  }

  isOpen.value = true
  loading.value = true
  qrCode.value = null
  paymentComplete.value = false

  try {
    const { data } = await api.post('/payments/intent', { course_id: props.course.id })
    qrCode.value = data.qr_code
    transactionId.value = data.transaction_id
    startPolling()
  } catch (e) {
    if (
      e.response?.status === 400 &&
      e.response?.data?.message === 'Ya estás inscrito en este curso.'
    ) {
      $q.notify({ type: 'info', message: 'Ya posees este curso.' })
      router.push('/dashboard')
    } else {
      console.error(e)
    }
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
  stopPolling()
}

const startPolling = () => {
  pollInterval = setInterval(checkPaymentStatus, 3000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const checkPaymentStatus = async () => {
  if (!transactionId.value) return
  try {
    const { data } = await api.get(`/payments/${transactionId.value}`)
    if (data.status === 'completed') {
      stopPolling()
      paymentComplete.value = true
    }
  } catch (e) {
    console.error('Error polling payment status', e)
  }
}

const simulatePayment = async () => {
  simulating.value = true
  try {
    await api.post('/payments/webhook', { transaction_id: transactionId.value })
    // The poll will pick it up or we can just force it
    stopPolling()
    paymentComplete.value = true
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error simulando el pago.' })
  } finally {
    simulating.value = false
  }
}

const goToDashboard = () => {
  closeModal()
  router.push('/dashboard')
}

// Ensure polling stops if component unmounts
onBeforeUnmount(stopPolling)

defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
.glass-card {
  background: rgba(26, 26, 62, 0.95);
  border: 1px solid rgba(108, 92, 231, 0.5);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(0, 210, 211, 0.15);
}
</style>
