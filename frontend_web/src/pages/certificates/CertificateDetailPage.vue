<template>
  <q-page class="certificate-detail-page q-pa-xl" style="max-width: 1000px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Detalle de certificado</h2>
        <p class="q-mb-none">Verifica y descarga tu certificado</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver a certificados" to="/certificates" />
    </div>

    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <div v-else-if="!certificate" class="text-center q-py-xl">
      <q-icon name="mdi-certificate-off" size="96px" color="grey-7" />
      <h3 class="q-mt-md" style="color: #8b8ba7">Certificado no encontrado</h3>
      <q-btn class="q-mt-md" no-caps label="Volver" to="/certificates" />
    </div>

    <div v-else>
      <!-- Certificate Preview -->
      <q-card class="glass-card q-pa-lg q-mb-lg">
        <div
          class="text-center q-pa-xl"
          style="border: 2px dashed rgba(0, 184, 148, 0.3); border-radius: 12px"
        >
          <q-icon name="mdi-certificate" size="80px" color="green" class="q-mb-md" />
          <h2 class="q-mb-md">Certificado de finalización</h2>
          <h3 class="q-mb-md" style="color: #6c5ce7">{{ certificate.course.title }}</h3>

          <div class="q-mb-lg">
            <div class="text-h5 q-mb-xs">Otorgado a:</div>
            <div class="text-h4 text-weight-bold">{{ auth.user?.name }}</div>
          </div>

          <div class="row justify-center q-gutter-xl q-mb-lg">
            <div class="text-center">
              <div style="color: #8b8ba7">Código</div>
              <div class="text-h6">{{ certificate.certificate_code }}</div>
            </div>
            <div class="text-center">
              <div style="color: #8b8ba7">Fecha de emisión</div>
              <div class="text-h6">{{ formatDate(certificate.issued_at) }}</div>
            </div>
            <div class="text-center">
              <div style="color: #8b8ba7">Instructor</div>
              <div class="text-h6">{{ certificate.course.instructor?.name }}</div>
            </div>
          </div>

          <div class="q-mb-lg">
            <p>
              Este certificado acredita la finalización exitosa del curso
              <strong>{{ certificate.course.title }}</strong> con una calificación satisfactoria.
            </p>
          </div>

          <div class="row justify-center q-gutter-md">
            <q-btn
              color="primary"
              icon="mdi-download"
              label="Descargar PDF"
              @click="downloadCertificate"
            />
            <q-btn flat no-caps label="Compartir" icon="mdi-share" color="primary" />
            <q-btn
              flat
              no-caps
              label="Verificar públicamente"
              icon="mdi-shield-check"
              color="positive"
            />
          </div>
        </div>
      </q-card>

      <!-- Course Info -->
      <q-card class="glass-card q-pa-lg">
        <h3 class="q-mb-md">Información del curso</h3>
        <div class="row items-center q-gutter-md q-mb-md">
          <q-avatar size="60px" rounded>
            <img
              :src="
                certificate.course.thumbnail ||
                'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
              "
            />
          </q-avatar>
          <div>
            <div class="text-weight-medium">{{ certificate.course.title }}</div>
            <div style="color: #8b8ba7; font-size: 0.9rem">
              {{ certificate.course.description?.substring(0, 100) }}...
            </div>
          </div>
        </div>
        <div class="row q-gutter-md">
          <div class="col-6">
            <div style="color: #8b8ba7">Duración</div>
            <div>{{ certificate.course.total_hours || '--' }} horas</div>
          </div>
          <div class="col-6">
            <div style="color: #8b8ba7">Lecciones</div>
            <div>{{ certificate.course.total_lessons || '--' }} lecciones</div>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const loading = ref(true)
const certificate = ref(null)

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function downloadCertificate() {
  try {
    const response = await api.get(`/certificates/${certificate.value.id}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `certificado-${certificate.value.certificate_code}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('Error descargando certificado:', error)
  }
}

async function loadCertificate() {
  const certId = route.params.id
  try {
    const { data } = await api.get(`/certificates/${certId}`)
    certificate.value = data.data || data
  } catch (error) {
    console.error('Error cargando certificado:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCertificate()
})
</script>
