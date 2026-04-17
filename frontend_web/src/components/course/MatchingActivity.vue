<template>
  <div class="matching-activity">
    <div v-if="!started" class="text-center q-py-md">
      <q-icon name="device_hub" size="42px" color="primary" />
      <div class="q-mt-sm text-subtitle1">Emparejamiento listo para jugar</div>
      <div class="text-body2 text-grey-5 q-mt-xs">
        {{ description }}
      </div>
      <q-btn color="primary" no-caps class="q-mt-md" label="Iniciar emparejamiento" @click="startGame" />
    </div>

    <div v-else-if="!submitted" class="column q-gutter-lg">
      <q-banner rounded class="bg-dark text-grey-3">
        Selecciona un concepto de la izquierda y luego su definición en la derecha.
      </q-banner>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <div class="text-subtitle2 q-mb-sm">Conceptos</div>
          <div class="column q-gutter-sm">
            <button
              v-for="pair in normalizedPairs"
              :key="pair.id"
              type="button"
              class="pair-card"
              :class="{
                selected: selectedLeftId === pair.id,
                completed: Boolean(assignments[pair.id]),
              }"
              @click="selectLeft(pair.id)"
            >
              <div class="text-body1 text-left">{{ pair.left }}</div>
              <div class="text-caption text-left q-mt-xs">
                {{ assignments[pair.id] ? 'Emparejado' : 'Pendiente' }}
              </div>
            </button>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="text-subtitle2 q-mb-sm">Definiciones</div>
          <div class="column q-gutter-sm">
            <button
              v-for="choice in rightChoices"
              :key="choice.id"
              type="button"
              class="pair-card choice-card"
              :class="{
                selected: isChoiceAssignedToSelected(choice.id),
                locked: isChoiceTaken(choice.id),
              }"
              @click="assignChoice(choice.id)"
            >
              <div class="text-body1 text-left">{{ choice.right }}</div>
              <div class="text-caption text-left q-mt-xs">
                {{ choiceHint(choice.id) }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="row items-center justify-between">
        <div class="text-body2 text-grey-5">
          {{ matchedCount }} / {{ normalizedPairs.length }} relaciones asignadas
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat no-caps color="grey-4" label="Reiniciar" @click="resetGame" />
          <q-btn
            color="primary"
            no-caps
            label="Corregir emparejamiento"
            :disable="matchedCount !== normalizedPairs.length"
            @click="submitGame"
          />
        </div>
      </div>
    </div>

    <div v-else class="column q-gutter-md">
      <div class="text-center q-py-sm">
        <q-icon name="mdi-check-decagram-outline" size="42px" color="positive" />
        <div class="text-subtitle1 q-mt-sm">Emparejamiento completado</div>
        <div class="text-body2 q-mt-xs">
          Puntaje: {{ finalScore }} / {{ maxScore }}
        </div>
      </div>

      <div class="column q-gutter-sm">
        <div
          v-for="pair in normalizedPairs"
          :key="pair.id"
          class="result-card q-pa-md"
          :class="{ correct: isCorrect(pair.id), incorrect: !isCorrect(pair.id) }"
        >
          <div class="text-body1 text-weight-medium">{{ pair.left }}</div>
          <div class="text-body2 q-mt-xs">
            {{ choiceText(assignments[pair.id]) }}
          </div>
          <div class="text-caption q-mt-sm">
            {{ isCorrect(pair.id) ? 'Respuesta correcta' : `Correcta: ${pair.right}` }}
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
import { computed, ref, watch } from 'vue'

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
const selectedLeftId = ref(null)
const assignments = ref({})
const shuffledRightIds = ref([])
const finalScore = ref(0)
const previewCompletionSent = ref(false)

const description = computed(
  () => props.payload?.description || 'Relaciona cada concepto con su definición correcta.',
)

const normalizedPairs = computed(() => {
  const source = Array.isArray(props.payload?.pairs) ? props.payload.pairs : []

  return source
    .map((pair, index) => ({
      id: pair.id ?? index + 1,
      left: pair.left ?? pair.term ?? pair.concept ?? `Concepto ${index + 1}`,
      right:
        pair.right ??
        pair.definition ??
        pair.answer ??
        `Definición ${index + 1}`,
      points: Number(pair.points ?? props.payload?.points_per_pair ?? 10),
    }))
    .filter((pair) => pair.left && pair.right)
})

const rightChoices = computed(() =>
  shuffledRightIds.value
    .map((id) => normalizedPairs.value.find((pair) => pair.id === id))
    .filter(Boolean),
)

const matchedCount = computed(() => Object.keys(assignments.value).length)
const maxScore = computed(() =>
  normalizedPairs.value.reduce((sum, pair) => sum + pair.points, 0),
)

function shuffle(values) {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function startGame() {
  started.value = true
  submitted.value = false
  selectedLeftId.value = null
  assignments.value = {}
  finalScore.value = 0
  shuffledRightIds.value = shuffle(normalizedPairs.value.map((pair) => pair.id))
}

function resetGame() {
  selectedLeftId.value = null
  assignments.value = {}
  submitted.value = false
  finalScore.value = 0
  shuffledRightIds.value = shuffle(normalizedPairs.value.map((pair) => pair.id))
}

function selectLeft(leftId) {
  selectedLeftId.value = leftId
}

function assignChoice(choiceId) {
  if (!selectedLeftId.value) return

  const ownerLeftId = Object.entries(assignments.value).find(([, rightId]) => Number(rightId) === Number(choiceId))?.[0]
  if (ownerLeftId && Number(ownerLeftId) !== Number(selectedLeftId.value)) {
    return
  }

  assignments.value = {
    ...assignments.value,
    [selectedLeftId.value]: choiceId,
  }
  selectedLeftId.value = null
}

function isChoiceTaken(choiceId) {
  return Object.values(assignments.value).some((assignedId) => Number(assignedId) === Number(choiceId))
}

function isChoiceAssignedToSelected(choiceId) {
  return Number(assignments.value[selectedLeftId.value]) === Number(choiceId)
}

function choiceHint(choiceId) {
  if (isChoiceAssignedToSelected(choiceId)) return 'Asignado al concepto seleccionado'
  if (isChoiceTaken(choiceId)) return 'Ya asignado'
  return 'Disponible'
}

function choiceText(choiceId) {
  return normalizedPairs.value.find((pair) => Number(pair.id) === Number(choiceId))?.right || 'Sin asignar'
}

function isCorrect(leftId) {
  return Number(assignments.value[leftId]) === Number(leftId)
}

function submitGame() {
  finalScore.value = normalizedPairs.value.reduce((sum, pair) => {
    return sum + (isCorrect(pair.id) ? pair.points : 0)
  }, 0)
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
    selectedLeftId.value = null
    assignments.value = {}
    shuffledRightIds.value = []
    finalScore.value = 0
    previewCompletionSent.value = false
  },
  { deep: true, immediate: true },
)
</script>

<style scoped>
.pair-card {
  width: 100%;
  border: 1px solid rgba(118, 122, 180, 0.18);
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  color: #f6f7fb;
  transition: all 0.2s ease;
  cursor: pointer;
}

.pair-card:hover {
  border-color: rgba(108, 92, 231, 0.45);
  transform: translateY(-1px);
}

.pair-card.selected {
  border-color: rgba(0, 210, 211, 0.7);
  box-shadow: 0 0 0 1px rgba(0, 210, 211, 0.3);
}

.pair-card.completed {
  border-color: rgba(126, 224, 129, 0.4);
}

.choice-card.locked {
  opacity: 0.72;
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
