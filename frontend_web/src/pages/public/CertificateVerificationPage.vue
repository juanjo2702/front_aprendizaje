<template>
  <q-page class="verification-page">
    <div class="verification-shell">
      <q-card class="verification-card" flat bordered>
        <div class="row items-center justify-between q-mb-lg">
          <div>
            <div class="text-overline text-secondary">Validacion publica</div>
            <div class="text-h4 text-weight-bold">Verificacion de certificado</div>
            <div class="text-body2 text-grey-5">
              Confirma si el certificado es autentico y revisa sus datos principales.
            </div>
          </div>
          <q-btn flat no-caps icon="home" label="Ir al inicio" to="/" />
        </div>

        <div v-if="loading" class="verification-state">
          <q-spinner color="primary" size="48px" />
          <div class="text-subtitle1 q-mt-md">Validando certificado...</div>
        </div>

        <div v-else-if="!verification.valid" class="verification-state">
          <q-icon name="gpp_bad" color="negative" size="64px" />
          <div class="text-h6 q-mt-md">No pudimos validar este certificado</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            {{ verification.message || 'El codigo no existe o ya no es valido.' }}
          </div>
        </div>

        <div v-else class="verification-result">
          <div class="result-banner">
            <q-icon name="verified" color="positive" size="32px" />
            <div>
              <div class="text-h6 text-weight-bold">Certificado valido</div>
              <div class="text-body2 text-grey-4">
                Emitido por la plataforma y verificado el {{ formatDateTime(verification.verification_date) }}.
              </div>
            </div>
          </div>

          <div class="result-grid">
            <q-card flat bordered class="result-panel">
              <div class="panel-label">Participante</div>
              <div class="panel-value">{{ verification.certificate.user?.name }}</div>

              <div class="panel-label q-mt-lg">Curso</div>
              <div class="panel-value">{{ verification.certificate.course?.title }}</div>

              <div class="panel-label q-mt-lg">Instructor</div>
              <div class="panel-value">{{ verification.certificate.course?.instructor?.name || 'No disponible' }}</div>
            </q-card>

            <q-card flat bordered class="result-panel">
              <div class="panel-label">Codigo</div>
              <div class="panel-value code">{{ verification.certificate.certificate_code }}</div>

              <div class="panel-label q-mt-lg">Fecha de emision</div>
              <div class="panel-value">{{ formatDate(verification.certificate.issued_at) }}</div>

              <div class="panel-label q-mt-lg">Estado</div>
              <q-badge :color="verification.expired ? 'negative' : 'positive'" :label="verification.expired ? 'Expirado' : 'Vigente'" />
            </q-card>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'

const route = useRoute()
const loading = ref(true)
const verification = ref({
  valid: false,
  expired: false,
  certificate: null,
  verification_date: null,
  message: '',
})

function formatDate(value) {
  if (!value) return 'No disponible'
  return new Date(value).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return 'No disponible'
  return new Date(value).toLocaleString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadVerification() {
  loading.value = true

  try {
    const { data } = await api.get(`/certificates/verify/${route.params.certificateCode}`)
    verification.value = data
  } catch (error) {
    verification.value = {
      valid: false,
      expired: false,
      certificate: null,
      verification_date: null,
      message: error?.response?.data?.message || 'No pudimos validar el certificado.',
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadVerification)
</script>

<style scoped>
.verification-page {
  min-height: 100vh;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top left, rgba(108, 92, 231, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(0, 206, 201, 0.18), transparent 22%),
    #0e1024;
}

.verification-shell {
  max-width: 980px;
  margin: 0 auto;
}

.verification-card {
  border-radius: 28px;
  padding: 28px;
  background: rgba(12, 16, 40, 0.94);
  border-color: rgba(255, 255, 255, 0.08);
}

.verification-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.result-banner {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-radius: 18px;
  margin-bottom: 22px;
  background: rgba(35, 214, 143, 0.12);
  border: 1px solid rgba(35, 214, 143, 0.24);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.result-panel {
  min-height: 220px;
  padding: 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.panel-label {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.58);
}

.panel-value {
  margin-top: 6px;
  font-size: 1.08rem;
  font-weight: 700;
}

.code {
  word-break: break-word;
}

@media (max-width: 768px) {
  .verification-card {
    padding: 22px 18px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
