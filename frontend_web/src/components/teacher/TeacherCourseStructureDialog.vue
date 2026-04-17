<template>
  <q-dialog :model-value="modelValue" maximized @update:model-value="emit('update:modelValue', $event)">
    <q-card class="structure-shell">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h5">{{ course?.title || 'Estructura' }}</div>
          <div class="text-caption text-grey-5">Gestiona módulos y lecciones del curso.</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" no-caps icon="view_module" label="Nuevo módulo" @click="openModuleDialog()" />
          <q-btn flat round dense icon="close" @click="emit('update:modelValue', false)" />
        </div>
      </q-card-section>
      <q-separator dark />
      <q-card-section>
        <div v-if="loading" class="q-py-md">
          <q-skeleton v-for="n in 3" :key="n" type="rect" height="110px" class="q-mb-md" dark />
        </div>
        <div v-else-if="!structure?.modules?.length" class="text-center q-py-xl">
          <q-icon name="topic" size="72px" color="grey-6" />
          <div class="text-h6 q-mt-md">Todavía no hay módulos</div>
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-expansion-item
            v-for="module in structure.modules"
            :key="module.id"
            default-opened
            dense-toggle
            expand-separator
          >
            <template #header>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ module.sort_order }}. {{ module.title }}</q-item-label>
                <q-item-label caption>{{ module.description || 'Sin descripción del módulo.' }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <div class="row q-gutter-xs">
                  <q-btn flat dense round color="secondary" icon="add" @click.stop="openLessonDialog(module)" />
                  <q-btn flat dense round color="primary" icon="edit" @click.stop="openModuleDialog(module)" />
                  <q-btn flat dense round color="negative" icon="delete" @click.stop="removeModule(module)" />
                </div>
              </q-item-section>
            </template>
            <q-card flat>
              <q-card-section>
                <div v-if="!module.lessons?.length" class="text-caption text-grey-5">
                  Este módulo todavía no tiene lecciones.
                </div>
                <div v-else class="column q-gutter-sm">
                  <q-card v-for="lesson in module.lessons" :key="lesson.id" flat bordered class="q-pa-sm">
                    <div class="row items-center q-col-gutter-md">
                      <div class="col-12 col-md-7">
                        <div class="text-subtitle2">{{ lesson.sort_order }}. {{ lesson.title }}</div>
                        <div class="text-caption text-grey-5">
                          {{ lessonTypeLabel(lesson.type) }} · {{ formatDuration(lesson.duration) }} ·
                          {{ lesson.is_free ? 'Vista libre' : 'Solo inscritos' }}
                        </div>
                        <div class="text-caption text-grey-6">{{ lessonSummary(lesson) }}</div>
                      </div>
                      <div class="col-12 col-md-5 row justify-end q-gutter-sm">
                        <q-btn
                          flat
                          no-caps
                          color="secondary"
                          icon="visibility"
                          label="Previsualizar"
                          @click="previewLesson(lesson)"
                        />
                        <q-btn
                          flat
                          no-caps
                          color="primary"
                          icon="edit"
                          label="Editar"
                          @click="openLessonDialog(module, lesson)"
                        />
                        <q-btn
                          flat
                          no-caps
                          color="negative"
                          icon="delete"
                          label="Eliminar"
                          @click="removeLesson(lesson)"
                        />
                      </div>
                    </div>
                  </q-card>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-dialog v-model="moduleDialog" persistent>
        <q-card class="form-dialog-card">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">{{ editingModule ? 'Editar módulo' : 'Crear módulo' }}</div>
            <q-btn flat round dense icon="close" @click="closeModuleDialog" />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div class="col-12"><q-input v-model="moduleForm.title" label="Título" outlined dense /></div>
              <div class="col-12">
                <q-input
                  v-model="moduleForm.description"
                  type="textarea"
                  label="Descripción"
                  outlined
                  autogrow
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="moduleForm.sort_order"
                  type="number"
                  min="0"
                  label="Orden"
                  outlined
                  dense
                />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeModuleDialog" />
            <q-btn color="primary" no-caps :loading="moduleSaving" label="Guardar módulo" @click="saveModule" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="lessonDialog" persistent>
        <q-card class="dialog-card">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">{{ editingLesson ? 'Editar lección' : 'Crear lección' }}</div>
            <q-btn flat round dense icon="close" @click="closeLessonDialog" />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8"><q-input v-model="lessonForm.title" label="Título" outlined dense /></div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="lessonForm.type"
                  :options="lessonTypeOptions"
                  emit-value
                  map-options
                  label="Tipo"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="lessonForm.duration"
                  type="number"
                  min="0"
                  label="Duración (segundos)"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="lessonForm.sort_order"
                  type="number"
                  min="0"
                  label="Orden"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-4 flex flex-center">
                <q-toggle v-model="lessonForm.is_free" label="Vista libre" color="secondary" />
              </div>
              <div class="col-12" v-if="['video','resource'].includes(lessonForm.type)">
                <q-input v-model="lessonForm.content_url" label="URL del contenido" outlined dense />
              </div>
              <div class="col-12 col-md-4" v-if="lessonForm.type === 'video'">
                <q-input v-model="lessonForm.provider" label="Proveedor" outlined dense />
              </div>
              <div class="col-12" v-if="lessonForm.type === 'reading'">
                <q-input
                  v-model="lessonForm.content_text"
                  type="textarea"
                  label="Contenido de lectura"
                  outlined
                  autogrow
                />
              </div>
              <template v-if="lessonForm.type === 'interactive'">
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="lessonForm.activity_type"
                    :options="activityTypeOptions"
                    emit-value
                    map-options
                    label="Tipo de actividad"
                    outlined
                    dense
                  />
                </div>
                <div class="col-12 col-md-8 row items-center justify-end">
                  <q-btn
                    flat
                    no-caps
                    color="secondary"
                    icon="auto_fix_high"
                    label="Cargar plantilla"
                    @click="applyInteractiveTemplate"
                  />
                </div>
                <div class="col-12">
                  <q-banner rounded class="bg-dark text-grey-4">
                    {{ activityHint }}
                  </q-banner>
                </div>
                <div class="col-12">
                  <q-input
                    v-model="lessonForm.interactive_config_text"
                    type="textarea"
                    label="Configuración JSON"
                    outlined
                    autogrow
                  />
                </div>
                <div class="col-12">
                  <TeacherActivityDraftPreview
                    :activity-type="lessonForm.activity_type"
                    authoring-mode="form"
                    :config-text="lessonForm.interactive_config_text"
                  />
                </div>
              </template>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeLessonDialog" />
            <q-btn color="primary" no-caps :loading="lessonSaving" label="Guardar lección" @click="saveLesson" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TeacherActivityDraftPreview from 'src/components/teacher/TeacherActivityDraftPreview.vue'
import { api } from 'src/services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  course: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'changed'])
const $q = useQuasar()
const router = useRouter()
const loading = ref(false)
const structure = ref(null)
const moduleDialog = ref(false)
const lessonDialog = ref(false)
const moduleSaving = ref(false)
const lessonSaving = ref(false)
const editingModule = ref(null)
const editingLesson = ref(null)
const selectedModule = ref(null)
const moduleForm = ref(emptyModule())
const lessonForm = ref(emptyLesson())

const lessonTypeOptions = [
  { label: 'Video', value: 'video' },
  { label: 'Lectura', value: 'reading' },
  { label: 'Recurso', value: 'resource' },
  { label: 'Interactivo', value: 'interactive' },
]

const activityTypeOptions = [
  { label: 'Trivia', value: 'trivia' },
  { label: 'Emparejamiento', value: 'matching' },
  { label: 'Crucigrama', value: 'crossword' },
]

const activityHint = computed(() => {
  if (lessonForm.value.activity_type === 'matching') {
    return '`matching` usa `pairs` con estructura `left/right`.'
  }

  if (lessonForm.value.activity_type === 'crossword') {
    return '`crossword` usa `rows`, `cols` y `entries` con `row`, `col`, `direction`, `clue` y `answer`.'
  }

  return '`trivia` usa `questions` con `prompt`, `options` y `points`.'
})

function emptyModule() {
  return { title: '', description: '', sort_order: 0 }
}

function emptyLesson() {
  return {
    title: '',
    type: 'video',
    duration: 0,
    sort_order: 0,
    is_free: false,
    content_url: '',
    content_text: '',
    provider: 'external',
    activity_type: 'trivia',
    interactive_config_text: JSON.stringify(defaultInteractiveConfig('trivia'), null, 2),
  }
}

function defaultInteractiveConfig(activityType = 'trivia') {
  if (activityType === 'matching') {
    return {
      title: 'Relaciona conceptos y definiciones',
      description: 'Empareja cada concepto con su definición correcta.',
      points_per_pair: 10,
      pairs: [
        { id: 1, left: 'Variable', right: 'Espacio que almacena un valor' },
        { id: 2, left: 'Función', right: 'Bloque de código reutilizable' },
        { id: 3, left: 'Array', right: 'Colección ordenada de elementos' },
      ],
    }
  }

  if (activityType === 'crossword') {
    return {
      title: 'Crucigrama de conceptos base',
      description: 'Completa el tablero usando las pistas horizontales y verticales.',
      rows: 5,
      cols: 6,
      points_per_word: 10,
      entries: [
        { id: 1, row: 0, col: 0, direction: 'across', clue: 'Interfaz para comunicar sistemas', answer: 'API' },
        { id: 2, row: 0, col: 0, direction: 'down', clue: 'Aplicación instalada en un dispositivo', answer: 'APP' },
        { id: 3, row: 0, col: 2, direction: 'down', clue: 'Sigla corta de inteligencia artificial', answer: 'IA' },
        { id: 4, row: 2, col: 3, direction: 'across', clue: 'Modelo de objetos del documento', answer: 'DOM' },
        { id: 5, row: 2, col: 5, direction: 'down', clue: 'Función que asocia un valor a otro', answer: 'MAP' },
        { id: 6, row: 4, col: 0, direction: 'across', clue: 'Aplicación web progresiva', answer: 'PWA' },
      ],
    }
  }

  return {
    title: 'Actividad interactiva',
    description: 'Configura preguntas y respuestas.',
    questions: [
      {
        id: 1,
        prompt: 'Pregunta de ejemplo',
        options: [
          { id: 'a', text: 'Respuesta correcta', is_correct: true },
          { id: 'b', text: 'Respuesta distractora', is_correct: false },
        ],
        points: 10,
      },
    ],
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

function lessonTypeLabel(type) {
  return ({ video: 'Video', reading: 'Lectura', resource: 'Recurso', interactive: 'Interactivo' }[type] || type)
}

function formatDuration(seconds) {
  const total = Number(seconds || 0)
  if (!total) return '0 min'
  const minutes = Math.floor(total / 60)
  const remaining = total % 60
  return remaining ? `${minutes}m ${remaining}s` : `${minutes} min`
}

function lessonSummary(lesson) {
  if (lesson.type === 'reading') return lesson.content_text || lesson.contentable?.body_markdown || 'Lectura sin contenido.'
  if (lesson.type === 'interactive') return lesson.interactiveConfig?.activity_type || lesson.contentable?.activity_type || 'Actividad interactiva.'
  if (lesson.type === 'resource') return lesson.content_url || lesson.contentable?.file_url || 'Recurso sin URL.'
  return lesson.content_url || lesson.contentable?.video_url || 'Video sin URL.'
}

function applyInteractiveTemplate() {
  lessonForm.value.interactive_config_text = JSON.stringify(
    defaultInteractiveConfig(lessonForm.value.activity_type || 'trivia'),
    null,
    2,
  )
}

async function loadStructure() {
  if (!props.course?.id) return
  loading.value = true
  try {
    const { data } = await api.get(`/instructor/courses/${props.course.id}/structure`)
    structure.value = data
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo cargar la estructura del curso.') })
  } finally {
    loading.value = false
  }
}

function openModuleDialog(module = null) {
  editingModule.value = module
  moduleForm.value = module
    ? {
        title: module.title || '',
        description: module.description || '',
        sort_order: Number(module.sort_order || 0),
      }
    : {
        title: '',
        description: '',
        sort_order: (structure.value?.modules?.length || 0) + 1,
      }
  moduleDialog.value = true
}

function closeModuleDialog() {
  if (!moduleSaving.value) {
    moduleDialog.value = false
    editingModule.value = null
    moduleForm.value = emptyModule()
  }
}

async function saveModule() {
  if (!props.course?.id) return
  moduleSaving.value = true
  try {
    const payload = {
      title: moduleForm.value.title?.trim(),
      description: moduleForm.value.description?.trim() || null,
      sort_order: Number(moduleForm.value.sort_order || 0),
    }
    if (editingModule.value) await api.put(`/modules/${editingModule.value.id}`, payload)
    else await api.post(`/courses/${props.course.id}/modules`, payload)
    await loadStructure()
    emit('changed')
    closeModuleDialog()
    $q.notify({
      type: 'positive',
      message: editingModule.value ? 'Módulo actualizado correctamente.' : 'Módulo creado correctamente.',
    })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar el módulo.') })
  } finally {
    moduleSaving.value = false
  }
}

function openLessonDialog(module, lesson = null) {
  selectedModule.value = module
  editingLesson.value = lesson
  const activityType = lesson?.interactiveConfig?.activity_type || lesson?.contentable?.activity_type || 'trivia'
  const interactiveConfig =
    lesson?.interactiveConfig?.config_payload ||
    lesson?.contentable?.config_payload ||
    defaultInteractiveConfig(activityType)

  lessonForm.value = lesson
    ? {
        title: lesson.title || '',
        type: lesson.type || 'video',
        duration: Number(lesson.duration || 0),
        sort_order: Number(lesson.sort_order || 0),
        is_free: Boolean(lesson.is_free),
        content_url: lesson.content_url || lesson.contentable?.video_url || lesson.contentable?.file_url || '',
        content_text: lesson.content_text || lesson.contentable?.body_markdown || '',
        provider: lesson.contentable?.provider || 'external',
        activity_type: activityType,
        interactive_config_text: JSON.stringify(interactiveConfig, null, 2),
      }
    : {
        ...emptyLesson(),
        sort_order: (module.lessons?.length || 0) + 1,
      }
  lessonDialog.value = true
}

function closeLessonDialog() {
  if (!lessonSaving.value) {
    lessonDialog.value = false
    editingLesson.value = null
    selectedModule.value = null
    lessonForm.value = emptyLesson()
  }
}

function parseJsonText(text) {
  try {
    return text?.trim() ? JSON.parse(text) : defaultInteractiveConfig(lessonForm.value.activity_type || 'trivia')
  } catch {
    throw new Error('La configuración JSON de la actividad no es válida.')
  }
}

function serializeLessonPayload() {
  const payload = {
    title: lessonForm.value.title?.trim(),
    type: lessonForm.value.type,
    duration: Number(lessonForm.value.duration || 0),
    sort_order: Number(lessonForm.value.sort_order || 0),
    is_free: Boolean(lessonForm.value.is_free),
  }
  if (['video', 'resource'].includes(lessonForm.value.type)) payload.content_url = lessonForm.value.content_url?.trim() || null
  if (lessonForm.value.type === 'video') payload.provider = lessonForm.value.provider?.trim() || 'external'
  if (lessonForm.value.type === 'reading') payload.content_text = lessonForm.value.content_text?.trim() || ''
  if (lessonForm.value.type === 'interactive') {
    payload.activity_type = lessonForm.value.activity_type?.trim() || 'trivia'
    payload.interactive_config_payload = parseJsonText(lessonForm.value.interactive_config_text)
  }
  return payload
}

async function saveLesson() {
  if (!selectedModule.value || !props.course?.id) return
  lessonSaving.value = true
  try {
    const payload = serializeLessonPayload()
    if (editingLesson.value) await api.put(`/instructor/lessons/${editingLesson.value.id}`, payload)
    else await api.post(`/modules/${selectedModule.value.id}/lessons`, payload)
    await loadStructure()
    emit('changed')
    closeLessonDialog()
    $q.notify({
      type: 'positive',
      message: editingLesson.value ? 'Lección actualizada correctamente.' : 'Lección creada correctamente.',
    })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar la lección.') })
  } finally {
    lessonSaving.value = false
  }
}

function confirmAction(message) {
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Confirmar acción',
      message,
      cancel: true,
      persistent: true,
      ok: { color: 'primary', label: 'Aceptar' },
      cancel: { color: 'grey-5', label: 'Cancelar', flat: true },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}

async function removeModule(module) {
  if (!(await confirmAction(`¿Eliminar el módulo "${module.title}"?`))) return
  try {
    await api.delete(`/modules/${module.id}`)
    await loadStructure()
    emit('changed')
    $q.notify({ type: 'positive', message: 'Módulo eliminado correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo eliminar el módulo.') })
  }
}

async function removeLesson(lesson) {
  if (!(await confirmAction(`¿Eliminar la lección "${lesson.title}"?`))) return
  try {
    await api.delete(`/instructor/lessons/${lesson.id}`)
    await loadStructure()
    emit('changed')
    $q.notify({ type: 'positive', message: 'Lección eliminada correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo eliminar la lección.') })
  }
}

function previewLesson(lesson) {
  if (!lesson?.id) return
  router.push({ name: 'teacher-lesson-preview', params: { lessonId: lesson.id } })
}

watch(
  () => [props.modelValue, props.course?.id],
  ([open, courseId]) => {
    if (open && courseId) loadStructure()
  },
)
</script>

<style scoped>
.dialog-card { width: min(900px, 92vw); max-width: 92vw; }
.form-dialog-card { width: min(620px, 92vw); max-width: 92vw; }
.structure-shell { background: #121228; }
</style>
