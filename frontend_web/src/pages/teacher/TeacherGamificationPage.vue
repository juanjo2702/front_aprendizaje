<template>
  <q-page class="q-pa-xl page-wrap">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Configurador de Gamificación</h2>
        <p class="q-mb-none">Crea y edita reglas de juego ligadas a tus cursos, módulos y lecciones.</p>
      </div>
      <q-btn color="primary" no-caps icon="add" label="Nueva regla" @click="openDialog()" :disable="!selectedCourseId" />
    </div>

    <q-card class="glass-card q-pa-md q-mb-lg">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-select v-model="selectedCourseId" :options="courseOptions" emit-value map-options label="Curso" outlined dense @update:model-value="handleCourseChange" />
        </div>
        <div class="col-12 col-md-6">
          <q-btn flat no-caps color="grey-4" label="Recargar" @click="reloadPageData" :disable="!selectedCourseId" />
        </div>
      </div>
    </q-card>

    <div v-if="loading" class="q-py-md">
      <q-skeleton v-for="n in 3" :key="n" type="rect" height="110px" class="q-mb-md" dark />
    </div>
    <div v-else-if="!selectedCourseId" class="text-center q-py-xl">
      <q-icon name="sports_esports" size="72px" color="grey-6" />
      <div class="text-h6 q-mt-md">Selecciona un curso</div>
    </div>
    <div v-else-if="!configs.length" class="text-center q-py-xl">
      <q-icon name="casino" size="72px" color="grey-6" />
      <div class="text-h6 q-mt-md">Este curso no tiene reglas todavía</div>
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="config in configs" :key="config.id" class="glass-card q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-7">
            <div class="text-subtitle1 text-weight-bold">{{ config.title }}</div>
            <div class="text-caption text-grey-5">
              {{ config.game_type?.name || 'Sin tipo' }} · {{ scopeLabel(config) }}
            </div>
            <div class="text-caption text-grey-6">
              Puntaje máx: {{ config.max_score }} · Tiempo: {{ config.time_limit || 'Sin límite' }} · Intentos: {{ config.max_attempts || 'Ilimitados' }}
            </div>
          </div>
          <div class="col-12 col-md-5 row justify-end q-gutter-sm">
            <q-btn flat no-caps color="primary" icon="edit" label="Editar" @click="openDialog(config)" />
            <q-btn flat no-caps color="negative" icon="delete" label="Eliminar" @click="removeConfig(config)" />
          </div>
        </div>
      </q-card>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ editingConfig ? 'Editar regla' : 'Nueva regla' }}</div>
          <q-btn flat round dense icon="close" @click="closeDialog" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12"><q-input v-model="form.title" label="Título" outlined dense /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.game_type_id" :options="gameTypeOptions" emit-value map-options label="Tipo de juego" outlined dense /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.scope" :options="scopeOptions" emit-value map-options label="Ámbito" outlined dense @update:model-value="syncScope" /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.module_id" :options="moduleOptions" emit-value map-options label="Módulo" outlined dense clearable :disable="form.scope === 'course'" @update:model-value="syncLessons" /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.lesson_id" :options="lessonOptions" emit-value map-options label="Lección" outlined dense clearable :disable="form.scope !== 'lesson'" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="form.max_score" type="number" label="Puntaje máximo" outlined dense min="1" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="form.time_limit" type="number" label="Tiempo (seg)" outlined dense min="1" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="form.max_attempts" type="number" label="Intentos" outlined dense min="1" /></div>
            <div class="col-12"><q-input v-model="form.config_text" type="textarea" label="Configuración JSON" outlined autogrow /></div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeDialog" />
          <q-btn color="primary" no-caps :loading="saving" label="Guardar" @click="saveConfig" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const editingConfig = ref(null)
const selectedCourseId = ref(null)
const courses = ref([])
const configs = ref([])
const gameTypes = ref([])
const structure = ref(null)
const form = ref(emptyForm())

const scopeOptions = [{ label: 'Curso', value: 'course' }, { label: 'Módulo', value: 'module' }, { label: 'Lección', value: 'lesson' }]
const courseOptions = computed(() => courses.value.map((course) => ({ label: course.title, value: course.id })))
const gameTypeOptions = computed(() => gameTypes.value.map((type) => ({ label: type.name, value: type.id })))
const moduleOptions = computed(() => (structure.value?.modules || []).map((module) => ({ label: module.title, value: module.id })))
const lessonOptions = computed(() => {
  if (!form.value.module_id) return []
  const module = (structure.value?.modules || []).find((item) => item.id === form.value.module_id)
  return (module?.lessons || []).map((lesson) => ({ label: lesson.title, value: lesson.id }))
})

function emptyForm() {
  return {
    title: '',
    game_type_id: null,
    scope: 'course',
    module_id: null,
    lesson_id: null,
    max_score: 100,
    time_limit: 300,
    max_attempts: 3,
    config_text: JSON.stringify({ difficulty: 'medium', rewards: { points: 100 } }, null, 2),
  }
}

function formatError(error, fallback) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length) return errors[firstKey][0]
  }
  return error?.response?.data?.message || error?.message || fallback
}

function scopeLabel(config) {
  if (config.lesson?.title) return `Lección: ${config.lesson.title}`
  if (config.module?.title) return `Módulo: ${config.module.title}`
  return 'Nivel curso'
}

function syncLessons() {
  if (!lessonOptions.value.some((lesson) => lesson.value === form.value.lesson_id)) {
    form.value.lesson_id = null
  }
}

function syncScope() {
  if (form.value.scope === 'course') {
    form.value.module_id = null
    form.value.lesson_id = null
  } else if (form.value.scope === 'module') {
    form.value.lesson_id = null
  }
}

function parseConfig() {
  try {
    return form.value.config_text?.trim() ? JSON.parse(form.value.config_text) : {}
  } catch {
    throw new Error('La configuración JSON no es válida.')
  }
}

async function loadCourses() {
  const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
  courses.value = data?.data || []
  if (!selectedCourseId.value && courses.value.length) selectedCourseId.value = courses.value[0].id
}

async function loadGameTypes() {
  const { data } = await api.get('/game-types')
  gameTypes.value = data || []
}

async function loadStructure() {
  if (!selectedCourseId.value) return
  const { data } = await api.get(`/instructor/courses/${selectedCourseId.value}/structure`)
  structure.value = data
}

async function loadConfigs() {
  if (!selectedCourseId.value) return
  const { data } = await api.get('/game-configurations', { params: { course_id: selectedCourseId.value, per_page: 100 } })
  configs.value = data?.data || []
}

async function handleCourseChange() {
  await reloadPageData()
}

async function reloadPageData() {
  if (!selectedCourseId.value) return
  loading.value = true
  try {
    await Promise.all([loadStructure(), loadConfigs()])
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo cargar la gamificación.') })
  } finally {
    loading.value = false
  }
}

function openDialog(config = null) {
  editingConfig.value = config
  if (config) {
    form.value = {
      title: config.title || '',
      game_type_id: config.game_type_id || config.game_type?.id || null,
      scope: config.lesson_id ? 'lesson' : config.module_id ? 'module' : 'course',
      module_id: config.module_id || null,
      lesson_id: config.lesson_id || null,
      max_score: Number(config.max_score || 100),
      time_limit: Number(config.time_limit || 300),
      max_attempts: Number(config.max_attempts || 3),
      config_text: JSON.stringify(config.config || {}, null, 2),
    }
  } else {
    form.value = emptyForm()
  }
  dialog.value = true
}

function closeDialog() {
  if (!saving.value) {
    dialog.value = false
    editingConfig.value = null
    form.value = emptyForm()
  }
}

async function saveConfig() {
  saving.value = true
  try {
    const payload = {
      title: form.value.title?.trim(),
      game_type_id: form.value.game_type_id,
      course_id: selectedCourseId.value,
      module_id: form.value.scope === 'course' ? null : form.value.module_id || null,
      lesson_id: form.value.scope === 'lesson' ? form.value.lesson_id || null : null,
      config: parseConfig(),
      max_score: Number(form.value.max_score || 100),
      time_limit: form.value.time_limit ? Number(form.value.time_limit) : null,
      max_attempts: form.value.max_attempts ? Number(form.value.max_attempts) : null,
      is_active: true,
    }
    const wasEditing = Boolean(editingConfig.value)
    if (wasEditing) await api.put(`/game-configurations/${editingConfig.value.id}`, payload)
    else await api.post('/game-configurations', payload)
    await reloadPageData()
    closeDialog()
    $q.notify({ type: 'positive', message: wasEditing ? 'Regla actualizada correctamente.' : 'Regla creada correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar la regla.') })
  } finally {
    saving.value = false
  }
}

async function removeConfig(config) {
  try {
    await api.delete(`/game-configurations/${config.id}`)
    await loadConfigs()
    $q.notify({ type: 'positive', message: 'Regla eliminada correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo eliminar la regla.') })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadCourses(), loadGameTypes()])
    await reloadPageData()
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo iniciar la pantalla de gamificación.') })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
.dialog-card { width: min(900px, 92vw); max-width: 92vw; }
</style>
