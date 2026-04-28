<template>
  <div class="learning-player" data-cy="learning-player">
    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner color="primary" size="52px" />
    </div>

    <q-banner v-else-if="errorMessage" rounded class="bg-negative text-white">
      {{ errorMessage }}
    </q-banner>

    <div v-else class="player-shell">
      <aside class="player-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-head">
          <q-btn flat round dense color="grey-4" :icon="sidebarCollapsed ? 'chevron_right' : 'chevron_left'" @click="sidebarCollapsed = !sidebarCollapsed" />
          <div v-if="!sidebarCollapsed">
            <div class="text-subtitle1 text-weight-bold">{{ course.title }}</div>
            <div class="text-caption text-grey-5">
              {{ overallProgress }}% completado
            </div>
            <q-linear-progress class="q-mt-sm" rounded color="secondary" size="8px" :value="overallProgress / 100" />
          </div>
        </div>

        <q-scroll-area class="sidebar-scroll">
          <div v-for="module in modules" :key="module.id" class="sidebar-module">
            <div v-if="!sidebarCollapsed" class="text-caption text-grey-6 q-mb-sm">
              {{ module.title }}
            </div>
            <button
              v-for="item in module.lessons"
              :key="item.id"
              type="button"
              class="lesson-chip"
              :class="{ active: item.id === lesson.id, done: item.is_completed }"
              @click="openLesson(item.id)"
            >
              <q-icon :name="lessonIcon(item.type)" size="18px" />
              <span v-if="!sidebarCollapsed" class="lesson-chip__label">
                {{ item.title }}
              </span>
            </button>
          </div>
        </q-scroll-area>
      </aside>

      <section class="player-stage" data-cy="learning-stage">
        <div class="stage-head">
          <div>
            <div class="text-overline text-secondary">{{ lessonTypeLabel(content.kind) }}</div>
            <div class="text-h4 text-weight-bold">{{ lesson.title }}</div>
            <div class="text-caption text-grey-5">
              {{ lesson.duration ? `${lesson.duration} seg` : 'Sin duracion estimada' }}
            </div>
          </div>
          <div class="row q-gutter-sm items-center">
            <q-badge v-if="hasPendingQueue" color="warning" text-color="dark" label="Sincronizacion pendiente" />
            <q-btn
              v-if="showExternalVideoManualButton"
              color="secondary"
              no-caps
              icon="task_alt"
              label="Marcar video como visto"
              :loading="videoCompleted"
              @click="handleVideoEnded"
            />
            <q-btn
              flat
              no-caps
              color="grey-4"
              icon="sync"
              label="Forzar sync"
              :disable="!hasPendingQueue"
              @click="flushPendingProgress"
            />
          </div>
        </div>

        <div class="stage-card" data-cy="lesson-stage-card">
          <component
            :is="currentRenderer"
            v-bind="rendererProps"
            @ended="handleVideoEnded"
            @completed="handleInteractiveCompleted"
          />
        </div>

        <CommentSection
          v-if="commentTarget"
          class="q-mt-lg"
          :comment-target="commentTarget"
        />

        <transition name="fade-slide">
          <q-banner v-if="serverVictoryMessage" rounded class="bg-positive text-white q-mt-md">
            {{ serverVictoryMessage }}
          </q-banner>
        </transition>

        <div class="row items-center justify-between q-mt-lg">
          <q-btn
            v-if="navigation.previous_lesson"
            flat
            no-caps
            color="grey-3"
            icon="chevron_left"
            :label="navigation.previous_lesson.title"
            @click="openLesson(navigation.previous_lesson.id)"
          />
          <span v-else />
          <q-btn
            v-if="navigation.next_lesson"
            color="primary"
            no-caps
            icon-right="chevron_right"
            :label="navigation.next_lesson.title"
            @click="openLesson(navigation.next_lesson.id)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { api } from 'src/services/api'
import CommentSection from 'src/components/comments/CommentSection.vue'
import { useStudentStore } from 'src/stores/student'
import ActivityRenderer from 'src/components/course/ActivityRenderer.vue'
import StudentReadingLesson from 'src/components/student/StudentReadingLesson.vue'
import StudentResourceLesson from 'src/components/student/StudentResourceLesson.vue'
import StudentVideoPlayer from 'src/components/student/StudentVideoPlayer.vue'

const props = defineProps({
  initialLessonId: {
    type: Number,
    required: true,
  },
})

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const { pendingProgressQueue } = storeToRefs(studentStore)

const loading = ref(false)
const errorMessage = ref('')
const responseData = ref(null)
const sidebarCollapsed = ref(false)
const serverVictoryMessage = ref('')
const interactiveSubmitting = ref(false)
const videoCompleted = ref(false)
const autoCompletedLessonIds = ref(new Set())

const lessonId = computed(() => Number(route.params.lessonId || props.initialLessonId))
const lesson = computed(() => responseData.value?.lesson || {})
const course = computed(() => responseData.value?.course || {})
const content = computed(() => lesson.value?.content || { kind: 'reading', payload: {} })
const modules = computed(() => responseData.value?.sidebar?.modules || [])
const navigation = computed(() => responseData.value?.navigation || {})
const interactiveConfig = computed(() => responseData.value?.interactive_config || null)
const interactiveAttemptState = computed(() => responseData.value?.interactive_attempt_state || null)
const commentTarget = computed(() => responseData.value?.comment_target || null)
const overallProgress = computed(() => responseData.value?.course?.progress?.overall_progress || 0)
const hasPendingQueue = computed(() => pendingProgressQueue.value.length > 0)
const videoTrackingMode = computed(() => content.value?.payload?.tracking_mode || 'native')
const showExternalVideoManualButton = computed(() => (
  content.value.kind === 'video'
    && videoTrackingMode.value !== 'native'
    && !isCurrentLessonCompleted()
))

const currentRenderer = computed(() => {
  if (content.value.kind === 'video') return StudentVideoPlayer
  if (content.value.kind === 'interactive') return ActivityRenderer
  if (content.value.kind === 'resource') return StudentResourceLesson
  return StudentReadingLesson
})

const rendererProps = computed(() => {
  if (content.value.kind === 'video') {
    return {
      source: content.value.payload?.video_url || '',
      embedUrl: content.value.payload?.embed_url || '',
      provider: content.value.payload?.provider || '',
      poster: course.value?.thumbnail || '',
      trackingMode: videoTrackingMode.value,
    }
  }

  if (content.value.kind === 'interactive') {
    return {
      interactiveConfig: interactiveConfig.value,
      attemptState: interactiveAttemptState.value,
      previewMode: false,
    }
  }

  if (content.value.kind === 'resource') {
    return {
      source: content.value.payload?.file_url || '',
      fileName: content.value.payload?.file_name || 'Recurso descargable',
      description: content.value.payload?.description || '',
    }
  }

  return {
    content: content.value.payload?.body_markdown || '',
  }
})

watch(
  lessonId,
  async (value) => {
    if (value) await loadLesson(value)
  },
  { immediate: true },
)

watch(
  () => [content.value.kind, lesson.value.id, responseData.value],
  () => {
    if (['reading', 'resource'].includes(content.value.kind)) {
      markSupportLessonSeen()
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  studentStore.flushPendingProgress()
  if (typeof window !== 'undefined') {
    window.__qaCompleteCurrentVideo = handleVideoEnded
    window.__qaCompleteInteractive = onQaInteractiveCompleted
    window.addEventListener('qa:video-ended', onQaVideoEnded)
    window.addEventListener('qa:interactive-completed', onQaInteractiveCompleted)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    delete window.__qaCompleteCurrentVideo
    delete window.__qaCompleteInteractive
    window.removeEventListener('qa:video-ended', onQaVideoEnded)
    window.removeEventListener('qa:interactive-completed', onQaInteractiveCompleted)
  }
})

async function loadLesson(id) {
  loading.value = true
  errorMessage.value = ''
  serverVictoryMessage.value = ''
  videoCompleted.value = false
  try {
    const { data } = await api.get(`/lessons/${id}`)
    responseData.value = data
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'No se pudo cargar el reproductor.'
  } finally {
    loading.value = false
  }
}

function isCurrentLessonCompleted() {
  const currentId = Number(lesson.value.id || 0)
  return modules.value
    .flatMap((module) => module.lessons || [])
    .some((item) => Number(item.id) === currentId && item.is_completed)
}

async function markSupportLessonSeen() {
  const currentLessonId = Number(lesson.value.id || 0)
  if (!currentLessonId || isCurrentLessonCompleted() || autoCompletedLessonIds.value.has(currentLessonId)) return
  autoCompletedLessonIds.value.add(currentLessonId)

  try {
    const result = await studentStore.submitLessonCompletion(currentLessonId, {
      time_spent_seconds: lesson.value.duration || 0,
    })

    if (!result?.queued) {
      serverVictoryMessage.value = content.value.kind === 'resource'
        ? 'Recurso marcado como visto.'
        : 'Lectura marcada como vista.'
      await loadLesson(currentLessonId)
    }
  } catch (error) {
    autoCompletedLessonIds.value.delete(currentLessonId)
    $q.notify({
      type: 'warning',
      message: error?.response?.data?.message || 'No se pudo registrar esta lección como vista.',
    })
  }
}

function openLesson(id) {
  if (!id) return
  router.push({ name: 'student-learning', params: { lessonId: id } })
}

function lessonTypeLabel(type) {
  return ({
    video: 'Clase en video',
    reading: 'Lectura guiada',
    resource: 'Recurso',
    interactive: 'Actividad interactiva',
  }[type] || 'Contenido')
}

function lessonIcon(type) {
  return ({
    video: 'play_circle_outline',
    reading: 'article',
    resource: 'description',
    interactive: 'extension',
  }[type] || 'radio_button_checked')
}

function onQaInteractiveCompleted(event) {
  handleInteractiveCompleted(event?.detail || {})
}

function onQaVideoEnded() {
  handleVideoEnded()
}

function applyLessonCompletionSnapshot(snapshot) {
  if (!snapshot || !responseData.value) return

  responseData.value = {
    ...responseData.value,
    course: {
      ...(responseData.value.course || {}),
      progress: snapshot,
    },
    sidebar: {
      ...(responseData.value.sidebar || {}),
      modules: (responseData.value.sidebar?.modules || []).map((module) => ({
        ...module,
        lessons: (module.lessons || []).map((item) => (
          Number(item.id) === Number(lesson.value.id)
            ? { ...item, is_completed: true }
            : item
        )),
      })),
    },
  }
}

async function handleVideoEnded() {
  if (videoCompleted.value || isCurrentLessonCompleted()) return
  videoCompleted.value = true

  try {
    const result = await studentStore.submitLessonCompletion(lesson.value.id, {
      time_spent_seconds: lesson.value.duration || 0,
    })

    if (result?.queued) {
      serverVictoryMessage.value = 'La leccion se guardo localmente y se sincronizara cuando vuelva tu conexion.'
      $q.notify({ type: 'warning', message: serverVictoryMessage.value })
      return
    }

    applyLessonCompletionSnapshot(result?.progress)
    serverVictoryMessage.value = 'Leccion completada y validada por el servidor.'
    await loadLesson(lesson.value.id)
  } catch (error) {
    videoCompleted.value = false
    $q.notify({ type: 'negative', message: error?.response?.data?.message || 'No se pudo registrar la leccion.' })
  }
}

async function handleInteractiveCompleted(result) {
  if (interactiveSubmitting.value) return
  interactiveSubmitting.value = true
  serverVictoryMessage.value = ''

  try {
    const response = await studentStore.submitInteractiveCompletion(lesson.value.id, {
      score: Number(result?.score ?? 0),
      max_score: Number(result?.max_score ?? 1),
      time_spent_seconds: lesson.value.duration || 0,
    })

    if (response?.queued) {
      serverVictoryMessage.value = 'Actividad guardada localmente. La victoria se confirmara cuando vuelva tu conexion.'
      $q.notify({ type: 'warning', message: serverVictoryMessage.value })
      return
    }

    const attempt = response?.attempt || {}
    serverVictoryMessage.value = attempt.passed
      ? `Actividad aprobada. Ganaste ${Number(response?.xp_awarded || 0)} XP.`
      : (attempt.locked
        ? 'Actividad bloqueada por agotar intentos. Contacta al docente.'
        : `Intento registrado (${attempt.score || 0}%). Te quedan ${Math.max(0, Number(attempt.max_attempts || 0) - Number(attempt.attempt_number || 0))} intento(s).`)
    await loadLesson(lesson.value.id)
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.response?.data?.message || 'No se pudo registrar la actividad.' })
  } finally {
    interactiveSubmitting.value = false
  }
}

async function flushPendingProgress() {
  await studentStore.flushPendingProgress()
  if (!pendingProgressQueue.value.length) {
    $q.notify({ type: 'positive', message: 'El progreso local pendiente ya fue sincronizado.' })
  }
}
</script>

<style scoped>
.learning-player {
  min-height: calc(100vh - 120px);
}

.player-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  min-height: calc(100vh - 140px);
}

.player-sidebar {
  background: linear-gradient(180deg, rgba(19, 23, 49, 0.96), rgba(12, 14, 31, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 28px;
  padding: 18px;
  transition: width 0.25s ease, padding 0.25s ease;
  position: sticky;
  top: 92px;
  height: calc(100vh - 140px);
}

.player-sidebar.collapsed {
  width: 92px;
  padding-inline: 12px;
}

.sidebar-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.sidebar-scroll {
  height: calc(100% - 90px);
}

.sidebar-module {
  margin-bottom: 18px;
}

.lesson-chip {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: #f3f5ff;
  padding: 12px;
  border-radius: 18px;
  margin-bottom: 8px;
  text-align: left;
  transition: all 0.2s ease;
}

.lesson-chip__label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lesson-chip.done {
  border-color: rgba(99, 255, 187, 0.25);
}

.lesson-chip.active {
  border-color: rgba(32, 213, 236, 0.55);
  background: rgba(32, 213, 236, 0.14);
}

.player-stage {
  min-width: 0;
}

.stage-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.stage-card {
  background: linear-gradient(180deg, rgba(18, 21, 45, 0.98), rgba(10, 11, 27, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 30px;
  padding: 24px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 1023px) {
  .player-shell {
    grid-template-columns: 1fr;
  }

  .player-sidebar {
    position: static;
    height: auto;
  }
}
</style>
