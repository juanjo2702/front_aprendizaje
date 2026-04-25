<template>
  <q-page class="builder-page q-pa-xl" data-cy="teacher-course-workspace">
    <div class="page-wrap">
      <section class="hero-panel q-pa-xl q-mb-lg">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-lg-8">
            <q-badge color="secondary" outline class="q-mb-md">Course Builder 2.0</q-badge>
            <h1 class="q-mb-sm">{{ course?.title || 'Builder del curso' }}</h1>
            <p class="hero-copy q-mb-lg">
              Diseña el curso con una jerarquía sin ambigüedades: primero agregas módulos, dentro de cada módulo agregas
              lecciones y, si la lección es de tipo actividad, aquí mismo conectas su editor.
            </p>

            <div class="row q-gutter-sm">
              <q-btn color="primary" no-caps icon="view_module" data-cy="new-module-btn" label="Nuevo módulo" @click="openModuleDialog()" />
              <q-btn
                data-cy="send-course-review-btn"
                :color="course?.status === 'published' ? 'warning' : (course?.status === 'pending' ? 'secondary' : 'positive')"
                no-caps
                :icon="course?.status === 'published' ? 'edit_off' : (course?.status === 'pending' ? 'schedule_send' : 'publish')"
                :label="statusActionLabel(course)"
                :disable="!course?.id"
                @click="toggleCourseStatus"
              />
              <q-btn
                flat
                no-caps
                color="secondary"
                icon="visibility"
                data-cy="teacher-course-preview-btn"
                label="Vista previa"
                :disable="!course?.slug"
                @click="previewCourse"
              />
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <q-card class="hero-summary q-pa-lg">
              <div class="text-subtitle1 text-weight-bold q-mb-md">Resumen estructural</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-5">Estado</div>
                  <div class="text-h6 text-weight-bold" :class="course?.status === 'published' ? 'text-positive' : (course?.status === 'pending' ? 'text-secondary' : 'text-warning')">
                    {{ statusLabel(course?.status) }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Módulos</div>
                  <div class="text-h6 text-weight-bold">{{ structure?.modules?.length || 0 }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Lecciones</div>
                  <div class="text-h6 text-weight-bold">{{ totalLessons }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-5">Actividades</div>
                  <div class="text-h6 text-weight-bold text-secondary">{{ interactiveLessons }}</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </section>

      <q-banner rounded class="builder-banner q-mb-lg">
        <strong>Flujo oficial del docente:</strong> Curso → Módulo (sección) → Lección.
        Si la lección es de tipo <strong>Actividad</strong>, se activa el editor gamificado con intentos, XP y preview.
      </q-banner>

      <q-banner
        v-if="course?.review_notes"
        rounded
        class="review-banner q-mb-lg"
        icon="feedback"
      >
        <div class="text-weight-bold q-mb-xs">Observación de revisión</div>
        <div>{{ course.review_notes }}</div>
      </q-banner>

      <q-card class="hero-summary q-pa-lg q-mb-lg">
        <div class="row q-col-gutter-lg items-start">
          <div class="col-12 col-lg-7">
            <div class="text-subtitle1 text-weight-bold q-mb-sm">Ruta de certificación</div>
            <div class="text-body2 text-grey-4 q-mb-md">
              Define si este curso entrega certificado, el puntaje mínimo y si además exige aprobar un examen final
              creado dentro de la plataforma.
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-toggle v-model="certificationForm.has_certificate" color="secondary" label="Emitir certificado" />
              </div>
              <div class="col-12 col-md-4" v-if="certificationForm.has_certificate">
                <q-toggle
                  v-model="certificationForm.certificate_requires_final_exam"
                  color="warning"
                  label="Exigir examen final"
                />
              </div>
              <div class="col-12 col-md-4" v-if="certificationForm.has_certificate">
                <q-input
                  v-model.number="certificationForm.certificate_min_score"
                  data-cy="certificate-min-score-input"
                  type="number"
                  min="0"
                  max="100"
                  label="Puntaje mínimo (%)"
                  outlined
                  dense
                />
              </div>

              <div class="col-12" v-if="certificationForm.has_certificate && certificationForm.certificate_requires_final_exam">
                <q-select
                  v-model="certificationForm.certificate_final_lesson_id"
                  data-cy="certificate-final-lesson-select"
                  :options="interactiveLessonOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  clearable
                  label="Lección usada como examen final"
                  hint="Crea una lección de tipo Actividad, entra a editarla y allí podrás importar preguntas de todo el curso."
                />
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-5">
            <q-banner
              rounded
              :class="certificationForm.has_certificate ? 'bg-dark text-grey-3' : 'bg-grey-10 text-grey-5'"
            >
              <div class="text-weight-medium q-mb-sm">Estado actual</div>
              <div v-if="certificationForm.has_certificate">
                Certificado activo con mínimo de {{ certificationForm.certificate_min_score || 0 }}%.
              </div>
              <div v-else>
                Este curso aún no entrega certificado.
              </div>
              <div v-if="certificationForm.has_certificate && certificationForm.certificate_requires_final_exam" class="q-mt-sm">
                {{
                  selectedFinalExamLabel
                    ? `Examen final: ${selectedFinalExamLabel}.`
                    : 'Todavía no seleccionaste la lección para el examen final.'
                }}
              </div>
            </q-banner>

            <div class="row justify-end q-mt-md">
              <q-btn
                color="primary"
                no-caps
                icon="verified"
                data-cy="save-certification-settings-btn"
                label="Guardar ruta de certificación"
                :loading="certificationSaving"
                :disable="!course?.id"
                @click="saveCertificationSettings"
              />
            </div>
          </div>
        </div>
      </q-card>

      <div v-if="loading" class="q-py-md">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="150px" class="q-mb-md" dark />
      </div>

      <div v-else-if="!structure?.modules?.length" class="empty-state q-pa-xl text-center">
        <q-icon name="topic" size="76px" color="grey-6" />
        <div class="text-h5 q-mt-md">Este curso todavía no tiene módulos</div>
        <div class="text-body2 text-grey-5 q-mt-sm">
          Empieza creando un módulo. Luego, dentro del módulo, agrega lecciones de video, documento o actividad.
        </div>
        <q-btn class="q-mt-lg" color="primary" no-caps icon="add" label="Crear primer módulo" @click="openModuleDialog()" />
      </div>

      <div v-else class="column q-gutter-lg">
        <div
          v-for="module in structure.modules"
          :key="module.id"
          class="module-card q-pa-lg"
          draggable="true"
          @dragstart="onModuleDragStart(module.id)"
          @dragover.prevent
          @drop.prevent="onModuleDrop(module.id)"
        >
          <div class="row items-start q-col-gutter-md">
            <div class="col-12 col-lg-8">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-chip color="primary" text-color="white" icon="drag_indicator">
                  Módulo {{ module.sort_order }}
                </q-chip>
                <div class="text-h6 text-weight-bold">{{ module.title }}</div>
              </div>

              <div class="text-body2 text-grey-4 q-mb-md">
                {{ module.description || 'Sin descripción del módulo todavía.' }}
              </div>

              <div class="lesson-stack">
                <div
                  v-for="lesson in module.lessons || []"
                  :key="lesson.id"
                  class="lesson-card q-pa-md"
                  draggable="true"
                  @dragstart="onLessonDragStart(module.id, lesson.id)"
                  @dragover.prevent
                  @drop.prevent="onLessonDrop(module.id, lesson.id)"
                >
                  <div class="row items-center q-col-gutter-md">
                    <div class="col-12 col-lg-8">
                      <div class="row items-center q-gutter-sm">
                        <q-icon name="drag_indicator" color="grey-6" />
                        <q-chip dense square color="secondary" text-color="dark">
                          Lección {{ lesson.sort_order }}
                        </q-chip>
                        <div class="text-subtitle1 text-weight-medium">{{ lesson.title }}</div>
                        <q-badge outline color="primary">{{ lessonTypeLabel(lesson.type) }}</q-badge>
                      </div>
                      <div class="text-caption text-grey-5 q-mt-sm">
                        {{ formatDuration(lesson.duration) }} · {{ lesson.is_free ? 'Acceso libre' : 'Solo inscritos' }}
                      </div>
                      <div class="text-caption text-grey-6 q-mt-xs">
                        {{ lessonSummary(lesson) }}
                      </div>
                    </div>
                    <div class="col-12 col-lg-4 row justify-end q-gutter-sm">
                      <q-btn flat no-caps color="secondary" icon="visibility" label="Preview" @click="previewLesson(lesson)" />
                      <q-btn flat no-caps color="primary" icon="edit" label="Editar" @click="openLessonDialog(module, lesson)" />
                      <q-btn flat no-caps color="negative" icon="delete" label="Eliminar" @click="removeLesson(lesson)" />
                    </div>
                  </div>
                </div>

                <div class="lesson-drop-zone q-mt-sm" @dragover.prevent @drop.prevent="appendLessonDrop(module.id)">
                  Suelta aquí para mover la lección al final de este módulo
                </div>
              </div>
            </div>

            <div class="col-12 col-lg-4">
              <q-card flat bordered class="module-actions q-pa-md">
                <div class="text-subtitle2 text-weight-bold q-mb-sm">Acciones del módulo</div>
                <div class="column q-gutter-sm">
                  <q-btn color="primary" no-caps icon="add" :data-cy="`add-lesson-btn-${module.id}`" label="Añadir lección" @click="openLessonDialog(module)" />
                  <q-btn flat no-caps color="secondary" icon="edit" label="Editar módulo" @click="openModuleDialog(module)" />
                  <q-btn flat no-caps color="negative" icon="delete" label="Eliminar módulo" @click="removeModule(module)" />
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="moduleDialog" persistent>
      <q-card class="form-dialog-card" data-cy="module-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ editingModule ? 'Editar módulo' : 'Crear módulo' }}</div>
          <q-btn flat round dense icon="close" @click="closeModuleDialog" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12"><q-input v-model="moduleForm.title" data-cy="module-title-input" label="Título del módulo" outlined dense /></div>
            <div class="col-12">
              <q-input v-model="moduleForm.description" type="textarea" label="Descripción" outlined autogrow />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="moduleForm.sort_order" type="number" min="1" label="Orden" outlined dense />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeModuleDialog" />
          <q-btn color="primary" no-caps data-cy="save-module-btn" :loading="moduleSaving" label="Guardar módulo" @click="saveModule" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="lessonDialog" persistent>
      <q-card class="dialog-card" data-cy="lesson-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">{{ editingLesson ? 'Editar lección' : 'Crear lección' }}</div>
          <q-btn flat round dense icon="close" @click="closeLessonDialog" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8"><q-input v-model="lessonForm.title" data-cy="lesson-title-input" label="Título de la lección" outlined dense /></div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="lessonForm.type"
                data-cy="lesson-type-select"
                :options="lessonTypeOptions"
                emit-value
                map-options
                label="Tipo de lección"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="lessonForm.duration" type="number" min="0" label="Duración (segundos)" outlined dense />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="lessonForm.sort_order" type="number" min="1" label="Orden" outlined dense />
            </div>
            <div class="col-12 col-md-4 flex flex-center">
              <q-toggle v-model="lessonForm.is_free" label="Vista libre" color="secondary" />
            </div>

            <div v-if="['video', 'resource'].includes(lessonForm.type)" class="col-12 col-md-4">
              <q-select
                v-model="lessonForm.source_mode"
                data-cy="lesson-source-mode-select"
                :options="sourceModeOptions"
                emit-value
                map-options
                label="Origen del archivo"
                outlined
                dense
              />
            </div>

            <div v-if="lessonForm.type === 'video' && lessonForm.source_mode === 'external'" class="col-12 col-md-4">
              <q-input v-model="lessonForm.provider" label="Proveedor" outlined dense />
            </div>

            <div v-if="lessonForm.type === 'video' && lessonForm.source_mode === 'external'" class="col-12">
              <q-input v-model="lessonForm.content_url" label="URL del video" outlined dense />
            </div>

            <div v-if="lessonForm.type === 'video' && lessonForm.source_mode === 'local'" class="col-12">
              <VideoUploader
                v-model="lessonForm.video_upload_token"
                endpoint="/teacher/upload-video"
                :course-id="course?.id"
                label="Video pesado del curso"
                helper-text="Se sube en chunks de 10 MB con progreso real y tolerancia a timeouts."
                accept=".mp4,.webm,.mov,.m3u8,video/*"
              />
            </div>

            <div v-if="lessonForm.type === 'resource' && lessonForm.source_mode === 'external'" class="col-12">
              <q-input v-model="lessonForm.content_url" label="URL del documento/recurso" outlined dense />
            </div>

            <div v-if="lessonForm.type === 'resource' && lessonForm.source_mode === 'local'" class="col-12">
              <VideoUploader
                v-model="lessonForm.resource_upload_token"
                endpoint="/teacher/upload-resource"
                :course-id="course?.id"
                label="Documento o recurso adjunto"
                helper-text="Ideal para PDFs, ZIPs y documentos grandes."
                accept=".pdf,.zip,.docx,application/pdf,application/zip"
                :max-bytes="536870912"
              />
            </div>

            <div v-if="lessonForm.type === 'resource'" class="col-12">
              <q-input
                v-model="lessonForm.content_text"
                type="textarea"
                label="Descripción del recurso"
                outlined
                autogrow
                hint="Úsala para explicar qué contiene el archivo y cuándo debe usarlo el estudiante."
              />
            </div>

            <div v-if="lessonForm.type === 'reading'" class="col-12">
              <q-input v-model="lessonForm.content_text" type="textarea" label="Contenido de lectura" outlined autogrow />
            </div>

            <template v-if="lessonForm.type === 'interactive'">
              <div class="col-12 col-md-4">
              <q-select
                v-model="lessonForm.activity_type"
                data-cy="activity-type-select"
                :options="activityTypeOptions"
                  emit-value
                  map-options
                  label="Tipo de actividad"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-8 row items-center justify-end q-gutter-sm">
                <q-btn flat no-caps color="primary" icon="list_alt" label="Banco de preguntas" @click="importTriviaBank" />
                <q-btn flat no-caps color="secondary" icon="auto_fix_high" data-cy="load-activity-template-btn" label="Cargar plantilla" @click="applyInteractiveTemplate" />
              </div>
              <div class="col-12">
                <q-banner rounded class="bg-dark text-grey-4">
                  {{ activityHint }}
                </q-banner>
              </div>
              <div class="col-12">
                <q-input
                  v-model="lessonForm.interactive_config_text"
                  data-cy="activity-config-json-input"
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
              <div class="col-12">
                <TeacherActivitySettingsPanel
                  v-model:max-attempts="lessonForm.max_attempts"
                  v-model:passing-score="lessonForm.passing_score"
                  v-model:xp-reward="lessonForm.xp_reward"
                  v-model:coin-reward="lessonForm.coin_reward"
                />
              </div>
            </template>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeLessonDialog" />
          <q-btn color="primary" no-caps data-cy="save-lesson-btn" :loading="lessonSaving" label="Guardar lección" @click="saveLesson" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import TeacherActivityDraftPreview from 'src/components/teacher/TeacherActivityDraftPreview.vue'
import TeacherActivitySettingsPanel from 'src/components/teacher/TeacherActivitySettingsPanel.vue'
import VideoUploader from 'src/components/teacher/VideoUploader.vue'
import { api } from 'src/services/api'
import { buildDefaultActivityConfig } from 'src/utils/activityTemplates'

const props = defineProps({
  courseId: { type: [String, Number], required: true },
})

const $q = useQuasar()
const router = useRouter()
const loading = ref(true)
const moduleSaving = ref(false)
const lessonSaving = ref(false)
const certificationSaving = ref(false)
const reordering = ref(false)
const structure = ref(null)
const moduleDialog = ref(false)
const lessonDialog = ref(false)
const editingModule = ref(null)
const editingLesson = ref(null)
const selectedModule = ref(null)
const draggedModuleId = ref(null)
const draggedLesson = ref(null)
const moduleForm = ref(emptyModule())
const lessonForm = ref(emptyLesson())
const certificationForm = ref(emptyCertificationForm())

const lessonTypeOptions = [
  { label: 'Video', value: 'video' },
  { label: 'Documento', value: 'resource' },
  { label: 'Lectura', value: 'reading' },
  { label: 'Actividad', value: 'interactive' },
]

const sourceModeOptions = [
  { label: 'Enlace externo', value: 'external' },
  { label: 'Archivo local', value: 'local' },
]

const activityTypeOptions = [
  { label: 'Trivia', value: 'trivia' },
  { label: 'Emparejamiento', value: 'matching' },
  { label: 'Crucigrama', value: 'crossword' },
]

const course = computed(() => structure.value)
const totalLessons = computed(() =>
  (structure.value?.modules || []).reduce((sum, module) => sum + Number(module.lessons?.length || 0), 0),
)
const interactiveLessons = computed(() =>
  (structure.value?.modules || []).reduce(
    (sum, module) => sum + (module.lessons || []).filter((lesson) => lesson.type === 'interactive').length,
    0,
  ),
)
const interactiveLessonOptions = computed(() =>
  (structure.value?.modules || []).flatMap((module) =>
    (module.lessons || [])
      .filter((lesson) => lesson.type === 'interactive')
      .map((lesson) => ({
        label: `${module.title} · ${lesson.title}`,
        value: lesson.id,
      })),
  ),
)
const selectedFinalExamLabel = computed(
  () => interactiveLessonOptions.value.find((option) => option.value === certificationForm.value.certificate_final_lesson_id)?.label || '',
)

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
  return { title: '', description: '', sort_order: 1 }
}

function emptyCertificationForm() {
  return {
    has_certificate: false,
    certificate_requires_final_exam: false,
    certificate_exam_scope: 'lesson',
    certificate_min_score: 70,
    certificate_final_lesson_id: null,
  }
}

function emptyLesson() {
  return {
    title: '',
    type: 'video',
    duration: 0,
    sort_order: 1,
    is_free: false,
    content_url: '',
    content_text: '',
    source_mode: 'external',
    provider: 'external',
    video_upload_token: '',
    resource_upload_token: '',
    activity_type: 'trivia',
    max_attempts: 3,
    passing_score: 70,
    xp_reward: 100,
    coin_reward: 25,
    interactive_config_text: JSON.stringify(buildDefaultActivityConfig('trivia'), null, 2),
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

function statusLabel(status) {
  return ({ draft: 'Borrador', pending: 'Pendiente', published: 'Publicado' }[status] || status || 'Sin estado')
}

function lessonTypeLabel(type) {
  return ({ video: 'Video', reading: 'Lectura', resource: 'Documento', interactive: 'Actividad' }[type] || type)
}

function formatDuration(seconds) {
  const total = Number(seconds || 0)
  if (!total) return '0 min'
  const minutes = Math.floor(total / 60)
  const remaining = total % 60
  return remaining ? `${minutes}m ${remaining}s` : `${minutes} min`
}

function lessonSummary(lesson) {
  if (lesson.type === 'reading') {
    return lesson.content_text || lesson.contentable?.body_markdown || 'Lectura sin contenido todavía.'
  }

  if (lesson.type === 'interactive') {
    const config = lesson.interactiveConfig || lesson.contentable || {}
    return `${config.activity_type || 'actividad'} · ${config.max_attempts || 3} intentos · ${config.xp_reward || 0} XP`
  }

  if (lesson.type === 'resource') {
    return lesson.content_text || lesson.contentable?.metadata?.description || lesson.contentable?.file_name || lesson.content_url || 'Documento sin adjunto todavía.'
  }

  return lesson.contentable?.provider === 'local'
    ? 'Video local protegido por chunks.'
    : (lesson.content_url || lesson.contentable?.video_url || 'Video sin URL todavía.')
}

async function loadStructure() {
  loading.value = true

  try {
    const { data } = await api.get(`/instructor/courses/${props.courseId}/structure`)
    structure.value = data
    certificationForm.value = {
      has_certificate: Boolean(data?.has_certificate),
      certificate_requires_final_exam: Boolean(data?.certificate_requires_final_exam),
      certificate_exam_scope: data?.certificate_exam_scope || 'lesson',
      certificate_min_score: Number(data?.certificate_min_score || 70),
      certificate_final_lesson_id: data?.certificate_final_lesson_id || null,
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo cargar el builder del curso.'),
    })
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
        sort_order: Number(module.sort_order || 1),
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
  moduleSaving.value = true
  let savedOk = false
  let wasEditing = !!editingModule.value

  try {
    const payload = {
      title: moduleForm.value.title?.trim(),
      description: moduleForm.value.description?.trim() || null,
      sort_order: Number(moduleForm.value.sort_order || 1),
    }

    if (editingModule.value) await api.put(`/modules/${editingModule.value.id}`, payload)
    else await api.post(`/courses/${props.courseId}/modules`, payload)

    await loadStructure()
    savedOk = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo guardar el módulo.'),
    })
  } finally {
    moduleSaving.value = false
    if (savedOk) {
      closeModuleDialog()
      $q.notify({
        type: 'positive',
        message: wasEditing ? 'Módulo actualizado correctamente.' : 'Módulo creado correctamente.',
      })
    }
  }
}

function openLessonDialog(module, lesson = null) {
  selectedModule.value = module
  editingLesson.value = lesson
  const activityType = lesson?.interactiveConfig?.activity_type || lesson?.contentable?.activity_type || 'trivia'
  const interactiveConfig =
    lesson?.interactiveConfig?.config_payload ||
    lesson?.contentable?.config_payload ||
    buildDefaultActivityConfig(activityType)

  lessonForm.value = lesson
    ? {
        title: lesson.title || '',
        type: lesson.type || 'video',
        duration: Number(lesson.duration || 0),
        sort_order: Number(lesson.sort_order || 1),
        is_free: Boolean(lesson.is_free),
      content_url: lesson.content_url || lesson.contentable?.video_url || lesson.contentable?.file_url || '',
      content_text: lesson.content_text || lesson.contentable?.metadata?.description || lesson.contentable?.body_markdown || '',
      source_mode: lesson.contentable?.provider === 'local' || lesson.contentable?.metadata?.upload_token ? 'local' : 'external',
        provider: lesson.contentable?.provider || 'external',
        video_upload_token: '',
        resource_upload_token: '',
        activity_type: activityType,
        max_attempts: Number(lesson.interactiveConfig?.max_attempts || lesson.contentable?.max_attempts || 3),
        passing_score: Number(lesson.interactiveConfig?.passing_score || lesson.contentable?.passing_score || 70),
        xp_reward: Number(lesson.interactiveConfig?.xp_reward || lesson.contentable?.xp_reward || 100),
        coin_reward: Number(lesson.interactiveConfig?.coin_reward || lesson.contentable?.coin_reward || 25),
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

function importTriviaBank() {
  const currentEditingId = editingLesson.value?.id

  // Extraer todas las preguntas del curso excepto la lección actual
  const allQuestions = (structure.value?.modules || []).flatMap((module) =>
    (module.lessons || [])
      .filter((l) => l.type === 'interactive' && l.id !== currentEditingId)
      .flatMap((l) => {
        const payload = l.interactiveConfig?.config_payload || l.contentable?.config_payload
        return Array.isArray(payload?.questions) ? payload.questions : []
      })
  )

  if (allQuestions.length === 0) {
    $q.notify({ type: 'warning', message: 'No hay preguntas de Trivia en otras lecciones de este curso.' })
    return
  }

    $q.dialog({
      title: 'Banco de preguntas del curso',
      message: 'Selecciona las preguntas que deseas importar a esta actividad:',
      options: {
        type: 'checkbox',
        model: [],
      items: allQuestions.map((q, idx) => ({
        label: q.prompt || `Pregunta ${idx + 1}`,
        value: JSON.stringify(q),
            })),
      },
      persistent: true,
      ok: { label: 'Importar seleccionadas', color: 'primary', noCaps: true },
      cancel: { label: 'Cancelar', color: 'grey-8', flat: true, noCaps: true },
    }).onOk((selectedJsonStrings) => {
    if (!selectedJsonStrings || selectedJsonStrings.length === 0) return

    try {
      const selectedQs = selectedJsonStrings.map((str) => JSON.parse(str))
      const currentConfig = JSON.parse(lessonForm.value.interactive_config_text || '{}')
      
      if (!Array.isArray(currentConfig.questions)) {
        currentConfig.questions = []
      }

      const nextIdBase = currentConfig.questions.length + 1
      selectedQs.forEach((q, idx) => {
        const clonedQ = { ...q, id: nextIdBase + idx }
        currentConfig.questions.push(clonedQ)
      })

      lessonForm.value.interactive_config_text = JSON.stringify(currentConfig, null, 2)
      $q.notify({ type: 'positive', message: `Se importaron ${selectedQs.length} preguntas correctamente.` })
    } catch {
      $q.notify({ type: 'negative', message: 'Ocurrió un error al procesar el JSON.' })
    }
  })
}

function applyInteractiveTemplate() {
  lessonForm.value.interactive_config_text = JSON.stringify(
    buildDefaultActivityConfig(lessonForm.value.activity_type || 'trivia'),
    null,
    2,
  )
}

function parseJsonText(text) {
  try {
    return text?.trim() ? JSON.parse(text) : buildDefaultActivityConfig(lessonForm.value.activity_type || 'trivia')
  } catch {
    throw new Error('La configuración JSON de la actividad no es válida.')
  }
}

function serializeLessonPayload() {
  const payload = {
    title: lessonForm.value.title?.trim(),
    type: lessonForm.value.type,
    duration: Number(lessonForm.value.duration || 0),
    sort_order: Number(lessonForm.value.sort_order || 1),
    is_free: Boolean(lessonForm.value.is_free),
  }

  if (['video', 'resource'].includes(lessonForm.value.type)) {
    payload.content_url = lessonForm.value.content_url?.trim() || null
  }

  if (lessonForm.value.type === 'video') {
    if (lessonForm.value.source_mode === 'local' && !lessonForm.value.video_upload_token && !lessonForm.value.content_url) {
      throw new Error('Debes subir un video antes de guardar la lección.')
    }

    payload.provider = lessonForm.value.source_mode === 'local'
      ? 'local'
      : (lessonForm.value.provider?.trim() || 'external')
    payload.video_upload_token = lessonForm.value.source_mode === 'local'
      ? (lessonForm.value.video_upload_token || null)
      : null
  }

  if (lessonForm.value.type === 'resource') {
    if (lessonForm.value.source_mode === 'local' && !lessonForm.value.resource_upload_token && !lessonForm.value.content_url) {
      throw new Error('Debes adjuntar un documento antes de guardar la lección.')
    }

    payload.content_text = lessonForm.value.content_text?.trim() || null
    payload.resource_upload_token = lessonForm.value.source_mode === 'local'
      ? (lessonForm.value.resource_upload_token || null)
      : null
  }

  if (lessonForm.value.type === 'reading') {
    payload.content_text = lessonForm.value.content_text?.trim() || ''
  }

  if (lessonForm.value.type === 'interactive') {
    payload.activity_type = lessonForm.value.activity_type?.trim() || 'trivia'
    payload.max_attempts = Number(lessonForm.value.max_attempts || 3)
    payload.passing_score = Number(lessonForm.value.passing_score || 70)
    payload.xp_reward = Number(lessonForm.value.xp_reward || 0)
    payload.coin_reward = Number(lessonForm.value.coin_reward || 0)
    payload.interactive_config_payload = parseJsonText(lessonForm.value.interactive_config_text)
  }

  return payload
}

async function saveLesson() {
  if (!selectedModule.value) return

  lessonSaving.value = true
  let savedOk = false
  let wasEditing = !!editingLesson.value

  try {
    const payload = serializeLessonPayload()

    if (editingLesson.value) await api.put(`/instructor/lessons/${editingLesson.value.id}`, payload)
    else await api.post(`/modules/${selectedModule.value.id}/lessons`, payload)

    await loadStructure()
    savedOk = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo guardar la lección.'),
    })
  } finally {
    lessonSaving.value = false
    if (savedOk) {
      closeLessonDialog()
      $q.notify({
        type: 'positive',
        message: wasEditing ? 'Lección actualizada correctamente.' : 'Lección creada correctamente.',
      })
    }
  }
}

function confirmAction(message) {
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Confirmar acción',
      message,
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
    $q.notify({ type: 'positive', message: 'Módulo eliminado correctamente.' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo eliminar el módulo.'),
    })
  }
}

async function removeLesson(lesson) {
  if (!(await confirmAction(`¿Eliminar la lección "${lesson.title}"?`))) return

  try {
    await api.delete(`/instructor/lessons/${lesson.id}`)
    await loadStructure()
    $q.notify({ type: 'positive', message: 'Lección eliminada correctamente.' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo eliminar la lección.'),
    })
  }
}

function previewCourse() {
  if (!course.value?.slug) return
  router.push({ name: 'teacher-course-preview', params: { slug: course.value.slug } })
}

function previewLesson(lesson) {
  if (!lesson?.id) return

  router.push({
    name: 'teacher-lesson-preview',
    params: { lessonId: lesson.id },
    query: {
      courseId: String(props.courseId),
      courseTitle: course.value?.title || '',
    },
  })
}

async function toggleCourseStatus() {
  if (!course.value?.id) return

  const nextStatus = course.value.status === 'published'
    ? 'draft'
    : (course.value.status === 'pending' ? 'draft' : 'pending')

  try {
    await api.put(`/courses/${course.value.id}/status`, { status: nextStatus })
    await loadStructure()
    $q.notify({
      type: 'positive',
      message: nextStatus === 'pending'
        ? 'Curso enviado a revisión correctamente.'
        : 'Curso movido a borrador correctamente.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo actualizar el estado del curso.'),
    })
  }
}

async function saveCertificationSettings() {
  if (!course.value?.id) return

  certificationSaving.value = true

  try {
    const requiresFinalExam = Boolean(
      certificationForm.value.has_certificate && certificationForm.value.certificate_requires_final_exam,
    )
    const examScope = certificationForm.value.certificate_exam_scope || 'lesson'

    const payload = {
      has_certificate: Boolean(certificationForm.value.has_certificate),
      certificate_requires_final_exam: requiresFinalExam,
      certificate_exam_scope: requiresFinalExam ? examScope : 'lesson',
      certificate_min_score: Number(certificationForm.value.certificate_min_score || 70),
      certificate_final_lesson_id:
        requiresFinalExam && examScope === 'lesson'
          ? (certificationForm.value.certificate_final_lesson_id || null)
          : null,
    }

    await api.put(`/courses/${course.value.id}`, payload)
    await loadStructure()
    $q.notify({
      type: 'positive',
      message: payload.has_certificate
        ? 'Ruta de certificación guardada correctamente.'
        : 'El certificado quedó desactivado para este curso.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo guardar la configuración del certificado.'),
    })
  } finally {
    certificationSaving.value = false
  }
}

function statusActionLabel(currentCourse) {
  if (currentCourse?.status === 'published') return 'Pasar a borrador'
  if (currentCourse?.status === 'pending') return 'Retirar de revisión'
  return 'Enviar a revisión'
}

function resequenceModules() {
  structure.value.modules = (structure.value?.modules || []).map((module, index) => ({
    ...module,
    sort_order: index + 1,
  }))
}

function resequenceLessons(module) {
  module.lessons = (module.lessons || []).map((lesson, index) => ({
    ...lesson,
    sort_order: index + 1,
  }))
}

function findModule(moduleId) {
  return (structure.value?.modules || []).find((module) => module.id === moduleId)
}

function onModuleDragStart(moduleId) {
  draggedModuleId.value = moduleId
}

async function onModuleDrop(targetModuleId) {
  if (!draggedModuleId.value || draggedModuleId.value === targetModuleId || reordering.value) return

  const modules = [...(structure.value?.modules || [])]
  const fromIndex = modules.findIndex((module) => module.id === draggedModuleId.value)
  const targetIndex = modules.findIndex((module) => module.id === targetModuleId)

  if (fromIndex < 0 || targetIndex < 0) return

  const [dragged] = modules.splice(fromIndex, 1)
  modules.splice(targetIndex, 0, dragged)
  structure.value.modules = modules
  resequenceModules()
  draggedModuleId.value = null

  reordering.value = true

  try {
    await Promise.all(
      structure.value.modules.map((module, index) =>
        api.put(`/modules/${module.id}`, { sort_order: index + 1 }),
      ),
    )
  } catch (error) {
    await loadStructure()
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo reordenar los módulos.'),
    })
  } finally {
    reordering.value = false
  }
}

function onLessonDragStart(moduleId, lessonId) {
  draggedLesson.value = { moduleId, lessonId }
}

async function onLessonDrop(targetModuleId, targetLessonId) {
  await moveLesson(targetModuleId, targetLessonId)
}

async function appendLessonDrop(targetModuleId) {
  await moveLesson(targetModuleId, null)
}

async function moveLesson(targetModuleId, targetLessonId = null) {
  if (!draggedLesson.value || reordering.value) return
  if (draggedLesson.value.moduleId === targetModuleId && draggedLesson.value.lessonId === targetLessonId) return

  const sourceModule = findModule(draggedLesson.value.moduleId)
  const targetModule = findModule(targetModuleId)

  if (!sourceModule || !targetModule) return

  const sourceIndex = (sourceModule.lessons || []).findIndex((lesson) => lesson.id === draggedLesson.value.lessonId)
  if (sourceIndex < 0) return

  const [lesson] = sourceModule.lessons.splice(sourceIndex, 1)
  const targetIndex = targetLessonId
    ? targetModule.lessons.findIndex((item) => item.id === targetLessonId)
    : targetModule.lessons.length

  if (targetIndex >= 0) targetModule.lessons.splice(targetIndex, 0, lesson)
  else targetModule.lessons.push(lesson)

  resequenceLessons(sourceModule)
  if (sourceModule.id !== targetModule.id) {
    resequenceLessons(targetModule)
  }

  const moduleIds = [sourceModule.id, targetModule.id]
  draggedLesson.value = null
  reordering.value = true

  try {
    await Promise.all(
      [...new Set(moduleIds)].flatMap((moduleId) => {
        const module = findModule(moduleId)

        return (module?.lessons || []).map((item, index) =>
          api.put(`/instructor/lessons/${item.id}`, {
            module_id: module.id,
            sort_order: index + 1,
          }),
        )
      }),
    )
  } catch (error) {
    await loadStructure()
    $q.notify({
      type: 'negative',
      message: formatError(error, 'No se pudo reordenar las lecciones.'),
    })
  } finally {
    reordering.value = false
  }
}

onMounted(loadStructure)
</script>

<style scoped lang="scss">
.builder-page {
  background: transparent;
}

.page-wrap {
  max-width: 1340px;
  margin: 0 auto;
}

.hero-panel {
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(108, 92, 231, 0.18), transparent 34%),
    radial-gradient(circle at bottom left, rgba(0, 210, 211, 0.12), transparent 28%),
    linear-gradient(145deg, rgba(29, 31, 66, 0.98), rgba(18, 20, 46, 0.98));
  border: 1px solid rgba(118, 122, 180, 0.18);
}

.hero-panel h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.08;
  margin: 0;
}

.hero-copy {
  color: #b8bbd8;
  max-width: 760px;
}

.hero-summary,
.module-card,
.module-actions,
.empty-state {
  border-radius: 24px;
  background: rgba(15, 17, 38, 0.86);
  border: 1px solid rgba(118, 122, 180, 0.16);
}

.builder-banner {
  background: linear-gradient(135deg, rgba(0, 210, 211, 0.14), rgba(108, 92, 231, 0.12));
  color: #eef0fb;
  border: 1px solid rgba(0, 210, 211, 0.16);
}

.review-banner {
  background: linear-gradient(135deg, rgba(255, 171, 0, 0.16), rgba(255, 87, 34, 0.12));
  color: #fff0d6;
  border: 1px solid rgba(255, 171, 0, 0.24);
}

.lesson-stack {
  display: grid;
  gap: 12px;
}

.lesson-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.lesson-drop-zone {
  border: 1px dashed rgba(0, 210, 211, 0.35);
  border-radius: 16px;
  padding: 12px 16px;
  color: #9aa1d3;
  text-align: center;
}

.dialog-card {
  width: min(960px, 94vw);
  max-width: 94vw;
}

.form-dialog-card {
  width: min(620px, 92vw);
  max-width: 92vw;
}
</style>
