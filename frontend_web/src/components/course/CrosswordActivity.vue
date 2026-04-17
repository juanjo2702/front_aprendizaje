<template>
  <div class="crossword-activity">
    <div v-if="!started" class="text-center q-py-md">
      <q-icon name="mdi-crosshairs-question" size="42px" color="primary" />
      <div class="q-mt-sm text-subtitle1">Crucigrama listo para jugar</div>
      <div class="text-body2 text-grey-5 q-mt-xs">
        {{ description }}
      </div>
      <q-btn color="primary" no-caps class="q-mt-md" label="Iniciar crucigrama" @click="startGame" />
    </div>

    <div v-else-if="!submitted" class="column q-gutter-lg">
      <q-banner rounded class="bg-dark text-grey-3">
        Escribe directamente en los cuadritos del tablero. Haz clic en una pista para resaltar su palabra.
      </q-banner>

      <q-banner v-if="validationIssues.length" rounded class="bg-warning text-dark">
        <div class="text-weight-medium">La configuración del crucigrama tiene observaciones:</div>
        <div v-for="issue in validationIssues" :key="issue" class="text-body2">
          - {{ issue }}
        </div>
      </q-banner>

      <div class="row q-col-gutter-lg items-start">
        <div class="col-12 col-lg-5">
          <div class="text-subtitle2 q-mb-sm">Tablero</div>
          <div
            class="crossword-grid"
            :style="{
              gridTemplateColumns: `repeat(${gridCols}, minmax(38px, 1fr))`,
            }"
          >
            <div
              v-for="cell in gridCells"
              :key="cell.key"
              class="crossword-cell"
              :class="{
                block: !cell.active,
                filled: cell.active,
                highlighted: isCellInActiveEntry(cell),
              }"
            >
              <template v-if="cell.active">
                <span v-if="cell.startNumbers.length" class="cell-number-group">
                  <span
                    v-for="startNumber in cell.startNumbers"
                    :key="`${cell.key}-${startNumber}`"
                    class="cell-number"
                  >
                    {{ startNumber }}
                  </span>
                </span>
                <input
                  :data-cell-key="cell.key"
                  class="cell-input"
                  type="text"
                  inputmode="text"
                  maxlength="1"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="characters"
                  spellcheck="false"
                  :value="cell.display"
                  @focus="handleCellFocus(cell)"
                  @input="handleCellInput(cell, $event)"
                  @keydown="handleCellKeydown(cell, $event)"
                />
              </template>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-7">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-sm">Horizontales</div>
              <div class="column q-gutter-sm">
                <button
                  v-for="entry in acrossEntries"
                  :key="entry.id"
                  type="button"
                  class="clue-card"
                  :class="{ active: activeEntryId === entry.id }"
                  @click="selectEntry(entry.id)"
                >
                  <div class="text-body1 text-left">
                    {{ entry.number }}. {{ entry.clue }}
                  </div>
                  <div class="text-caption text-left q-mt-xs">
                    {{ entry.answer.length }} letras · {{ entryResponse(entry).length }}/{{ entry.answer.length }}
                  </div>
                </button>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-subtitle2 q-mb-sm">Verticales</div>
              <div class="column q-gutter-sm">
                <button
                  v-for="entry in downEntries"
                  :key="entry.id"
                  type="button"
                  class="clue-card"
                  :class="{ active: activeEntryId === entry.id }"
                  @click="selectEntry(entry.id)"
                >
                  <div class="text-body1 text-left">
                    {{ entry.number }}. {{ entry.clue }}
                  </div>
                  <div class="text-caption text-left q-mt-xs">
                    {{ entry.answer.length }} letras · {{ entryResponse(entry).length }}/{{ entry.answer.length }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row items-center justify-between">
        <div class="text-body2 text-grey-5">
          {{ answeredCount }} / {{ entries.length }} respuestas completadas
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat no-caps color="grey-4" label="Reiniciar" @click="resetGame" />
          <q-btn
            color="primary"
            no-caps
            label="Corregir crucigrama"
            :disable="entries.length === 0 || validationIssues.length > 0 || answeredCount !== entries.length"
            @click="submitGame"
          />
        </div>
      </div>
    </div>

    <div v-else class="column q-gutter-md">
      <div class="text-center q-py-sm">
        <q-icon name="mdi-check-decagram-outline" size="42px" color="positive" />
        <div class="text-subtitle1 q-mt-sm">Crucigrama completado</div>
        <div class="text-body2 q-mt-xs">
          Puntaje: {{ finalScore }} / {{ maxScore }}
        </div>
      </div>

      <div
        class="crossword-grid solved-grid"
        :style="{
          gridTemplateColumns: `repeat(${gridCols}, minmax(38px, 1fr))`,
        }"
      >
        <div
          v-for="cell in gridCells"
          :key="`${cell.key}-solved`"
          class="crossword-cell"
          :class="{
            block: !cell.active,
            filled: cell.active,
            solved: cell.active,
            correct: cell.active && solvedCellState(cell) === 'correct',
            incorrect: cell.active && solvedCellState(cell) === 'incorrect',
            missing: cell.active && solvedCellState(cell) === 'missing',
          }"
        >
          <span v-if="cell.active && cell.startNumbers.length" class="cell-number-group">
            <span
              v-for="startNumber in cell.startNumbers"
              :key="`${cell.key}-solved-${startNumber}`"
              class="cell-number"
            >
              {{ startNumber }}
            </span>
          </span>
          <span v-if="cell.active" class="cell-letter">
            {{ solvedCellLetter(cell) }}
          </span>
        </div>
      </div>

      <div class="column q-gutter-sm">
        <div
          v-for="entry in entries"
          :key="`${entry.id}-result`"
          class="result-card q-pa-md"
          :class="{ correct: isCorrect(entry), incorrect: !isCorrect(entry) }"
        >
          <div class="text-body1 text-weight-medium">
            {{ entry.number }}. {{ entry.clue }}
          </div>
          <div class="text-body2 q-mt-xs">
            Tu respuesta: {{ entryResponse(entry) || 'Sin respuesta' }}
          </div>
          <div class="text-caption q-mt-sm">
            {{ isCorrect(entry) ? 'Respuesta correcta' : `Correcta: ${entry.answer}` }}
          </div>
        </div>
      </div>

      <div class="row justify-end">
        <q-btn
          color="positive"
          no-caps
          icon="mdi-check-circle-outline"
          :label="previewMode && previewCompletionSent ? 'Vista previa finalizada' : (previewMode ? 'Finalizar vista previa' : 'Registrar resultado')"
          :disable="previewMode && previewCompletionSent"
          @click="emitCompleted"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  payload: {
    type: Object,
    default: () => ({}),
  },
  previewMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['completed'])

const started = ref(false)
const submitted = ref(false)
const cellValues = ref({})
const finalScore = ref(0)
const previewCompletionSent = ref(false)
const activeEntryId = ref(null)

const description = computed(
  () => effectivePayload.value?.description || 'Completa el crucigrama usando las pistas horizontales y verticales.',
)

const legacyDemoEntries = [
  { id: 1, row: 0, col: 0, direction: 'across', clue: 'Interfaz para comunicar sistemas', answer: 'API' },
  { id: 2, row: 0, col: 0, direction: 'down', clue: 'Aplicación instalada en un dispositivo', answer: 'APP' },
  { id: 3, row: 0, col: 2, direction: 'down', clue: 'Sigla corta de inteligencia artificial', answer: 'IA' },
  { id: 4, row: 2, col: 3, direction: 'across', clue: 'Modelo de objetos del documento', answer: 'DOM' },
  { id: 5, row: 2, col: 5, direction: 'down', clue: 'Función que asocia un valor a otro', answer: 'MAP' },
  { id: 6, row: 4, col: 0, direction: 'across', clue: 'Aplicación web progresiva', answer: 'PWA' },
]

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
}

function looksLikeLegacyDemoPayload(payload) {
  const entries = Array.isArray(payload?.entries) ? payload.entries : []
  const clues = entries.map((entry) => String(entry?.clue || '').trim())

  return (
    String(payload?.title || '').trim().toLowerCase() === 'crucigrama de conceptos base' &&
    clues.includes('Interfaz para comunicar sistemas') &&
    clues.includes('Aplicación instalada en un dispositivo') &&
    (
      (
        clues.includes('Lenguaje usado mucho en Laravel') &&
        clues.includes('Dirección numérica en red') &&
        clues.includes('Lenguaje de estilos web') &&
        clues.includes('Capa segura para conexiones web')
      ) ||
      (
        clues.includes('Sigla corta de inteligencia artificial') &&
        clues.includes('Modelo de objetos del documento') &&
        clues.includes('Función que asocia un valor a otro') &&
        (clues.includes('Aplicación de página única') || clues.includes('Aplicación web progresiva'))
      )
    )
  )
}

const effectivePayload = computed(() => {
  if (looksLikeLegacyDemoPayload(props.payload)) {
    return {
      title: 'Crucigrama de conceptos base',
      description: 'Completa el tablero usando las pistas horizontales y verticales.',
      rows: 5,
      cols: 6,
      points_per_word: 10,
      entries: legacyDemoEntries,
    }
  }

  return props.payload || {}
})

const rawEntries = computed(() => {
  const source = Array.isArray(effectivePayload.value?.entries) ? effectivePayload.value.entries : []

  return source
    .map((entry, index) => ({
      id: entry.id ?? index + 1,
      clue: entry.clue ?? `Pista ${index + 1}`,
      answer: normalizeText(entry.answer),
      row: Number(entry.row ?? 0),
      col: Number(entry.col ?? 0),
      direction: String(entry.direction || 'across').toLowerCase() === 'down' ? 'down' : 'across',
      points: Number(entry.points ?? props.payload?.points_per_word ?? 10),
    }))
    .filter((entry) => entry.answer)
})

const gridRows = computed(() => {
  const explicitRows = Number(effectivePayload.value?.rows || 0)
  if (explicitRows > 0) return explicitRows

  return (
    rawEntries.value.reduce((max, entry) => {
      const length = entry.answer.length
      const endRow = entry.direction === 'down' ? entry.row + length : entry.row + 1
      return Math.max(max, endRow)
    }, 0) || 1
  )
})

const gridCols = computed(() => {
  const explicitCols = Number(effectivePayload.value?.cols || 0)
  if (explicitCols > 0) return explicitCols

  return (
    rawEntries.value.reduce((max, entry) => {
      const length = entry.answer.length
      const endCol = entry.direction === 'across' ? entry.col + length : entry.col + 1
      return Math.max(max, endCol)
    }, 0) || 1
  )
})

const entries = computed(() =>
  rawEntries.value
    .map((entry, index) => ({
      ...entry,
      number: index + 1,
    }))
    .sort((left, right) => {
      if (left.number !== right.number) return left.number - right.number
      if (left.row !== right.row) return left.row - right.row
      if (left.col !== right.col) return left.col - right.col
      return left.direction.localeCompare(right.direction)
    }),
)

const acrossEntries = computed(() => entries.value.filter((entry) => entry.direction === 'across'))
const downEntries = computed(() => entries.value.filter((entry) => entry.direction === 'down'))
const maxScore = computed(() => entries.value.reduce((sum, entry) => sum + entry.points, 0))

function entryCells(entry) {
  return entry.answer.split('').map((_, offset) => ({
    key: `${entry.row + (entry.direction === 'down' ? offset : 0)}-${entry.col + (entry.direction === 'across' ? offset : 0)}`,
    row: entry.row + (entry.direction === 'down' ? offset : 0),
    col: entry.col + (entry.direction === 'across' ? offset : 0),
    offset,
  }))
}

const cellMetaByKey = computed(() => {
  const map = new Map()

  entries.value.forEach((entry) => {
    entryCells(entry).forEach((cell, offset) => {
      const existing = map.get(cell.key)

      if (existing) {
        existing.expected = existing.expected === entry.answer[offset] ? existing.expected : existing.expected
        existing.entries.push({ id: entry.id, offset, direction: entry.direction })
        if (offset === 0) {
          existing.startNumbers = [...existing.startNumbers, entry.number].sort((left, right) => left - right)
        }
      } else {
        map.set(cell.key, {
          key: cell.key,
          row: cell.row,
          col: cell.col,
          expected: entry.answer[offset],
          entries: [{ id: entry.id, offset, direction: entry.direction }],
          startNumbers: offset === 0 ? [entry.number] : [],
        })
      }
    })
  })

  return map
})

const validationIssues = computed(() => {
  const issues = []
  const expectedByKey = new Map()

  entries.value.forEach((entry) => {
    const cells = entryCells(entry)

    const beforeRow = entry.row - (entry.direction === 'down' ? 1 : 0)
    const beforeCol = entry.col - (entry.direction === 'across' ? 1 : 0)
    if (cellMetaByKey.value.has(`${beforeRow}-${beforeCol}`)) {
      issues.push(`La palabra "${entry.answer}" no empieza en una celda válida del tablero.`)
    }

    const lastCell = cells[cells.length - 1]
    const afterRow = lastCell.row + (entry.direction === 'down' ? 1 : 0)
    const afterCol = lastCell.col + (entry.direction === 'across' ? 1 : 0)
    if (cellMetaByKey.value.has(`${afterRow}-${afterCol}`)) {
      issues.push(`La palabra "${entry.answer}" continúa más allá de su longitud declarada.`)
    }

    cells.forEach((cell, offset) => {
      if (cell.row >= gridRows.value || cell.col >= gridCols.value) {
        issues.push(`La palabra "${entry.answer}" se sale del tablero definido.`)
        return
      }

      const letter = entry.answer[offset]
      if (expectedByKey.has(cell.key) && expectedByKey.get(cell.key) !== letter) {
        issues.push(`Hay conflicto de letras en la celda ${cell.row + 1},${cell.col + 1}.`)
      } else {
        expectedByKey.set(cell.key, letter)
      }
    })
  })

  return [...new Set(issues)]
})

const gridCells = computed(() => {
  const output = []

  for (let row = 0; row < gridRows.value; row += 1) {
    for (let col = 0; col < gridCols.value; col += 1) {
      const key = `${row}-${col}`
      const meta = cellMetaByKey.value.get(key)

      output.push(
        meta
          ? {
              ...meta,
              active: true,
              display: cellValues.value[key] || '',
              startNumbers: meta.startNumbers || [],
            }
          : {
              key,
              row,
              col,
              active: false,
              expected: '',
              startNumbers: [],
              entries: [],
              display: '',
            },
      )
    }
  }

  return output
})

function entryResponse(entry) {
  return entryCells(entry)
    .map((cell) => cellValues.value[cell.key] || '')
    .join('')
}

function solvedCellLetter(cell) {
  return cellValues.value[cell.key] || ''
}

function solvedCellState(cell) {
  const userLetter = cellValues.value[cell.key] || ''
  if (!userLetter) return 'missing'
  return userLetter === cell.expected ? 'correct' : 'incorrect'
}

const answeredCount = computed(() =>
  entries.value.filter((entry) => entryResponse(entry).length === entry.answer.length).length,
)

function isCorrect(entry) {
  return entryResponse(entry) === entry.answer
}

function findEntryById(entryId) {
  return entries.value.find((entry) => entry.id === entryId) || null
}

function selectEntry(entryId) {
  activeEntryId.value = entryId
}

function isCellInActiveEntry(cell) {
  if (!cell?.active || !activeEntryId.value) return false
  return cell.entries.some((entry) => entry.id === activeEntryId.value)
}

function focusCellByKey(cellKey) {
  nextTick(() => {
    const target = document.querySelector(`[data-cell-key="${cellKey}"]`)
    if (target instanceof HTMLElement) target.focus()
  })
}

function startGame() {
  started.value = true
  submitted.value = false
  finalScore.value = 0
  previewCompletionSent.value = false
  cellValues.value = {}
  activeEntryId.value = entries.value[0]?.id || null
}

function resetGame() {
  submitted.value = false
  finalScore.value = 0
  previewCompletionSent.value = false
  cellValues.value = {}
  activeEntryId.value = entries.value[0]?.id || null
}

function handleCellFocus(cell) {
  if (!cell.active) return
  const preferredEntry = cell.entries.find((entry) => entry.id === activeEntryId.value)?.id || cell.entries[0]?.id
  if (preferredEntry) activeEntryId.value = preferredEntry
}

function handleCellInput(cell, event) {
  if (!cell.active) return

  const value = normalizeText(event.target.value).slice(-1)
  cellValues.value = {
    ...cellValues.value,
    [cell.key]: value,
  }

  if (!value || !activeEntryId.value) return

  const activeEntry = findEntryById(activeEntryId.value)
  if (!activeEntry) return
  const cells = entryCells(activeEntry)
  const currentIndex = cells.findIndex((item) => item.key === cell.key)
  if (currentIndex < 0 || currentIndex >= cells.length - 1) return
  focusCellByKey(cells[currentIndex + 1].key)
}

function handleCellKeydown(cell, event) {
  if (!cell.active || !activeEntryId.value) return

  const activeEntry = findEntryById(activeEntryId.value)
  if (!activeEntry) return

  const cells = entryCells(activeEntry)
  const currentIndex = cells.findIndex((item) => item.key === cell.key)
  if (currentIndex < 0) return

  if (event.key === 'Backspace' && !cellValues.value[cell.key] && currentIndex > 0) {
    focusCellByKey(cells[currentIndex - 1].key)
  }
}

function submitGame() {
  finalScore.value = entries.value.reduce((sum, entry) => sum + (isCorrect(entry) ? entry.points : 0), 0)
  submitted.value = true
}

function emitCompleted() {
  if (props.previewMode && previewCompletionSent.value) return
  if (props.previewMode) previewCompletionSent.value = true

  emit('completed', {
    score: finalScore.value || 0,
    max_score: maxScore.value || 1,
  })
}

watch(
  () => props.payload,
  () => {
    started.value = false
    submitted.value = false
    cellValues.value = {}
    finalScore.value = 0
    previewCompletionSent.value = false
    activeEntryId.value = null
  },
  { deep: true, immediate: true },
)
</script>

<style scoped>
.crossword-grid {
  display: grid;
  gap: 4px;
}

.crossword-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 1px solid rgba(118, 122, 180, 0.18);
  background: rgba(255, 255, 255, 0.03);
  min-height: 38px;
}

.crossword-cell.block {
  background: rgba(10, 11, 33, 0.9);
  border-style: dashed;
  opacity: 0.45;
}

.crossword-cell.filled {
  border-color: rgba(108, 92, 231, 0.35);
}

.crossword-cell.highlighted {
  border-color: rgba(0, 210, 211, 0.7);
  box-shadow: 0 0 0 1px rgba(0, 210, 211, 0.28);
}

.crossword-cell.solved {
  display: flex;
  align-items: center;
  justify-content: center;
}

.crossword-cell.solved.correct {
  border-color: rgba(126, 224, 129, 0.5);
  background: rgba(126, 224, 129, 0.12);
}

.crossword-cell.solved.incorrect {
  border-color: rgba(255, 120, 120, 0.55);
  background: rgba(255, 120, 120, 0.14);
}

.crossword-cell.solved.missing {
  border-color: rgba(255, 196, 102, 0.45);
  background: rgba(255, 196, 102, 0.1);
}

.cell-number-group {
  position: absolute;
  top: 3px;
  left: 4px;
  z-index: 2;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  max-width: calc(100% - 8px);
}

.cell-number {
  font-size: 0.58rem;
  line-height: 1;
  font-weight: 700;
  color: #99f6ff;
  background: rgba(0, 210, 211, 0.1);
  border-radius: 999px;
  padding: 1px 3px;
}

.cell-letter {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f6f7fb;
}

.cell-input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #f6f7fb;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  padding-top: 6px;
}

.clue-card {
  width: 100%;
  border: 1px solid rgba(118, 122, 180, 0.18);
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  color: #f6f7fb;
  transition: all 0.2s ease;
  cursor: pointer;
}

.clue-card:hover {
  border-color: rgba(108, 92, 231, 0.45);
}

.clue-card.active {
  border-color: rgba(0, 210, 211, 0.7);
  background: rgba(0, 210, 211, 0.08);
}

.solved-grid {
  max-width: 420px;
}

.result-card {
  border-radius: 16px;
  border: 1px solid rgba(118, 122, 180, 0.18);
  background: rgba(255, 255, 255, 0.03);
}

.result-card.correct {
  border-color: rgba(126, 224, 129, 0.5);
  background: rgba(126, 224, 129, 0.08);
}

.result-card.incorrect {
  border-color: rgba(255, 140, 140, 0.4);
  background: rgba(255, 140, 140, 0.08);
}
</style>
