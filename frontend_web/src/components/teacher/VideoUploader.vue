<template>
  <q-card flat bordered class="uploader-shell q-pa-md">
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-bold">{{ label }}</div>
        <div class="text-caption text-grey-5">{{ helperText }}</div>
      </div>
      <q-chip v-if="uploadToken" color="positive" text-color="white" icon="task_alt">
        Cargado
      </q-chip>
    </div>

    <q-file
      v-model="selectedFile"
      outlined
      dense
      use-chips
      clearable
      :accept="accept"
      :disable="uploading || !courseId"
      :label="courseId ? 'Selecciona un archivo' : 'Primero elige un curso'"
      @update:model-value="handleFileSelection"
    />

    <div v-if="selectedFile" class="text-caption text-grey-5 q-mt-sm">
      {{ selectedFile.name }} · {{ formatBytes(selectedFile.size) }}
    </div>

    <q-linear-progress
      v-if="uploading || progress > 0"
      class="q-mt-md"
      size="12px"
      rounded
      color="secondary"
      :value="progress / 100"
    />

    <div class="row items-center justify-between q-mt-md">
      <div class="text-caption text-grey-5">
        {{ statusText }}
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps color="grey-5" label="Limpiar" :disable="uploading && !uploadToken" @click="resetUpload" />
        <q-btn color="primary" no-caps label="Subir archivo" :disable="!selectedFile || uploading || !courseId" :loading="uploading" @click="uploadFile" />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { api } from 'src/services/api'

const props = defineProps({
  endpoint: { type: String, required: true },
  courseId: { type: Number, default: null },
  label: { type: String, default: 'Carga de archivo' },
  helperText: { type: String, default: 'La carga se procesa en chunks para que no se pierda si falla la red.' },
  accept: { type: String, default: '' },
  maxBytes: { type: Number, default: 1024 * 1024 * 1024 },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'uploaded', 'error', 'cleared'])

const selectedFile = ref(null)
const uploading = ref(false)
const progress = ref(0)
const uploadToken = ref(props.modelValue || '')
const statusText = ref('Sin archivo cargado todavía.')

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function resetUpload() {
  selectedFile.value = null
  uploadToken.value = ''
  progress.value = 0
  statusText.value = 'Sin archivo cargado todavía.'
  emit('update:modelValue', '')
  emit('cleared')
}

function handleFileSelection(file) {
  if (!file) {
    resetUpload()
    return
  }

  if (file.size > props.maxBytes) {
    statusText.value = `El archivo supera el máximo permitido (${formatBytes(props.maxBytes)}).`
    emit('error', statusText.value)
    selectedFile.value = null
    return
  }

  statusText.value = 'Archivo listo para subir.'
}

async function uploadFile() {
  if (!selectedFile.value || !props.courseId) return

  const chunkSize = 10 * 1024 * 1024
  const totalChunks = Math.ceil(selectedFile.value.size / chunkSize)
  const uploadId = globalThis.crypto?.randomUUID?.() || `upload-${Date.now()}`

  uploading.value = true
  progress.value = 0
  statusText.value = 'Preparando carga por partes...'

  try {
    let completionPayload = null

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, selectedFile.value.size)
      const chunk = selectedFile.value.slice(start, end)
      const formData = new FormData()
      formData.append('course_id', String(props.courseId))
      formData.append('upload_id', uploadId)
      formData.append('chunk_index', String(chunkIndex))
      formData.append('total_chunks', String(totalChunks))
      formData.append('file_name', selectedFile.value.name)
      formData.append('mime_type', selectedFile.value.type || 'application/octet-stream')
      formData.append('chunk', chunk, selectedFile.value.name)

      const { data } = await api.post(props.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })

      progress.value = Math.round(((chunkIndex + 1) / totalChunks) * 100)
      statusText.value = `Subiendo chunk ${chunkIndex + 1} de ${totalChunks}...`

      if (data?.status === 'completed') {
        completionPayload = data
      }
    }

    uploadToken.value = completionPayload?.upload_token || uploadId
    statusText.value = 'Archivo cargado y listo para adjuntar a la lección.'
    emit('update:modelValue', uploadToken.value)
    emit('uploaded', completionPayload?.file || { token: uploadToken.value, file_name: selectedFile.value.name })
  } catch (error) {
    const message = error?.response?.data?.message || 'No se pudo subir el archivo.'
    statusText.value = message
    emit('error', message)
  } finally {
    uploading.value = false
  }
}

defineExpose({
  resetUpload,
})
</script>

<style scoped>
.uploader-shell {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
}
</style>
