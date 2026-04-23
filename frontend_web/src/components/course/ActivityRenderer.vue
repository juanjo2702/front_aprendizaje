<template>
  <q-card class="glass-card q-pa-lg">
    <div
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 350 } }"
    >
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6 text-weight-bold">{{ activityTitle }}</div>
          <div class="text-caption text-grey-5">
            Tipo: {{ activityTypeLabel }} • Modo: {{ authoringModeLabel }}
          </div>
          <div v-if="attemptState" class="text-caption text-grey-5 q-mt-xs">
            Intentos: {{ attemptState.attempts_used || 0 }} / {{ attemptState.max_attempts || interactiveMaxAttempts }}
            <span v-if="attemptState.last_attempt"> · Último puntaje: {{ attemptState.last_attempt.score }}%</span>
          </div>
        </div>
        <q-badge :color="previewMode ? 'secondary' : 'primary'" outline>
          {{ previewMode ? 'Vista previa' : 'Actividad interactiva' }}
        </q-badge>
      </div>

      <q-banner v-if="attemptPassed && !previewMode" rounded class="bg-positive text-white q-mb-md">
        Actividad aprobada. Tu progreso ya fue registrado y no necesitas volver a intentarla.
      </q-banner>

      <q-banner v-else-if="attemptLocked && !previewMode" rounded class="bg-negative text-white q-mb-md">
        Se agotaron los intentos disponibles. Solicita al docente que revise o reinicie esta actividad.
      </q-banner>

      <q-banner v-else-if="attemptState?.attempts_used && !previewMode" rounded class="bg-dark text-grey-3 q-mb-md">
        Te quedan {{ remainingAttempts }} intento(s). Debes alcanzar {{ passingScore }}% para aprobar.
      </q-banner>

      <template v-if="attemptPassed && !previewMode">
        <div class="text-center q-py-lg">
          <q-icon name="mdi-check-decagram-outline" size="54px" color="positive" />
          <div class="text-subtitle1 q-mt-md">Resultado confirmado</div>
          <div class="text-body2 text-grey-5 q-mt-xs">
            Puntaje registrado: {{ attemptState?.score ?? attemptState?.last_attempt?.score ?? passingScore }}%.
          </div>
        </div>
      </template>

      <template v-else-if="attemptLocked && !previewMode">
        <div class="text-center q-py-lg">
          <q-icon name="lock" size="54px" color="negative" />
          <div class="text-subtitle1 q-mt-md">Actividad bloqueada</div>
          <div class="text-body2 text-grey-5 q-mt-xs">
            Ya no hay intentos disponibles para esta actividad.
          </div>
        </div>
      </template>

      <template v-else-if="normalizedActivityType === 'trivia'">
        <div v-if="!started" class="text-center q-py-md">
          <q-icon name="mdi-lightbulb-on-outline" size="42px" color="primary" />
          <div class="q-mt-sm text-subtitle1">Trivia lista para jugar</div>
          <q-btn
            color="primary"
            no-caps
            class="q-mt-md"
            label="Iniciar trivia"
            :disable="!previewMode && remainingAttempts <= 0"
            @click="startTrivia"
          />
        </div>

        <div
          v-else-if="!isFinished && currentQuestion"
          v-motion
          :initial="{ opacity: 0 }"
          :enter="{ opacity: 1 }"
        >
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}
          </div>
          <div class="q-mb-md">{{ currentQuestion.prompt }}</div>
          <div class="column q-gutter-sm">
            <q-btn
              v-for="option in currentQuestion.options"
              :key="`${currentQuestion.id}-${option.id}`"
              class="text-left justify-start"
              color="secondary"
              flat
              no-caps
              @click="answerTrivia(option)"
            >
              {{ option.text }}
            </q-btn>
          </div>
        </div>

        <div v-else class="text-center q-py-md">
          <q-icon name="mdi-trophy-outline" size="42px" color="positive" />
          <div class="text-subtitle1 q-mt-sm">Actividad completada</div>
          <div class="text-body2 q-mt-xs">
            Puntaje: {{ finalScore }} / {{ maxScore }}
          </div>
          <q-btn
            class="q-mt-md"
            color="positive"
            no-caps
            icon="mdi-check-circle-outline"
            :label="previewMode && previewCompletionSent ? 'Vista previa finalizada' : (previewMode ? 'Finalizar vista previa' : 'Registrar resultado')"
            :disable="completionSent"
            @click="emitCompleted"
          />
        </div>
      </template>

      <MatchingActivity
        v-else-if="isMatchingType"
        :payload="payload"
        :preview-mode="previewMode"
        @completed="forwardCompleted"
      />

      <CrosswordActivity
        v-else-if="isCrosswordType"
        :payload="payload"
        :preview-mode="previewMode"
        @completed="forwardCompleted"
      />

      <template v-else>
        <div class="q-pa-md rounded-borders bg-dark text-grey-3">
          <div class="text-subtitle2 q-mb-sm">
            Renderizador base para tipo "{{ activityType }}"
          </div>
          <div class="text-caption">
            Este tipo de actividad puede personalizarse con assets JSON/ZIP y nuevas plantillas sin tocar el esquema de base de datos.
          </div>
        </div>
        <div class="q-mt-md">
          <q-btn color="primary" no-caps label="Marcar actividad como completada" @click="forwardCompleted({ score: 1, max_score: 1 })" />
        </div>
      </template>
    </div>
  </q-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CrosswordActivity from 'src/components/course/CrosswordActivity.vue'
import MatchingActivity from 'src/components/course/MatchingActivity.vue'

const props = defineProps({
  interactiveConfig: {
    type: Object,
    default: null,
  },
  previewMode: {
    type: Boolean,
    default: false,
  },
  attemptState: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['completed'])

const started = ref(false)
const currentQuestionIndex = ref(0)
const finalScore = ref(0)
const previewCompletionSent = ref(false)
const completionSent = ref(false)

const payload = computed(() => props.interactiveConfig?.config_payload || {})
const activityType = computed(() => props.interactiveConfig?.activity_type || 'trivia')
const normalizedActivityType = computed(() => String(activityType.value || 'trivia').trim().toLowerCase())
const isMatchingType = computed(() => ['matching', 'match', 'emparejamiento', 'relacionar'].includes(normalizedActivityType.value))
const isCrosswordType = computed(() => ['crossword', 'crucigrama'].includes(normalizedActivityType.value))
const activityTypeLabel = computed(() => normalizedActivityType.value.toUpperCase())
const authoringModeLabel = computed(() => (props.interactiveConfig?.authoring_mode === 'custom' ? 'Custom' : 'Formulario'))
const activityTitle = computed(() => payload.value?.title || 'Actividad interactiva')

const questions = computed(() => {
  const source = Array.isArray(payload.value?.questions) ? payload.value.questions : []

  return source.map((question, index) => {
    const rawOptions = Array.isArray(question.options) ? question.options : []
    const options = rawOptions.map((option, optionIndex) => {
      if (typeof option === 'string') {
        return { id: `${index}-${optionIndex}`, text: option, isCorrect: false, value: option }
      }

      return {
        id: option.id ?? `${index}-${optionIndex}`,
        text: option.text ?? option.label ?? `Opción ${optionIndex + 1}`,
        isCorrect: Boolean(option.is_correct),
        value: option.value ?? option.text ?? option.label,
      }
    })

    return {
      id: question.id ?? index + 1,
      prompt: question.prompt ?? question.question ?? 'Pregunta sin texto',
      options,
      correctAnswer: question.correct_answer ?? null,
      points: Number(question.points ?? 1),
    }
  })
})

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)
const isFinished = computed(() => currentQuestionIndex.value >= questions.value.length)
const maxScore = computed(() => questions.value.reduce((sum, question) => sum + question.points, 0))
const interactiveMaxAttempts = computed(() => Number(props.interactiveConfig?.max_attempts || 3))
const passingScore = computed(() => Number(props.interactiveConfig?.passing_score || 70))
const remainingAttempts = computed(() => {
  if (!props.attemptState) return interactiveMaxAttempts.value
  return Number(props.attemptState.remaining_attempts ?? Math.max(0, interactiveMaxAttempts.value - Number(props.attemptState.attempts_used || 0)))
})
const attemptPassed = computed(() => Boolean(props.attemptState?.passed || props.attemptState?.status === 'completed'))
const attemptLocked = computed(() => Boolean(props.attemptState?.locked || props.attemptState?.requires_teacher_reset || (!attemptPassed.value && remainingAttempts.value <= 0 && Number(props.attemptState?.attempts_used || 0) > 0)))

function startTrivia() {
  started.value = true
  currentQuestionIndex.value = 0
  finalScore.value = 0
}

function answerTrivia(option) {
  if (!currentQuestion.value) return

  const question = currentQuestion.value
  const isCorrectByFlag = option.isCorrect
  const isCorrectByValue =
    question.correctAnswer !== null &&
    String(option.value).toLowerCase() === String(question.correctAnswer).toLowerCase()

  if (isCorrectByFlag || isCorrectByValue) {
    finalScore.value += question.points
  }

  currentQuestionIndex.value += 1
}

function emitCompleted() {
  if (completionSent.value) return
  completionSent.value = true
  if (props.previewMode) previewCompletionSent.value = true

  emit('completed', {
    score: finalScore.value || maxScore.value,
    max_score: maxScore.value || finalScore.value || 1,
  })
}

function forwardCompleted(result) {
  if (completionSent.value) return
  completionSent.value = true
  emit('completed', {
    score: Number(result?.score ?? 0),
    max_score: Number(result?.max_score ?? 1),
  })
}

watch(
  () => props.interactiveConfig,
  () => {
    started.value = false
    currentQuestionIndex.value = 0
    finalScore.value = 0
    previewCompletionSent.value = false
    completionSent.value = false
  },
  { deep: true, immediate: true },
)
</script>
