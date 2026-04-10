<template>
  <q-page class="certificates-page q-pa-xl" style="max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Mis certificados</h2>
        <p class="q-mb-none">Certificados de cursos completados</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
    </div>

    <!-- Stats -->
    <div class="row q-gutter-lg q-mb-xl">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #00b894">
              {{ certificates.length }}
            </div>
            <div style="color: #8b8ba7">Certificados totales</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #6c5ce7">
              {{ recentCertificates.length }}
            </div>
            <div style="color: #8b8ba7">Este año</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="glass-card q-pa-lg stats-card">
          <div class="text-center">
            <div class="text-h3 text-weight-bold" style="color: #ff9f43">
              {{ uniqueCourses.length }}
            </div>
            <div style="color: #8b8ba7">Cursos certificados</div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Certificates List -->
    <div v-if="loading" class="q-py-xl">
      <div v-for="n in 3" :key="n" class="q-mb-lg">
        <q-skeleton type="rect" height="100px" dark style="border-radius: 8px" />
      </div>
    </div>

    <div v-else-if="certificates.length === 0" class="text-center q-py-xl">
      <q-icon name="mdi-certificate-outline" size="96px" color="grey-7" />
      <h3 class="q-mt-md" style="color: #8b8ba7">Aún no tienes certificados</h3>
      <p style="color: #8b8ba7">Completa cursos para obtener certificados.</p>
      <q-btn
        class="btn-gradient q-mt-md"
        no-caps
        label="Explorar cursos"
        icon="explore"
        to="/catalog"
      />
    </div>

    <div v-else class="certificates-list">
      <div
        v-for="cert in certificates"
        :key="cert.id"
        class="certificate-item glass-card q-pa-lg q-mb-lg"
      >
        <div class="row items-center q-gutter-md">
          <q-avatar size="80px" color="green" text-color="white">
            <q-icon name="mdi-certificate" size="40px" />
          </q-avatar>

          <div class="col">
            <div class="row items-center q-mb-xs">
              <h3 style="font-size: 1.2rem" class="q-mr-md">{{ cert.course.title }}</h3>
              <q-badge color="positive" label="Completado" />
            </div>

            <div style="color: #8b8ba7; font-size: 0.9rem" class="q-mb-xs">
              Código: <span class="text-weight-medium">{{ cert.certificate_code }}</span>
            </div>

            <div style="color: #5a5a7a; font-size: 0.85rem">
              <q-icon name="mdi-calendar" size="12px" class="q-mr-xs" />
              Emitido: {{ formatDate(cert.issued_at) }}
              <span class="q-mx-sm">•</span>
              <q-icon name="mdi-account" size="12px" class="q-mr-xs" />
              Instructor: {{ cert.course.instructor?.name }}
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              flat
              no-caps
              label="Ver"
              icon="mdi-eye"
              color="primary"
              @click="$router.push('/certificates/' + cert.id)"
            />
            <q-btn
              flat
              no-caps
              label="Descargar"
              icon="mdi-download"
              color="primary"
              @click="downloadCertificate(cert)"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from 'src/services/api'

const loading = ref(true)
const certificates = ref([])

const recentCertificates = computed(() => {
  const currentYear = new Date().getFullYear()
  return certificates.value.filter((cert) => {
    const certYear = new Date(cert.issued_at).getFullYear()
    return certYear === currentYear
  })
})

const uniqueCourses = computed(() => {
  const courseIds = new Set()
  certificates.value.forEach((cert) => courseIds.add(cert.course_id))
  return Array.from(courseIds)
})

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function downloadCertificate(cert) {
  try {
    const response = await api.get(`/certificates/${cert.id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `certificado-${cert.certificate_code}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('Error descargando certificado:', error)
  }
}

async function loadCertificates() {
  try {
    const { data } = await api.get('/certificates')
    certificates.value = data.data || data || []
  } catch (error) {
    console.error('Error cargando certificados:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCertificates()
})
</script>

<style lang="scss" scoped>
.certificates-page {
  .stats-card {
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }

  .certificate-item {
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 8px 30px rgba(0, 184, 148, 0.2);
    }
  }
}
</style>
