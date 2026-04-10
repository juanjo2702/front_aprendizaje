<template>
  <div class="memory-game">
    <h4 class="q-mb-md">🎮 Juego de Memoria</h4>

    <div v-if="!gameStarted && config.id" class="text-center q-py-lg">
      <q-icon name="mdi-gamepad-variant" size="64px" color="grey-7" />
      <h4 class="q-mt-md" style="color: #8b8ba7">
        Encuentra los pares de cartas en el menor tiempo posible
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
      <div class="grid" :style="{ 'grid-template-columns': `repeat(${cols}, 1fr)` }">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="memory-card"
          :class="{ flipped: card.flipped, matched: card.matched }"
          @click="flipCard(index)"
        >
          <div class="card-front">
            <q-icon name="mdi-help-circle" size="32px" />
          </div>
          <div class="card-back">
            {{ card.value }}
          </div>
        </div>
      </div>

      <div class="row items-center justify-between q-mt-lg">
        <div>
          <div style="color: #8b8ba7">Pares encontrados: {{ matchedPairs }} / {{ totalPairs }}</div>
          <div style="color: #8b8ba7">Intentos: {{ attempts }}</div>
          <div style="color: #8b8ba7">Tiempo: {{ elapsedTime }}s</div>
        </div>
        <q-btn color="primary" icon="mdi-refresh" label="Reiniciar" @click="resetGame" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from 'src/services/api'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({ pairs: 6 }),
  },
  maxScore: {
    type: Number,
    default: 100,
  },
})

const emit = defineEmits(['completed'])

const cards = ref([])
const flippedCards = ref([])
const matchedPairs = ref(0)
const attempts = ref(0)
const gameOver = ref(false)
const gameStarted = ref(false)
const gameSessionId = ref(null)
const startTime = ref(null)
const elapsedTime = ref(0)
let timer = null
let gameTimer = null

const cols = computed(() => Math.ceil(Math.sqrt(props.config.pairs * 2)))
const totalPairs = computed(() => props.config.pairs)

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
    startGameTimer()
    initializeCards()
  } catch (error) {
    console.error('Error iniciando juego:', error)
    // Continuar sin sesión de juego (modo demo)
    gameStarted.value = true
    startTime.value = Date.now()
    startGameTimer()
    initializeCards()
  }
}

function startGameTimer() {
  elapsedTime.value = 0
  gameTimer = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
}

function initializeCards() {
  const values = []
  for (let i = 0; i < props.config.pairs; i++) {
    values.push(String.fromCharCode(65 + i))
    values.push(String.fromCharCode(65 + i))
  }
  // Shuffle
  values.sort(() => Math.random() - 0.5)

  cards.value = values.map((value) => ({
    value,
    flipped: false,
    matched: false,
  }))
}

function flipCard(index) {
  if (gameOver.value) return
  if (cards.value[index].flipped || cards.value[index].matched) return
  if (flippedCards.value.length >= 2) return

  cards.value[index].flipped = true
  flippedCards.value.push(index)

  if (flippedCards.value.length === 2) {
    attempts.value++
    const [first, second] = flippedCards.value
    if (cards.value[first].value === cards.value[second].value) {
      cards.value[first].matched = true
      cards.value[second].matched = true
      matchedPairs.value++

      if (matchedPairs.value === totalPairs.value) {
        gameOver.value = true
        clearInterval(gameTimer)
        const score = Math.max(0, props.maxScore - attempts.value * 2)
        finishGame(score)
      }
    }

    setTimeout(() => {
      cards.value[first].flipped = false
      cards.value[second].flipped = false
      flippedCards.value = []
    }, 1000)
  }
}

async function finishGame(score) {
  const totalTimeSpent = Math.floor((Date.now() - startTime.value) / 1000)

  // Enviar resultados al backend si hay sesión de juego
  if (gameSessionId.value) {
    try {
      await api.put(`/game-sessions/${gameSessionId.value}`, {
        score: score,
        time_spent: totalTimeSpent,
        details: {
          attempts: attempts.value,
          matched_pairs: matchedPairs.value,
          total_pairs: totalPairs.value,
        },
      })
    } catch (error) {
      console.error('Error enviando resultados del juego:', error)
    }
  }

  emit('completed', score)
}

function resetGame() {
  flippedCards.value = []
  matchedPairs.value = 0
  attempts.value = 0
  gameOver.value = false
  startTime.value = Date.now()
  elapsedTime.value = 0
  clearInterval(gameTimer)
  startGameTimer()
  initializeCards()
}

onMounted(() => {
  // Si no hay config.id, comenzar automáticamente (modo demo)
  if (!props.config.id) {
    gameStarted.value = true
    startTime.value = Date.now()
    startGameTimer()
    initializeCards()
  }
})

onUnmounted(() => {
  if (gameTimer) clearInterval(gameTimer)
})
</script>

<style scoped>
.memory-game {
  .grid {
    display: grid;
    gap: 10px;
    margin: 20px 0;
  }

  .memory-card {
    aspect-ratio: 1;
    border-radius: 8px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: white;
    cursor: pointer;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.6s;

    &.flipped {
      transform: rotateY(180deg);
    }

    &.matched {
      background: linear-gradient(135deg, #00b894, #55efc4);
      cursor: default;
    }
  }

  .card-front,
  .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-front {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  }

  .card-back {
    background: linear-gradient(135deg, #fd79a8, #e84393);
    transform: rotateY(180deg);
  }
}
</style>
