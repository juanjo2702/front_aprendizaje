<template>
  <q-page class="certificate-detail-page" data-cy="certificate-detail-page">
    <div class="page-head">
      <div>
        <div class="text-overline text-secondary">Certificados</div>
        <div class="text-h4 text-weight-bold">Vista previa del certificado</div>
        <div class="text-body2 text-grey-5">
          Revisa el diseño final, valida el código y descarga el PDF real.
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn flat no-caps icon="arrow_back" label="Volver" @click="router.push({ name: 'student-certificates-vault' })" />
        <q-btn color="secondary" no-caps icon="visibility" label="Abrir en pestaña" :disable="!previewDocumentUrl" @click="openPreviewTab" />
        <q-btn color="amber-8" text-color="white" no-caps icon="print" label="Imprimir horizontal" :disable="!certificate" @click="printCertificate" />
        <q-btn color="primary" no-caps icon="download" label="Descargar PDF" :loading="downloading" @click="downloadCertificate" />
      </div>
    </div>

    <div v-if="loading" class="loading-shell">
      <q-spinner color="primary" size="52px" />
      <div class="text-subtitle1 q-mt-md">Cargando certificado...</div>
    </div>

    <div v-else-if="!certificate" class="loading-shell">
      <q-icon name="error_outline" color="negative" size="64px" />
      <div class="text-h6 q-mt-md">No encontramos este certificado</div>
      <q-btn class="q-mt-md" color="primary" no-caps label="Volver a la bóveda" @click="router.push({ name: 'student-certificates-vault' })" />
    </div>

    <div v-else class="detail-grid">
      <q-card flat bordered class="certificate-card preview-card">
        <div class="preview-toolbar">
          <div>
            <div class="text-subtitle1 text-weight-bold">Documento en pantalla</div>
            <div class="text-caption text-grey-5">La previsualización usa el template vivo del backend, no una copia vieja en storage.</div>
          </div>
          <q-badge color="positive" label="Vista viva" />
        </div>

        <iframe
          v-if="previewDocumentUrl"
          :src="previewDocumentUrl"
          class="certificate-frame"
          title="Vista previa del certificado"
        />

        <div v-else class="frame-fallback">
          <q-icon name="description" size="48px" color="grey-6" />
          <div class="text-subtitle2 q-mt-sm">No pudimos renderizar la vista previa.</div>
          <q-btn class="q-mt-md" color="secondary" no-caps label="Intentar de nuevo" @click="loadPreview" />
        </div>
      </q-card>

      <q-card flat bordered class="certificate-card info-card">
        <div class="info-block">
          <div class="info-label">Curso</div>
          <div class="info-value">{{ certificate.course?.title }}</div>
        </div>

        <div class="info-block">
          <div class="info-label">Participante</div>
          <div class="info-value">{{ certificate.user?.name || authStore.user?.name }}</div>
        </div>

        <div class="info-block">
          <div class="info-label">Instructor</div>
          <div class="info-value">{{ certificate.course?.instructor?.name || 'No disponible' }}</div>
        </div>

        <div class="info-block">
          <div class="info-label">Código</div>
          <div class="info-value code">{{ certificate.certificate_code }}</div>
        </div>

        <div class="info-block">
          <div class="info-label">Emitido</div>
          <div class="info-value">{{ formatDate(certificate.issued_at) }}</div>
        </div>

        <div class="info-actions">
          <q-btn
            outline
            color="secondary"
            no-caps
            icon="verified"
            label="Ver validación pública"
            @click="openVerification"
          />
          <q-btn
            flat
            color="secondary"
            no-caps
            icon="content_copy"
            label="Copiar enlace"
            @click="copyValidationLink"
          />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(true)
const downloading = ref(false)
const certificate = ref(null)
const previewDocumentUrl = ref('')

function formatDate(value) {
  if (!value) return 'No disponible'
  return new Date(value).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function revokePreviewUrl() {
  if (previewDocumentUrl.value) {
    window.URL.revokeObjectURL(previewDocumentUrl.value)
    previewDocumentUrl.value = ''
  }
}

async function loadPreview() {
  revokePreviewUrl()

  try {
    const { data } = await api.get(`/certificates/${route.params.id}/preview?embedded=1`, {
      responseType: 'text',
      headers: {
        Accept: 'text/html',
      },
    })

    previewDocumentUrl.value = window.URL.createObjectURL(
      new Blob([data], { type: 'text/html;charset=utf-8' })
    )
  } catch (error) {
    console.error('Error cargando vista previa del certificado:', error)
    $q.notify({
      type: 'negative',
      message: 'No pudimos generar la vista previa del certificado.',
    })
  }
}

async function downloadCertificate() {
  downloading.value = true

  try {
    const { data } = await api.get(`/certificates/${route.params.id}/download`, {
      responseType: 'blob',
    })

    const fileUrl = window.URL.createObjectURL(
      new Blob([data], { type: 'application/pdf' })
    )
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = `certificado-${certificate.value.certificate_code}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(fileUrl)

    $q.notify({ type: 'positive', message: 'El certificado se descargó correctamente.' })
  } catch (error) {
    console.error('Error descargando certificado:', error)
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No pudimos descargar el certificado.',
    })
  } finally {
    downloading.value = false
  }
}

function openPreviewTab() {
  if (!previewDocumentUrl.value) return
  window.open(previewDocumentUrl.value, '_blank', 'noopener')
}

async function printCertificate() {
  if (!certificate.value) return

  try {
    const { data } = await api.get(`/certificates/${certificate.value.id}/preview?print=1&embedded=1`, {
      responseType: 'text',
      headers: {
        Accept: 'text/html',
      },
    })

    const printUrl = window.URL.createObjectURL(
      new Blob([data], { type: 'text/html;charset=utf-8' })
    )

    window.open(printUrl, '_blank', 'noopener')
  } catch (error) {
    console.error('Error abriendo impresión del certificado:', error)
    $q.notify({
      type: 'negative',
      message: 'No pudimos abrir la impresión horizontal del certificado.',
    })
  }
}

function openVerification() {
  if (!certificate.value) return
  window.open(`/certificates/verify/${certificate.value.certificate_code}`, '_blank', 'noopener')
}

async function copyValidationLink() {
  if (!certificate.value) return

  await copyToClipboard(`${window.location.origin}/certificates/verify/${certificate.value.certificate_code}`)
  $q.notify({ type: 'positive', message: 'Enlace de validación copiado.' })
}

async function loadCertificate() {
  loading.value = true

  try {
    const { data } = await api.get(`/certificates/${route.params.id}`)
    certificate.value = data.data || data
    await loadPreview()
  } catch (error) {
    console.error('Error cargando certificado:', error)
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No pudimos cargar el certificado.',
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadCertificate)
onBeforeUnmount(revokePreviewUrl)
</script>

<style scoped>
.certificate-detail-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.loading-shell {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(320px, 0.85fr);
  gap: 20px;
}

.certificate-card {
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.preview-card {
  padding: 18px;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.certificate-frame {
  width: 100%;
  min-height: 920px;
  border: 0;
  border-radius: 18px;
  background: #fff;
}

.frame-fallback {
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.info-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.56);
}

.info-value {
  font-size: 1.02rem;
  font-weight: 700;
}

.code {
  word-break: break-word;
}

.info-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .certificate-detail-page {
    padding: 20px;
  }

  .page-head,
  .preview-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .certificate-frame {
    min-height: 680px;
  }
}
</style>
