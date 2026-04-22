<template>
  <q-page class="student-page" data-cy="student-certificates-page">
    <div class="section-head">
      <div>
        <div class="text-h4 text-weight-bold">Boveda de certificados</div>
        <div class="text-caption text-grey-5">Cursos completados al 100%, descarga y validacion rapida.</div>
      </div>
    </div>

    <q-card flat bordered class="vault-card">
      <q-table
        flat
        dark
        row-key="id"
        :rows="certificates"
        :columns="columns"
        :loading="inventoryLoading"
        hide-pagination
      >
        <template #body-cell-issued_at="props">
          <q-td :props="props">{{ formatDate(props.row.issued_at) }}</q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <div class="row q-gutter-sm">
              <q-btn flat color="primary" no-caps icon="download" :data-cy="`certificate-download-btn-${props.row.id}`" label="Descargar" @click="downloadCertificate(props.row)" />
              <q-btn flat color="secondary" no-caps icon="content_copy" label="Copiar enlace" @click="copyValidationLink(props.row)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { api } from 'src/services/api'
import { useStudentStore } from 'src/stores/student'

const $q = useQuasar()
const studentStore = useStudentStore()
const { certificates, inventoryLoading } = storeToRefs(studentStore)

const columns = [
  { name: 'course', label: 'Curso', field: (row) => row.course?.title, align: 'left' },
  { name: 'certificate_code', label: 'Codigo', field: 'certificate_code', align: 'left' },
  { name: 'issued_at', label: 'Emitido', field: 'issued_at', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' },
]

onMounted(() => {
  studentStore.loadInventory()
})

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function downloadCertificate(certificate) {
  try {
    const { data } = await api.get(`/certificates/${certificate.id}/download`)
    $q.notify({ type: 'positive', message: data?.message || 'Descarga preparada.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.response?.data?.message || 'No se pudo preparar la descarga.' })
  }
}

async function copyValidationLink(certificate) {
  const validationUrl = `${window.location.origin}/certificates/verify/${certificate.certificate_code}`
  await copyToClipboard(validationUrl)
  $q.notify({ type: 'positive', message: 'Enlace de validacion copiado.' })
}
</script>

<style scoped>
.student-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.vault-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 12px;
}
</style>
