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
        <div class="text-h6 q-mb-md">{{ currentQuestion.text }}</div>

        <div class="options q-gutter-y-sm">
          <q-btn
            v-for="(option, idx) in currentQuestion.options"
            :key="idx"
            flat
            no-caps
            :label="option.text"
            class="full-width text-left justify-start option-btn"
            :class="{
              correct: selectedOption === idx && option.is_correct,
              incorrect: selectedOption === idx && !option.is_correct,
            }"
            :disable="answered"
            @click="selectOption(idx)"
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
          :disable="selectedOption === null"
          @click="nextQuestion"
        />
        <q-btn v-else color="positive" icon="mdi-check" label="Continuar" @click="nextQuestion" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const selectedOption = ref(null)
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
    initializeQuestions()
    startTimer()
  } catch (error) {
    console.error('Error iniciando juego:', error)
    // Continuar sin sesión de juego (modo demo)
    gameStarted.value = true
    startTime.value = Date.now()
    initializeQuestions()
    startTimer()
  }
}

function initializeQuestions() {
  // If config has questions, use them, else generate dummy
  if (props.config.questions && props.config.questions.length > 0) {
    questions.value = props.config.questions
  } else {
    questions.value = [
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
    ]
  }
}

function startTimer() {
  timeLeft.value = timeLimit
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      endGame()
    }
  }, 1000)
}

function selectOption(index) {
  if (answered.value) return
  selectedOption.value = index
  answered.value = true

  if (currentQuestion.value.options[index].is_correct) {
    correctAnswers.value++
  }

  clearInterval(timer)
}

function nextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    selectedOption.value = null
    answered.value = false
    startTimer()
  } else {
    endGame()
  }
}

async function endGame() {
  clearInterval(timer)
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

onMounted(() => {
  // Nothing
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
