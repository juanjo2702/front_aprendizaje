<template>
  <q-card flat bordered class="settings-panel q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1 text-weight-bold">Intentos y recompensas</div>
        <div class="text-caption text-grey-5">Esto conecta la actividad con XP, monedas y condición de aprobación.</div>
      </div>
      <q-chip square color="secondary" text-color="dark">
        {{ summaryText }}
      </q-chip>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-3">
        <q-input v-model.number="maxAttemptsProxy" type="number" min="1" max="20" label="Intentos máximos" outlined dense />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model.number="passingScoreProxy" type="number" min="0" max="100" suffix="%" label="Nota mínima" outlined dense />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model.number="xpRewardProxy" type="number" min="0" max="5000" label="XP base" outlined dense />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model.number="coinRewardProxy" type="number" min="0" max="5000" label="Monedas base" outlined dense />
      </div>
    </div>

    <q-banner rounded class="bg-dark text-grey-3 q-mt-md">
      Penalización automática:
      intento 1 = 100%,
      intento 2 = 70%,
      intento 3+ = 50%.
      Si se agotan los intentos sin aprobar, la actividad queda bloqueada hasta reset docente.
    </q-banner>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  maxAttempts: { type: Number, default: 3 },
  passingScore: { type: Number, default: 70 },
  xpReward: { type: Number, default: 100 },
  coinReward: { type: Number, default: 25 },
})

const emit = defineEmits([
  'update:maxAttempts',
  'update:passingScore',
  'update:xpReward',
  'update:coinReward',
])

const maxAttemptsProxy = computed({
  get: () => props.maxAttempts,
  set: (value) => emit('update:maxAttempts', Number(value || 1)),
})

const passingScoreProxy = computed({
  get: () => props.passingScore,
  set: (value) => emit('update:passingScore', Number(value || 0)),
})

const xpRewardProxy = computed({
  get: () => props.xpReward,
  set: (value) => emit('update:xpReward', Number(value || 0)),
})

const coinRewardProxy = computed({
  get: () => props.coinReward,
  set: (value) => emit('update:coinReward', Number(value || 0)),
})

const summaryText = computed(() => {
  return `${props.maxAttempts} intentos · ${props.passingScore}% · ${props.xpReward} XP · ${props.coinReward} monedas`
})
</script>

<style scoped>
.settings-panel {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
}
</style>
