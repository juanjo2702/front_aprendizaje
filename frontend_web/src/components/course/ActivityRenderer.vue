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
        </div>
        <q-badge :color="previewMode ? 'secondary' : 'primary'" outline>
          {{ previewMode ? 'Vista previa' : 'Actividad interactiva' }}
        </q-badge>
      </div>

      <template v-if="normalizedActivityType === 'trivia'">
        <div v-if="!started" class="text-center q-py-md">
          <q-icon name="mdi-lightbulb-on-outline" size="42px" color="primary" />
          <div class="q-mt-sm text-subtitle1">Trivia lista para jugar</div>
          <q-btn color="primary" no-caps class="q-mt-md" label="Iniciar trivia" @click="startTrivia" />
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
              :key="option.id"
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
            :disable="previewMode && previewCompletionSent"
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
})

const emit = defineEmits(['completed'])

const started = ref(false)
const currentQuestionIndex = ref(0)
const finalScore = ref(0)
const previewCompletionSent = ref(false)

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
  if (props.previewMode && previewCompletionSent.value) return
  if (props.previewMode) previewCompletionSent.value = true

  emit('completed', {
    score: finalScore.value || maxScore.value,
    max_score: maxScore.value || finalScore.value || 1,
  })
}

function forwardCompleted(result) {
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
  },
  { deep: true, immediate: true },
)
</script>
