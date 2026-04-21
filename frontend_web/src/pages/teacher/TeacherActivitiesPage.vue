<template>
  <q-page class="q-pa-xl page-wrap">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Gestor de Medios y Actividades</h2>
        <p class="q-mb-none">Aquí afinas la gamificación; los videos y documentos pesados se cargan desde el Course Builder 2.0.</p>
      </div>
      <div class="row q-gutter-sm">
        <q-btn flat no-caps color="secondary" icon="account_tree" label="Ir al Builder" @click="router.push({ name: 'teacher-courses' })" />
        <q-btn color="primary" no-caps icon="add" label="Nueva actividad" @click="openDialog()" :disable="!selectedCourseId" />
      </div>
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
      <q-icon name="extension" size="72px" color="grey-6" />
      <div class="text-h6 q-mt-md">Selecciona un curso</div>
    </div>
    <div v-else-if="!configs.length" class="text-center q-py-xl">
      <q-icon name="build_circle" size="72px" color="grey-6" />
      <div class="text-h6 q-mt-md">Este curso no tiene actividades todavía</div>
    </div>
    <div v-else class="column q-gutter-md">
      <q-card v-for="config in configs" :key="config.id" class="glass-card q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-7">
            <div class="text-subtitle1 text-weight-bold">{{ config.lesson?.title || 'Lección sin nombre' }}</div>
            <div class="text-caption text-grey-5">{{ config.activity_type }} · {{ config.authoring_mode }} · v{{ config.version }}</div>
            <div class="text-caption text-grey-6">
              {{ config.module?.title || 'Sin módulo' }} · {{ config.max_attempts }} intentos · {{ config.passing_score }}% mínimo
            </div>
            <div class="text-caption text-grey-6">
              Recompensa base: {{ config.xp_reward }} XP · {{ config.coin_reward }} monedas
            </div>
          </div>
          <div class="col-12 col-md-5 row justify-end q-gutter-sm">
            <q-btn flat no-caps color="secondary" icon="visibility" label="Previsualizar" @click="previewConfig(config)" :disable="!config.lesson_id" />
            <q-btn flat no-caps color="primary" icon="edit" label="Editar" @click="openDialog(config)" />
            <q-btn flat no-caps color="negative" icon="block" label="Desactivar" @click="removeConfig(config)" />
          </div>
        </div>
      </q-card>
    </div>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ editingConfig ? 'Editar actividad' : 'Nueva actividad' }}</div>
          <q-btn flat round dense icon="close" @click="closeDialog" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6"><q-select v-model="form.module_id" :options="moduleOptions" emit-value map-options label="Módulo" outlined dense @update:model-value="syncLessons" /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.lesson_id" :options="lessonOptions" emit-value map-options label="Lección" outlined dense /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.authoring_mode" :options="authoringOptions" emit-value map-options label="Modo de autoría" outlined dense /></div>
            <div class="col-12 col-md-6"><q-select v-model="form.activity_type" :options="activityTypeOptions" emit-value map-options label="Tipo de actividad" outlined dense /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="form.version" type="number" min="1" label="Versión" outlined dense /></div>
            <div class="col-12 col-md-4 flex flex-center"><q-toggle v-model="form.is_active" label="Activa" color="secondary" /></div>
            <div class="col-12 col-md-4 row justify-end items-center">
              <q-btn flat no-caps color="secondary" icon="auto_fix_high" label="Cargar plantilla" @click="applyActivityTemplate" />
            </div>
            <div class="col-12">
              <q-banner rounded class="bg-dark text-grey-4">
                {{ activityHint }}
              </q-banner>
            </div>
            <div class="col-12"><q-input v-model="form.config_text" type="textarea" label="Configuración JSON" outlined autogrow /></div>
            <div class="col-12">
              <TeacherActivityDraftPreview
                :activity-type="form.activity_type"
                :authoring-mode="form.authoring_mode"
                :config-text="form.config_text"
              />
            </div>
            <div class="col-12">
              <TeacherActivitySettingsPanel
                v-model:max-attempts="form.max_attempts"
                v-model:passing-score="form.passing_score"
                v-model:xp-reward="form.xp_reward"
                v-model:coin-reward="form.coin_reward"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            no-caps
            color="secondary"
            icon="visibility"
            label="Previsualizar"
            :disable="!form.lesson_id"
            @click="previewLesson(form.lesson_id)"
          />
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
import { useRouter } from 'vue-router'
import TeacherActivityDraftPreview from 'src/components/teacher/TeacherActivityDraftPreview.vue'
import TeacherActivitySettingsPanel from 'src/components/teacher/TeacherActivitySettingsPanel.vue'
import { api } from 'src/services/api'
import { buildDefaultActivityConfig } from 'src/utils/activityTemplates'

const $q = useQuasar()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const editingConfig = ref(null)
const selectedCourseId = ref(null)
const courses = ref([])
const configs = ref([])
const structure = ref(null)
const form = ref(emptyForm())

const authoringOptions = [{ label: 'Formulario', value: 'form' }, { label: 'Custom', value: 'custom' }]
const activityTypeOptions = [
  { label: 'Trivia', value: 'trivia' },
  { label: 'Emparejamiento', value: 'matching' },
  { label: 'Crucigrama', value: 'crossword' },
]
const courseOptions = computed(() => courses.value.map((course) => ({ label: course.title, value: course.id })))
const moduleOptions = computed(() => (structure.value?.modules || []).map((module) => ({ label: module.title, value: module.id })))
const activityHint = computed(() => {
  if (form.value.activity_type === 'matching') {
    return '`matching` usa `pairs` con elementos `left/right`.'
  }

  if (form.value.activity_type === 'crossword') {
    return '`crossword` usa `rows`, `cols` y `entries` con `row`, `col`, `direction`, `clue` y `answer`.'
  }

  return '`trivia` usa `questions` con `prompt`, `options` y `points`.'
})
const lessonOptions = computed(() => {
  if (!form.value.module_id) return []
  const module = (structure.value?.modules || []).find((item) => item.id === form.value.module_id)
  return (module?.lessons || []).map((lesson) => ({ label: lesson.title, value: lesson.id }))
})

function emptyForm() {
  return {
    module_id: null,
    lesson_id: null,
    authoring_mode: 'form',
    activity_type: 'trivia',
    version: 1,
    is_active: true,
    max_attempts: 3,
    passing_score: 70,
    xp_reward: 100,
    coin_reward: 25,
    config_text: JSON.stringify(buildDefaultActivityConfig('trivia'), null, 2),
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

function parseConfig() {
  try {
    return form.value.config_text?.trim() ? JSON.parse(form.value.config_text) : {}
  } catch {
    throw new Error('La configuración JSON no es válida.')
  }
}

function syncLessons() {
  if (!lessonOptions.value.some((lesson) => lesson.value === form.value.lesson_id)) {
    form.value.lesson_id = null
  }
}

function previewLesson(lessonId) {
  if (!lessonId) return
  dialog.value = false
  router.push({ name: 'teacher-lesson-preview', params: { lessonId } })
}

function previewConfig(config) {
  previewLesson(config?.lesson_id || config?.lesson?.id)
}

function applyActivityTemplate() {
  form.value.config_text = JSON.stringify(buildDefaultActivityConfig(form.value.activity_type || 'trivia'), null, 2)
}

async function loadCourses() {
  const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
  courses.value = data?.data || []
  if (!selectedCourseId.value && courses.value.length) selectedCourseId.value = courses.value[0].id
}

async function loadStructure() {
  if (!selectedCourseId.value) return
  const { data } = await api.get(`/instructor/courses/${selectedCourseId.value}/structure`)
  structure.value = data
}

async function loadConfigs() {
  if (!selectedCourseId.value) return
  const { data } = await api.get('/interactive-configs', { params: { course_id: selectedCourseId.value, per_page: 100 } })
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
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo cargar actividades.') })
  } finally {
    loading.value = false
  }
}

function openDialog(config = null) {
  editingConfig.value = config
  if (config) {
    form.value = {
      module_id: config.module_id || null,
      lesson_id: config.lesson_id || null,
      authoring_mode: config.authoring_mode || 'form',
      activity_type: config.activity_type || 'trivia',
      version: Number(config.version || 1),
      is_active: Boolean(config.is_active),
      max_attempts: Number(config.max_attempts || 3),
      passing_score: Number(config.passing_score || 70),
      xp_reward: Number(config.xp_reward || 100),
      coin_reward: Number(config.coin_reward || 25),
      config_text: JSON.stringify(config.config_payload || {}, null, 2),
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
      lesson_id: form.value.lesson_id,
      authoring_mode: form.value.authoring_mode,
      activity_type: form.value.activity_type?.trim() || 'trivia',
      max_attempts: Number(form.value.max_attempts || 3),
      passing_score: Number(form.value.passing_score || 70),
      xp_reward: Number(form.value.xp_reward || 0),
      coin_reward: Number(form.value.coin_reward || 0),
      config_payload: parseConfig(),
      is_active: Boolean(form.value.is_active),
      version: Number(form.value.version || 1),
    }
    const wasEditing = Boolean(editingConfig.value)
    if (wasEditing) await api.put(`/interactive-configs/${editingConfig.value.id}`, payload)
    else await api.post('/interactive-configs', payload)
    await reloadPageData()
    const previewLessonId = form.value.lesson_id
    closeDialog()
    $q.notify({
      type: 'positive',
      message: wasEditing ? 'Actividad actualizada correctamente. Ya puedes previsualizarla.' : 'Actividad creada correctamente. Ya puedes previsualizarla.',
      actions: previewLessonId
        ? [
            {
              label: 'Previsualizar',
              color: 'white',
              handler: () => previewLesson(previewLessonId),
            },
          ]
        : [],
    })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar la actividad.') })
  } finally {
    saving.value = false
  }
}

async function removeConfig(config) {
  try {
    await api.delete(`/interactive-configs/${config.id}`)
    await loadConfigs()
    $q.notify({ type: 'positive', message: 'Actividad desactivada correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo desactivar la actividad.') })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadCourses()
    await reloadPageData()
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo iniciar la pantalla de actividades.') })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrap { max-width: 1200px; margin: 0 auto; }
.dialog-card { width: min(900px, 92vw); max-width: 92vw; }
</style>
