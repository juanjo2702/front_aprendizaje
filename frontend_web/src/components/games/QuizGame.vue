<template>
  <div class="quiz-game">
    <h4 class="q-mb-md">📝 Juego de Preguntas Rápidas</h4>

    <div v-if="!gameStarted" class="text-center q-py-lg">
      <q-icon name="mdi-help-circle" size="64px" color="grey-7" />
      <h4 class="q-mt-md" style="color: #8b8ba7">
        Responde correctamente en el menor tiempo posible
      </h4>
      <q-btn
        color="primary"
        icon="mdi-play"
        label="Comenzar juego"
        class="q-mt-md"
        @click="startGame"
      />
    </div>

    <div v-else>
      <!-- Timer -->
      <div class="row justify-center q-mb-lg">
        <q-circular-progress
          :value="timeLeft"
          :max="timeLimit"
          size="80px"
          :thickness="0.2"
          color="primary"
          track-color="dark"
          class="q-mb-md"
        >
          <div class="text-h6">{{ timeLeft }}</div>
        </q-circular-progress>
      </div>

      <!-- Question -->
      <div class="question-card glass-card q-pa-lg q-mb-lg">
        <div class="text-h6 q-mb-md">{{ currentQuestion.prompt || currentQuestion.text }}</div>

        <div :key="currentQuestion.id || currentQuestionIndex" class="options q-gutter-y-sm">
          <q-btn
            v-for="option in currentQuestion.options || []"
            :key="option.localId"
            flat
            no-caps
            :label="option.text"
            class="full-width text-left justify-start option-btn"
            :class="{
              correct: selectedOptionId === option.localId && option.is_correct,
              incorrect: selectedOptionId === option.localId && !option.is_correct,
            }"
            :disable="answered"
            @click="selectOption(option.localId)"
          />
        </div>
      </div>

      <!-- Stats -->
      <div class="row items-center justify-between">
        <div>
          <div style="color: #8b8ba7">
            Pregunta {{ currentQuestionIndex + 1 }} de {{ questions.length }}
          </div>
          <div style="color: #8b8ba7">Correctas: {{ correctAnswers }}</div>
        </div>
        <q-btn
          v-if="!answered"
          color="primary"
          icon="mdi-skip-next"
          label="Siguiente"
          :disable="selectedOptionId === null"
          @click="nextQuestion"
        />
        <q-btn v-else color="positive" icon="mdi-check" label="Continuar" @click="nextQuestion" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { api } from 'src/services/api'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({ questions: [], id: null }),
  },
  maxScore: {
    type: Number,
    default: 100,
  },
})

const emit = defineEmits(['completed'])

const gameStarted = ref(false)
const questions = ref([])
const currentQuestionIndex = ref(0)
const selectedOptionId = ref(null)
const answered = ref(false)
const correctAnswers = ref(0)
const timeLeft = ref(30)
const timeLimit = 30
const gameSessionId = ref(null)
const startTime = ref(null)
const totalTimeSpent = ref(0)
let timer = null

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {})

async function startGame() {
  try {
    // Crear sesión de juego en el backend
    if (props.config.id) {
      const response = await api.post('/game-sessions/start', {
        game_config_id: props.config.id,
      })
      gameSessionId.value = response.data.id
    }

    gameStarted.value = true
    startTime.value = Date.now()
    currentQuestionIndex.value = 0
    correctAnswers.value = 0
    answered.value = false
    selectedOptionId.value = null
    initializeQuestions()
    startTimer()
  } catch (error) {
    console.error('Error iniciando juego:', error)
    // Continuar sin sesión de juego (modo demo)
    gameStarted.value = true
    startTime.value = Date.now()
    currentQuestionIndex.value = 0
    correctAnswers.value = 0
    answered.value = false
    selectedOptionId.value = null
    initializeQuestions()
    startTimer()
  }
}

function initializeQuestions() {
  // If config has questions, use them, else generate dummy
  if (props.config.questions && props.config.questions.length > 0) {
    questions.value = normalizeQuestions(props.config.questions)
  } else {
    questions.value = normalizeQuestions([
      {
        text: '¿Laravel es un framework de PHP?',
        options: [
          { text: 'Verdadero', is_correct: true },
          { text: 'Falso', is_correct: false },
        ],
      },
      {
        text: '¿Vue.js fue creado por Evan You?',
        options: [
          { text: 'Verdadero', is_correct: true },
          { text: 'Falso', is_correct: false },
        ],
      },
      {
        text: '¿Quasar es un framework basado en React?',
        options: [
          { text: 'Verdadero', is_correct: false },
          { text: 'Falso', is_correct: true },
        ],
      },
    ])
  }
}

function normalizeQuestions(sourceQuestions = []) {
  return sourceQuestions.map((question, questionIndex) => ({
    ...question,
    id: question.id || `question-${questionIndex}`,
    text: question.text || question.prompt || '',
    prompt: question.prompt || question.text || '',
    options: (question.options || []).map((option, optionIndex) => ({
      ...option,
      localId: option.id || `${question.id || questionIndex}-option-${optionIndex}`,
      text: option.text || option.label || '',
    })),
  }))
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  clearTimer()
  timeLeft.value = timeLimit
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearTimer()
      endGame()
    }
  }, 1000)
}

function selectOption(optionId) {
  if (answered.value) return
  const option = currentQuestion.value.options?.find((item) => item.localId === optionId)
  if (!option) return

  selectedOptionId.value = optionId
  answered.value = true

  if (option.is_correct) {
    correctAnswers.value++
  }

  clearTimer()
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    selectedOptionId.value = null
    answered.value = false
    startTimer()
  } else {
    endGame()
  }
}

async function endGame() {
  clearTimer()
  const score = Math.round((correctAnswers.value / questions.value.length) * props.maxScore)
  totalTimeSpent.value = Math.floor((Date.now() - startTime.value) / 1000)

  // Enviar resultados al backend si hay sesión de juego
  if (gameSessionId.value) {
    try {
      await api.put(`/game-sessions/${gameSessionId.value}`, {
        score: score,
        time_spent: totalTimeSpent.value,
        details: {
          correct_answers: correctAnswers.value,
          total_questions: questions.value.length,
        },
      })
    } catch (error) {
      console.error('Error enviando resultados del juego:', error)
    }
  }

  emit('completed', score)
}

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<style scoped>
.quiz-game {
  .option-btn {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--q-primary);
      background-color: rgba(108, 92, 231, 0.1);
    }

    &.correct {
      border-color: #00b894;
      background-color: rgba(0, 184, 148, 0.1);
    }

    &.incorrect {
      border-color: #ff7675;
      background-color: rgba(255, 118, 117, 0.1);
    }
  }

  .question-card {
    border-radius: 12px;
  }
}
</style>
