<template>
  <q-page class="admin-page q-pa-xl">
    <div class="page-wrap">
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-lg">
          <h2 class="q-mb-xs">Laboratorio de gamificación</h2>
          <p class="q-mb-none text-grey-5">
            Diseña badges globales, curva de niveles y recompensas de tienda para mantener el sistema equilibrado.
          </p>
        </div>
        <div class="col-12 col-lg-auto row q-gutter-sm">
          <q-btn flat no-caps color="secondary" icon="refresh" label="Recargar" @click="reloadAll" />
        </div>
      </div>

      <q-tabs v-model="tab" no-caps inline-label class="q-mb-lg admin-tabs" active-color="primary" indicator-color="primary">
        <q-tab name="badges" icon="military_tech" label="Badges" />
        <q-tab name="levels" icon="stairs" label="Niveles" />
        <q-tab name="rewards" icon="redeem" label="Tienda" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <q-tab-panel name="badges" class="q-pa-none">
          <div class="row justify-end q-mb-md">
            <q-btn color="primary" no-caps icon="add" label="Nueva insignia" @click="openBadgeDialog()" />
          </div>
          <q-card class="panel-card">
            <q-card-section class="q-pa-none">
              <q-table :rows="badges" :columns="badgeColumns" row-key="id" flat dark>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row justify-end q-gutter-xs">
                      <q-btn flat round color="primary" icon="edit" @click="openBadgeDialog(props.row)" />
                      <q-btn flat round color="negative" icon="delete" @click="deleteBadge(props.row)" />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="levels" class="q-pa-none">
          <q-card class="panel-card q-pa-lg">
            <div class="row items-center justify-between q-mb-lg">
              <div>
                <div class="text-h6 text-weight-bold">Curva de niveles</div>
                <div class="text-caption text-grey-5">Define cuánta XP se requiere para subir de nivel.</div>
              </div>
              <q-btn flat no-caps color="secondary" icon="add" label="Añadir nivel" @click="addLevelRow" />
            </div>

            <div class="column q-gutter-md">
              <div v-for="(level, index) in settings.gamification.levels" :key="`level-${index}`" class="level-row">
                <div class="row q-col-gutter-md items-center">
                  <div class="col-12 col-md-2">
                    <q-input v-model.number="level.level" type="number" outlined dense label="Nivel" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model.number="level.xp_required" type="number" outlined dense label="XP requerida" />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="level.title" outlined dense label="Título" />
                  </div>
                  <div class="col-12 col-md-2 row justify-end">
                    <q-btn flat round color="negative" icon="delete" @click="removeLevelRow(index)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-lg">
              <q-btn color="primary" no-caps label="Guardar niveles" :loading="settingsSaving" @click="saveSettings" />
            </div>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="rewards" class="q-pa-none">
          <div class="row justify-end q-mb-md">
            <q-btn color="primary" no-caps icon="add" label="Nueva recompensa" @click="openRewardDialog()" />
          </div>
          <q-card class="panel-card">
            <q-card-section class="q-pa-none">
              <q-table :rows="rewards" :columns="rewardColumns" row-key="id" flat dark>
                <template #body-cell-is_active="props">
                  <q-td :props="props">
                    <q-badge :color="props.row.is_active ? 'positive' : 'grey-6'" rounded>
                      {{ props.row.is_active ? 'Activa' : 'Pausada' }}
                    </q-badge>
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row justify-end q-gutter-xs">
                      <q-btn flat round color="primary" icon="edit" @click="openRewardDialog(props.row)" />
                      <q-btn flat round color="negative" icon="delete" @click="deleteReward(props.row)" />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>

      <q-dialog v-model="badgeDialog.open" persistent>
        <q-card style="width: min(560px, 92vw)">
          <q-card-section>
            <div class="text-h6">{{ badgeDialog.model?.id ? 'Editar badge' : 'Nuevo badge' }}</div>
          </q-card-section>
          <q-card-section class="column q-gutter-md">
            <q-input v-model="badgeDialog.model.name" outlined label="Nombre" />
            <q-input v-model="badgeDialog.model.description" outlined type="textarea" autogrow label="Descripción" />
            <q-input v-model="badgeDialog.model.icon" outlined label="Icono / nombre Material" />
            <q-select v-model="badgeDialog.model.type" :options="badgeTypeOptions" outlined emit-value map-options label="Tipo" />
            <q-input
              v-model="badgeDialog.criteriaText"
              outlined
              type="textarea"
              autogrow
              label="Criteria JSON"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn color="primary" no-caps label="Guardar" :loading="badgeSaving" @click="saveBadge" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="rewardDialog.open" persistent>
        <q-card style="width: min(620px, 92vw)">
          <q-card-section>
            <div class="text-h6">{{ rewardDialog.model?.id ? 'Editar recompensa' : 'Nueva recompensa' }}</div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6"><q-input v-model="rewardDialog.model.name" outlined label="Nombre" /></div>
            <div class="col-12 col-md-6"><q-select v-model="rewardDialog.model.type" :options="rewardTypeOptions" outlined emit-value map-options label="Tipo" /></div>
            <div class="col-12"><q-input v-model="rewardDialog.model.description" type="textarea" autogrow outlined label="Descripción" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="rewardDialog.model.cost_coins" type="number" outlined label="Costo en monedas" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="rewardDialog.model.minimum_level_required" type="number" outlined label="Nivel mínimo" /></div>
            <div class="col-12 col-md-4"><q-input v-model.number="rewardDialog.model.stock" type="number" outlined label="Stock" /></div>
            <div class="col-12">
              <q-toggle v-model="rewardDialog.model.is_active" color="secondary" label="Recompensa activa" />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn color="primary" no-caps label="Guardar" :loading="rewardSaving" @click="saveReward" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()
const tab = ref('badges')
const badges = ref([])
const rewards = ref([])
const settingsSaving = ref(false)
const badgeSaving = ref(false)
const rewardSaving = ref(false)

const settings = reactive({
  finance: {
    platform_commission_percentage: 20,
    currency: 'BOB',
    minimum_payout_amount: 0,
  },
  gamification: {
    levels: [],
  },
})

const badgeDialog = reactive({
  open: false,
  model: null,
  criteriaText: '{}',
})

const rewardDialog = reactive({
  open: false,
  model: null,
})

const badgeTypeOptions = [
  { label: 'Finalización de curso', value: 'course_completion' },
  { label: 'Racha', value: 'streak' },
  { label: 'Puntos', value: 'points' },
  { label: 'Game master', value: 'game_master' },
  { label: 'Velocidad', value: 'speedster' },
]

const rewardTypeOptions = [
  { label: 'Cupón', value: 'discount_coupon' },
  { label: 'Contenido premium', value: 'premium_content' },
  { label: 'Marco de avatar', value: 'avatar_frame' },
  { label: 'Título de perfil', value: 'profile_title' },
]

const badgeColumns = [
  { name: 'name', label: 'Badge', field: 'name', align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', align: 'center' },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

const rewardColumns = [
  { name: 'name', label: 'Recompensa', field: 'name', align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', align: 'center' },
  { name: 'cost_coins', label: 'Monedas', field: 'cost_coins', align: 'center' },
  { name: 'minimum_level_required', label: 'Nivel', field: 'minimum_level_required', align: 'center' },
  { name: 'is_active', label: 'Estado', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

function emptyBadge() {
  return {
    name: '',
    description: '',
    icon: '',
    type: 'points',
  }
}

function emptyReward() {
  return {
    name: '',
    description: '',
    type: 'avatar_frame',
    cost_coins: 100,
    minimum_level_required: 1,
    stock: null,
    is_active: true,
  }
}

async function loadBadges() {
  const { data } = await api.get('/admin/gamification/badges')
  badges.value = data || []
}

async function loadRewards() {
  const { data } = await api.get('/admin/gamification/rewards')
  rewards.value = data || []
}

async function loadSettings() {
  const { data } = await api.get('/admin/settings')
  settings.finance = {
    ...settings.finance,
    ...(data.finance || {}),
  }
  settings.gamification = {
    ...settings.gamification,
    ...(data.gamification || {}),
  }
}

async function reloadAll() {
  await Promise.all([loadBadges(), loadRewards(), loadSettings()])
}

function addLevelRow() {
  const nextLevel = (settings.gamification.levels.at(-1)?.level || 0) + 1
  settings.gamification.levels.push({
    level: nextLevel,
    xp_required: nextLevel * 250,
    title: 'Nuevo nivel',
  })
}

function removeLevelRow(index) {
  settings.gamification.levels.splice(index, 1)
}

function openBadgeDialog(badge = null) {
  badgeDialog.open = true
  badgeDialog.model = badge ? { ...badge } : emptyBadge()
  badgeDialog.criteriaText = JSON.stringify(badge?.criteria || {}, null, 2)
}

function openRewardDialog(reward = null) {
  rewardDialog.open = true
  rewardDialog.model = reward ? { ...reward } : emptyReward()
}

async function saveBadge() {
  badgeSaving.value = true
  try {
    const payload = {
      ...badgeDialog.model,
      criteria: JSON.parse(badgeDialog.criteriaText || '{}'),
    }

    if (badgeDialog.model.id) {
      await api.put(`/admin/gamification/badges/${badgeDialog.model.id}`, payload)
    } else {
      await api.post('/admin/gamification/badges', payload)
    }

    badgeDialog.open = false
    $q.notify({ type: 'positive', message: 'Badge guardado correctamente.' })
    await loadBadges()
  } finally {
    badgeSaving.value = false
  }
}

async function deleteBadge(badge) {
  await api.delete(`/admin/gamification/badges/${badge.id}`)
  $q.notify({ type: 'positive', message: 'Badge eliminado correctamente.' })
  await loadBadges()
}

async function saveReward() {
  rewardSaving.value = true
  try {
    if (rewardDialog.model.id) {
      await api.put(`/admin/gamification/rewards/${rewardDialog.model.id}`, rewardDialog.model)
    } else {
      await api.post('/admin/gamification/rewards', rewardDialog.model)
    }

    rewardDialog.open = false
    $q.notify({ type: 'positive', message: 'Recompensa guardada correctamente.' })
    await loadRewards()
  } finally {
    rewardSaving.value = false
  }
}

async function deleteReward(reward) {
  await api.delete(`/admin/gamification/rewards/${reward.id}`)
  $q.notify({ type: 'positive', message: 'Recompensa eliminada correctamente.' })
  await loadRewards()
}

async function saveSettings() {
  settingsSaving.value = true
  try {
    await api.put('/admin/settings', {
      finance: settings.finance,
      gamification: settings.gamification,
    })
    $q.notify({ type: 'positive', message: 'Niveles actualizados correctamente.' })
  } finally {
    settingsSaving.value = false
  }
}

onMounted(reloadAll)
</script>

<style scoped lang="scss">
.admin-page {
  background: transparent;
}

.page-wrap {
  max-width: 1340px;
  margin: 0 auto;
}

.panel-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}

.level-row,
.admin-tabs {
  background: rgba(8, 18, 36, 0.72);
  border: 1px solid rgba(93, 122, 255, 0.12);
  border-radius: 18px;
  padding: 16px;
}

.admin-tabs {
  padding: 0;
}
</style>
