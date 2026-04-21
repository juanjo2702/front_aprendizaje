<template>
  <div class="course-player">
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner color="primary" size="44px" />
    </div>

    <div v-else-if="errorMessage" class="q-pa-md">
      <q-banner class="bg-negative text-white" rounded>
        {{ errorMessage }}
      </q-banner>
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div class="col-12 col-md-4 col-lg-3">
        <q-card class="glass-card sticky-sidebar">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ course.title }}</div>
            <div class="text-caption text-grey-5">
              Progreso: {{ overallProgress }}%
            </div>
            <q-linear-progress
              class="q-mt-sm"
              rounded
              size="8px"
              color="primary"
              :value="overallProgress / 100"
            />
          </q-card-section>

          <q-separator />

          <q-list padding>
            <template v-for="module in modules" :key="module.id">
              <q-item-label header>{{ module.title }}</q-item-label>
              <q-item
                v-for="item in module.lessons"
                :key="item.id"
                clickable
                :active="item.id === lesson.id"
                active-class="bg-primary text-white"
                @click="openLesson(item.id)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="item.is_completed ? 'mdi-check-circle' : lessonTypeIcon(item.type)"
                    :color="item.is_completed ? 'positive' : 'grey-5'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.title }}</q-item-label>
                  <q-item-label caption>{{ lessonTypeLabel(item.type) }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-8 col-lg-9">
        <q-tabs
          v-model="activeTab"
          dense
          inline-label
          active-color="primary"
          indicator-color="primary"
          class="q-mb-md"
        >
          <q-tab name="content" icon="mdi-play-circle-outline" label="Contenido" />
          <q-tab
            v-if="gamification.enabled"
            name="achievements"
            icon="mdi-trophy-outline"
            label="Logros y Ranking"
          />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="content" class="q-pa-none">
            <q-card class="glass-card q-pa-lg">
              <q-banner v-if="previewMode" rounded class="bg-secondary text-dark q-mb-md">
                Vista previa docente: puedes navegar y probar el contenido sin alterar el progreso real del curso.
              </q-banner>

              <div class="row items-center justify-between q-mb-md">
                <div>
                  <div class="text-h5">{{ lesson.title }}</div>
                  <div class="text-caption text-grey-5">
                    {{ lessonTypeLabel(lesson.normalized_type || lesson.type) }}
                    <span v-if="lesson.duration"> • {{ lesson.duration }} seg</span>
                  </div>
                </div>
                <q-btn
                  v-if="!previewMode"
                  color="positive"
                  icon="mdi-check"
                  no-caps
                  label="Marcar completada"
                  @click="markLessonCompleted"
                />
              </div>

              <div v-if="content.kind === 'video'" class="video-container">
                <iframe
                  v-if="isYouTubeUrl(content.payload.video_url)"
                  :src="toEmbedUrl(content.payload.video_url)"
                  frameborder="0"
                  allowfullscreen
                />
                <video v-else controls :src="content.payload.video_url" />
              </div>

              <div
                v-else-if="content.kind === 'reading'"
                class="reading-content"
                v-html="renderReading(content.payload.body_markdown || '')"
              />

              <div v-else-if="content.kind === 'resource'" class="q-gutter-md">
                <div class="text-subtitle1 text-weight-medium">
                  Recurso descargable
                </div>
                <div v-if="content.payload.description" class="text-body2 text-grey-4">
                  {{ content.payload.description }}
                </div>
                <q-btn
                  color="primary"
                  icon="mdi-download"
                  no-caps
                  :label="content.payload.file_name || 'Descargar recurso'"
                  :href="content.payload.file_url"
                  target="_blank"
                />
              </div>

              <div v-else-if="content.kind === 'interactive'" class="q-mt-md">
                <activity-renderer
                  :key="activityRenderKey"
                  :interactive-config="interactiveConfig"
                  :preview-mode="previewMode"
                  @completed="onInteractiveCompleted"
                />

                <q-banner
                  v-if="previewMode && previewInteractiveResult"
                  rounded
                  class="bg-positive text-white q-mt-md"
                >
                  Vista previa finalizada. Puntaje simulado:
                  {{ previewInteractiveResult.score }}/{{ previewInteractiveResult.max_score }}.
                  <template #action>
                    <q-btn flat color="white" no-caps label="Repetir actividad" @click="restartPreviewActivity" />
                    <q-btn
                      v-if="navigation.next_lesson"
                      flat
                      color="white"
                      no-caps
                      label="Siguiente lección"
                      @click="openLesson(navigation.next_lesson.id)"
                    />
                  </template>
                </q-banner>
              </div>

              <div v-else class="text-center q-py-lg text-grey-6">
                Tipo de contenido no soportado todavía.
              </div>

              <q-separator class="q-my-lg" />

              <div class="row justify-between">
                <q-btn
                  v-if="navigation.previous_lesson"
                  flat
                  no-caps
                  icon="mdi-chevron-left"
                  :label="navigation.previous_lesson.title"
                  @click="openLesson(navigation.previous_lesson.id)"
                />
                <span v-else />
                <q-btn
                  v-if="navigation.next_lesson"
                  flat
                  no-caps
                  icon-right="mdi-chevron-right"
                  :label="navigation.next_lesson.title"
                  @click="openLesson(navigation.next_lesson.id)"
                />
              </div>
            </q-card>
          </q-tab-panel>

          <q-tab-panel name="achievements" class="q-pa-none">
            <q-card class="glass-card q-pa-lg">
              <div class="text-h6 q-mb-md">Ranking del curso</div>
              <q-list bordered separator>
                <q-item v-for="entry in gamification.leaderboard" :key="entry.user_id">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">
                      {{ entry.rank }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ entry.name }}</q-item-label>
                    <q-item-label caption>
                      {{ entry.completed_activities }} actividades completadas
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="positive">{{ entry.total_xp }} XP</q-badge>
                  </q-item-section>
                </q-item>
                <q-item v-if="!gamification.leaderboard.length">
                  <q-item-section>
                    Aún no hay actividad suficiente para construir ranking.
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/services/api'
import ActivityRenderer from 'src/components/course/ActivityRenderer.vue'

const props = defineProps({
  initialLessonId: {
    type: Number,
    required: true,
  },
  previewMode: {
    type: Boolean,
    default: false,
  },
})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const responseData = ref(null)
const activeTab = ref('content')
const activityRenderKey = ref(0)
const previewInteractiveResult = ref(null)

const lessonId = computed(() => Number(route.params.lessonId || props.initialLessonId))
const lesson = computed(() => responseData.value?.lesson || {})
const course = computed(() => responseData.value?.course || {})
const content = computed(() => lesson.value?.content || { kind: 'reading', payload: {} })
const modules = computed(() => responseData.value?.sidebar?.modules || [])
const navigation = computed(() => responseData.value?.navigation || {})
const interactiveConfig = computed(() => responseData.value?.interactive_config || null)
const gamification = computed(
  () => responseData.value?.gamification || { enabled: false, leaderboard: [] },
)
const overallProgress = computed(() => responseData.value?.course?.progress?.overall_progress || 0)

watch(
  lessonId,
  async (id) => {
    if (id) {
      await loadLesson(id)
    }
  },
  { immediate: true },
)

async function loadLesson(id) {
  loading.value = true
  errorMessage.value = ''
  previewInteractiveResult.value = null
  activityRenderKey.value += 1
  try {
    const { data } = await api.get(`/lessons/${id}`, {
      params: props.previewMode ? { preview: 1 } : undefined,
    })
    responseData.value = data
    if (activeTab.value === 'achievements' && !data?.gamification?.enabled) {
      activeTab.value = 'content'
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'No se pudo cargar la lección.'
  } finally {
    loading.value = false
  }
}

function restartPreviewActivity() {
  previewInteractiveResult.value = null
  activityRenderKey.value += 1
}

function openLesson(id) {
  if (!id) return
  if (props.previewMode) {
    router.push({ name: 'teacher-lesson-preview', params: { lessonId: id } })
    return
  }
  router.push(`/lessons/${id}`)
}

function lessonTypeLabel(type) {
  const map = {
    video: 'Video',
    reading: 'Lectura',
    resource: 'Recurso',
    interactive: 'Actividad',
    game: 'Actividad',
    quiz: 'Actividad',
    text: 'Lectura',
  }
  return map[type] || type
}

function lessonTypeIcon(type) {
  const map = {
    video: 'mdi-play-circle-outline',
    reading: 'mdi-text-box-outline',
    resource: 'mdi-file-download-outline',
    interactive: 'mdi-gamepad-variant-outline',
    game: 'mdi-gamepad-variant-outline',
    quiz: 'mdi-help-circle-outline',
    text: 'mdi-text-box-outline',
  }
  return map[type] || 'mdi-book-open-page-variant-outline'
}

function renderReading(markdown) {
  // Render mínimo compatible Markdown-lite para evitar dependencias extra.
  return String(markdown)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />')
}

function isYouTubeUrl(url = '') {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function toEmbedUrl(url = '') {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop()
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
}

async function markLessonCompleted() {
  if (props.previewMode) {
    $q.notify({ type: 'info', message: 'Vista previa activa: esta lección no alterará el progreso real.' })
    return
  }

  try {
    const { data } = await api.post(`/lessons/${lesson.value.id}/complete`, {
      time_spent_seconds: lesson.value.duration || 0,
    })
    if (responseData.value?.course?.progress) {
      responseData.value.course.progress = data.progress
    }
    $q.notify({ type: 'positive', message: 'Lección completada.' })
    await loadLesson(lesson.value.id)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo completar la lección.',
    })
  }
}

async function onInteractiveCompleted(result) {
  if (props.previewMode) {
    if (previewInteractiveResult.value) return
    previewInteractiveResult.value = {
      score: Number(result?.score ?? 0),
      max_score: Number(result?.max_score ?? 0),
    }
    $q.notify({
      type: 'positive',
      message: `Vista previa completada. Puntaje simulado: ${previewInteractiveResult.value.score}/${previewInteractiveResult.value.max_score}.`,
    })
    return
  }

  try {
    await api.post(`/lessons/${lesson.value.id}/interactive-complete`, {
      score: result?.score ?? 0,
      max_score: result?.max_score ?? 1,
    })
    $q.notify({ type: 'positive', message: 'Actividad interactiva registrada.' })
    await loadLesson(lesson.value.id)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo registrar la actividad.',
    })
  }
}
</script>

<style scoped lang="scss">
.sticky-sidebar {
  position: sticky;
  top: 90px;
  max-height: calc(100vh - 120px);
  overflow: auto;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 12px;
}

.video-container iframe,
.video-container video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.reading-content :deep(h1),
.reading-content :deep(h2),
.reading-content :deep(h3) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>
