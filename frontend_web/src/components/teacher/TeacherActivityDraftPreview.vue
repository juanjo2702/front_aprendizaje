<template>
  <q-card flat bordered class="draft-preview-card">
    <q-card-section class="row items-center justify-between q-pb-sm">
      <div>
        <div class="text-subtitle1 text-weight-bold">Vista previa en vivo</div>
        <div class="text-caption text-grey-5">
          Esta simulación se actualiza mientras editas la configuración.
        </div>
      </div>
      <q-badge outline color="secondary">
        {{ activityTypeLabel }}
      </q-badge>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-banner v-if="parseError" rounded class="bg-negative text-white">
        {{ parseError }}
      </q-banner>

      <ActivityRenderer
        v-else
        :interactive-config="interactiveConfig"
        :preview-mode="true"
        @completed="handleCompleted"
      />

      <q-banner
        v-if="lastResult"
        rounded
        class="bg-positive text-white q-mt-md"
      >
        Vista previa simulada completada. Puntaje: {{ lastResult.score }} / {{ lastResult.max_score }}.
      </q-banner>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ActivityRenderer from 'src/components/course/ActivityRenderer.vue'

const props = defineProps({
  activityType: {
    type: String,
    default: 'trivia',
  },
  authoringMode: {
    type: String,
    default: 'form',
  },
  configText: {
    type: String,
    default: '',
  },
})

const lastResult = ref(null)

const activityTypeLabel = computed(() => {
  const normalized = String(props.activityType || 'trivia').trim().toLowerCase()

  if (normalized === 'matching') return 'Emparejamiento'
  if (normalized === 'crossword') return 'Crucigrama'
  return 'Trivia'
})

const parsedPayload = computed(() => {
  const rawText = props.configText?.trim()
  if (!rawText) return {}

  return JSON.parse(rawText)
})

const parseError = computed(() => {
  try {
    parsedPayload.value
    return ''
  } catch {
    return 'La configuración JSON no es válida todavía. Corrígela para ver la actividad.'
  }
})

const interactiveConfig = computed(() => ({
  activity_type: props.activityType || 'trivia',
  authoring_mode: props.authoringMode || 'form',
  config_payload: parseError.value ? {} : parsedPayload.value,
}))

function handleCompleted(result) {
  lastResult.value = {
    score: Number(result?.score ?? 0),
    max_score: Number(result?.max_score ?? 1),
  }
}

watch(
  () => [props.activityType, props.authoringMode, props.configText],
  () => {
    lastResult.value = null
  },
)
</script>

<style scoped>
.draft-preview-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
