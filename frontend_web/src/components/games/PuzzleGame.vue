<template>
  <div class="puzzle-game">
    <h4 class="q-mb-md">🧩 Juego de Rompecabezas</h4>

    <div v-if="!gameStarted" class="text-center q-py-lg">
      <q-icon name="mdi-puzzle" size="64px" color="grey-7" />
      <h4 class="q-mt-md" style="color: #8b8ba7">Ordena las piezas para completar la imagen</h4>
      <q-btn
        color="primary"
        icon="mdi-play"
        label="Comenzar juego"
        class="q-mt-md"
        @click="startGame"
      />
    </div>

    <div v-else>
      <!-- Puzzle Grid -->
      <div class="puzzle-container q-mb-lg">
        <div class="grid" :style="{ 'grid-template-columns': `repeat(${gridSize}, 1fr)` }">
          <div
            v-for="(tile, index) in tiles"
            :key="index"
            class="puzzle-tile"
            :class="{ empty: tile === null, correct: isTileCorrect(index) }"
            @click="moveTile(index)"
          >
            <template v-if="tile !== null">
              {{ tile }}
            </template>
            <q-icon v-else name="mdi-close" size="24px" color="grey-7" />
          </div>
        </div>
      </div>

      <!-- Controls & Stats -->
      <div class="row items-center justify-between">
        <div>
          <div style="color: #8b8ba7">Movimientos: {{ moves }}</div>
          <div style="color: #8b8ba7">
            Tiempo: {{ minutes }}:{{ seconds.toString().padStart(2, '0') }}
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="mdi-refresh" label="Reiniciar" @click="resetGame" />
          <q-btn color="positive" icon="mdi-check" label="Resolver" @click="solvePuzzle" />
        </div>
      </div>

      <!-- Completion Message -->
      <q-dialog v-model="completed">
        <q-card class="glass-card q-pa-lg" style="width: 400px; max-width: 90vw">
          <q-card-section class="text-center">
            <q-icon name="mdi-trophy" size="64px" color="primary" class="q-mb-md" />
            <h4 class="q-mb-sm">¡Rompecabezas completado!</h4>
            <p style="color: #8b8ba7">
              Completaste el rompecabezas en {{ moves }} movimientos y {{ minutes }}:{{
                seconds.toString().padStart(2, '0')
              }}
              minutos.
            </p>
            <div class="text-h5 q-mt-md">Puntuación: {{ score }}</div>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn color="primary" label="Continuar" @click="closeDialog" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from 'src/services/api'

const props = defineProps({
  config: {
    type: Object,
    default: () => ({ size: 3 }),
  },
  maxScore: {
    type: Number,
    default: 100,
  },
})

const emit = defineEmits(['completed'])

const gameStarted = ref(false)
const gridSize = ref(3)
const tiles = ref([])
const emptyIndex = ref(0)
const moves = ref(0)
const startTime = ref(null)
const elapsedTime = ref(0)
const timer = ref(null)
const completed = ref(false)
const score = ref(0)
const gameSessionId = ref(null)

const minutes = computed(() => Math.floor(elapsedTime.value / 60))
const seconds = computed(() => elapsedTime.value % 60)

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
    gridSize.value = props.config.size || 3
    initializePuzzle()
    startTimer()
  } catch (error) {
    console.error('Error iniciando juego:', error)
    // Continuar sin sesión de juego (modo demo)
    gameStarted.value = true
    gridSize.value = props.config.size || 3
    initializePuzzle()
    startTimer()
  }
}

function initializePuzzle() {
  const totalTiles = gridSize.value * gridSize.value
  const numbers = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1)
  numbers.push(null) // Empty tile

  // Shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  tiles.value = numbers
  emptyIndex.value = tiles.value.indexOf(null)
  moves.value = 0
  elapsedTime.value = 0
  completed.value = false
}

function startTimer() {
  startTime.value = Date.now()
  timer.value = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
}

function moveTile(index) {
  if (completed.value) return

  const row = Math.floor(index / gridSize.value)
  const col = index % gridSize.value
  const emptyRow = Math.floor(emptyIndex.value / gridSize.value)
  const emptyCol = emptyIndex.value % gridSize.value

  // Check if adjacent to empty tile
  const isAdjacent =
    (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
    (Math.abs(col - emptyCol) === 1 && row === emptyRow)

  if (isAdjacent) {
    // Swap tiles
    ;[tiles.value[index], tiles.value[emptyIndex.value]] = [
      tiles.value[emptyIndex.value],
      tiles.value[index],
    ]
    emptyIndex.value = index
    moves.value++

    // Check if puzzle is solved
    if (isPuzzleSolved()) {
      completePuzzle()
    }
  }
}

function isTileCorrect(index) {
  if (tiles.value[index] === null) return false
  return tiles.value[index] === index + 1
}

function isPuzzleSolved() {
  for (let i = 0; i < tiles.value.length - 1; i++) {
    if (tiles.value[i] !== i + 1) return false
  }
  return tiles.value[tiles.value.length - 1] === null
}

async function completePuzzle() {
  completed.value = true
  clearInterval(timer.value)

  // Calculate score based on moves and time
  const maxMoves = gridSize.value * gridSize.value * 10
  const maxTime = 300 // 5 minutes
  const moveScore = Math.max(
    0,
    props.maxScore * 0.6 - (moves.value / maxMoves) * props.maxScore * 0.6
  )
  const timeScore = Math.max(
    0,
    props.maxScore * 0.4 - (elapsedTime.value / maxTime) * props.maxScore * 0.4
  )
  score.value = Math.round(moveScore + timeScore)

  // Enviar resultados al backend si hay sesión de juego
  if (gameSessionId.value) {
    try {
      await api.put(`/game-sessions/${gameSessionId.value}`, {
        score: score.value,
        time_spent: elapsedTime.value,
        details: {
          moves: moves.value,
          grid_size: gridSize.value,
        },
      })
    } catch (error) {
      console.error('Error enviando resultados del juego:', error)
    }
  }

  emit('completed', score.value)
}

function resetGame() {
  clearInterval(timer.value)
  initializePuzzle()
  startTimer()
}

function solvePuzzle() {
  // Auto-solve by arranging tiles in order
  const totalTiles = gridSize.value * gridSize.value
  tiles.value = Array.from({ length: totalTiles }, (_, i) => i + 1)
  tiles.value[tiles.value.length - 1] = null
  emptyIndex.value = tiles.value.length - 1
  completePuzzle()
}

function closeDialog() {
  completed.value = false
}

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>

<style scoped>
.puzzle-game {
  .puzzle-container {
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
  }

  .grid {
    display: grid;
    gap: 4px;
    aspect-ratio: 1;
  }

  .puzzle-tile {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: white;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    &.empty {
      background: transparent;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      cursor: default;

      &:hover {
        transform: none;
      }
    }

    &.correct {
      background: linear-gradient(135deg, #00b894, #55efc4);
    }
  }
}
</style>
