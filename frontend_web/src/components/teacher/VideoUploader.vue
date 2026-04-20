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

    <q-uploader
      ref="uploaderRef"
      flat
      bordered
      square
      hide-upload-button
      no-thumbnails
      auto-expand
      :max-files="1"
      :accept="accept"
      :disable="uploading || !courseId"
      :label="courseId ? 'Selecciona un archivo pesado' : 'Primero elige un curso'"
      @added="handleFilesAdded"
      @removed="handleFilesRemoved"
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
        <q-btn flat no-caps color="grey-5" label="Limpiar" :disable="uploading" @click="resetUpload" />
        <q-btn
          color="primary"
          no-caps
          label="Subir archivo"
          :disable="!selectedFile || uploading || !courseId"
          :loading="uploading"
          @click="uploadFile"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from 'src/services/api'

const props = defineProps({
  endpoint: { type: String, required: true },
  courseId: { type: Number, default: null },
  label: { type: String, default: 'Carga de archivo' },
  helperText: {
    type: String,
    default: 'La carga se fragmenta en chunks de 10 MB para evitar errores 413 y cortes por timeout.',
  },
  accept: { type: String, default: '' },
  maxBytes: { type: Number, default: 1024 * 1024 * 1024 },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'uploaded', 'error', 'cleared'])

const uploaderRef = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const progress = ref(0)
const uploadToken = ref(props.modelValue || '')
const statusText = ref('Sin archivo cargado todavía.')

watch(
  () => props.modelValue,
  (value) => {
    uploadToken.value = value || ''
  },
)

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
  uploaderRef.value?.reset?.()
  emit('update:modelValue', '')
  emit('cleared')
}

function handleFilesRemoved() {
  if (!uploading.value) {
    selectedFile.value = null
    progress.value = 0
    statusText.value = uploadToken.value
      ? 'Archivo cargado y listo para adjuntar.'
      : 'Sin archivo cargado todavía.'
  }
}

function handleFilesAdded(files) {
  const [file] = files || []
  const actualFile = file?.__file || file

  if (!actualFile) {
    handleFilesRemoved()
    return
  }

  if (actualFile.size > props.maxBytes) {
    statusText.value = `El archivo supera el máximo permitido (${formatBytes(props.maxBytes)}).`
    uploaderRef.value?.reset?.()
    selectedFile.value = null
    emit('error', statusText.value)
    return
  }

  selectedFile.value = actualFile
  uploadToken.value = ''
  progress.value = 0
  statusText.value = 'Archivo listo para subir en chunks de 10 MB.'
  emit('update:modelValue', '')
}

async function postChunk(formData, chunkIndex, totalChunks) {
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await api.post(props.endpoint, formData, {
        headers: {
          Accept: 'application/json',
          'Content-Type': undefined,
        },
        timeout: 180000,
        transformRequest: [(data, headers) => {
          if (headers) {
            delete headers['Content-Type']
          }

          return data
        }],
        onUploadProgress: (event) => {
          const chunkProgress = event.total ? (event.loaded / event.total) : 0
          const combined = ((chunkIndex + chunkProgress) / totalChunks) * 100
          progress.value = Math.min(99, Math.round(combined))
        },
      })
    } catch (error) {
      if (error?.response?.status === 422) {
        throw error
      }

      lastError = error
      statusText.value = `Reintentando chunk ${chunkIndex + 1}/${totalChunks} (intento ${attempt + 1}/3)...`
    }
  }

  throw lastError
}

async function uploadFile() {
  if (!selectedFile.value || !props.courseId) return

  const uploadId = globalThis.crypto?.randomUUID?.() || `upload-${Date.now()}`

  uploading.value = true
  progress.value = 0
  statusText.value = 'Preparando carga por partes...'

  try {
    const chunkSizes = [10 * 1024 * 1024, 1024 * 1024]
    let completionPayload = null
    let uploadCompleted = false
    let lastError = null

    for (const chunkSize of chunkSizes) {
      try {
        const totalChunks = Math.ceil(selectedFile.value.size / chunkSize)
        const modeLabel = chunkSize >= 10 * 1024 * 1024 ? '10 MB' : '1 MB'
        progress.value = 0
        statusText.value = `Subiendo en chunks de ${modeLabel}...`

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
          const start = chunkIndex * chunkSize
          const end = Math.min(start + chunkSize, selectedFile.value.size)
          const chunk = selectedFile.value.slice(start, end)
          const chunkFile = new File(
            [chunk],
            selectedFile.value.name,
            { type: chunk.type || selectedFile.value.type || 'application/octet-stream' },
          )
          const formData = new FormData()

          formData.append('course_id', String(props.courseId))
          formData.append('upload_id', uploadId)
          formData.append('chunk_index', String(chunkIndex))
          formData.append('total_chunks', String(totalChunks))
          formData.append('file_name', selectedFile.value.name)
          formData.append('file_size', String(selectedFile.value.size))
          formData.append('mime_type', chunkFile.type || selectedFile.value.type || 'application/octet-stream')
          formData.append('chunk', chunkFile)

          statusText.value = `Subiendo chunk ${chunkIndex + 1} de ${totalChunks} (${modeLabel})...`

          const { data } = await postChunk(formData, chunkIndex, totalChunks)
          progress.value = Math.max(progress.value, Math.round(((chunkIndex + 1) / totalChunks) * 100))

          if (data?.status === 'completed') {
            completionPayload = data
          }
        }

        uploadCompleted = true
        break
      } catch (error) {
        lastError = error

        const errors = error?.response?.data?.errors
        const firstKey = errors ? Object.keys(errors)[0] : null
        const message = firstKey && errors[firstKey]?.length
          ? errors[firstKey][0]
          : (error?.response?.data?.message || '')

        if (message !== 'validation.uploaded' || chunkSize === chunkSizes.at(-1)) {
          throw error
        }

        statusText.value = 'El servidor rechazó el chunk de 10 MB. Reintentando automáticamente con chunks de 1 MB...'
      }
    }

    if (!uploadCompleted && lastError) {
      throw lastError
    }

    progress.value = 100
    uploadToken.value = completionPayload?.upload_token || uploadId
    statusText.value = 'Archivo cargado y listo para adjuntar a la lección.'
    emit('update:modelValue', uploadToken.value)
    emit('uploaded', completionPayload?.file || { token: uploadToken.value, file_name: selectedFile.value.name })
  } catch (error) {
    const errors = error?.response?.data?.errors
    const firstKey = errors ? Object.keys(errors)[0] : null
    const message = firstKey && errors[firstKey]?.length
      ? errors[firstKey][0]
      : (error?.response?.data?.message || 'No se pudo subir el archivo.')
    statusText.value = message
    progress.value = 0
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
