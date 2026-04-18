<template>
  <q-page class="q-pa-xl page-wrap">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Control de Gamificación</h2>
        <p class="q-mb-none">Define cuánto vale cada actividad y cómo se comportan sus intentos dentro del curso.</p>
      </div>
      <q-btn flat no-caps color="grey-4" icon="refresh" label="Recargar" :disable="!selectedCourseId" @click="reloadPageData" />
    </div>

    <q-card class="glass-card q-pa-md q-mb-lg">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-6">
          <q-select v-model="selectedCourseId" :options="courseOptions" emit-value map-options label="Curso" outlined dense @update:model-value="handleCourseChange" />
        </div>
        <div class="col-12 col-md-6 text-caption text-grey-5">
          Ajusta XP, monedas, nota mínima e intentos desde un solo panel.
        </div>
      </div>
    </q-card>

    <div class="row q-col-gutter-md q-mb-lg" v-if="selectedCourseId">
      <div class="col-12 col-md-3" v-for="metric in metrics" :key="metric.label">
        <q-card class="glass-card q-pa-md metric-card">
          <div class="text-caption text-grey-5">{{ metric.label }}</div>
          <div class="text-h4 text-weight-bold">{{ metric.value }}</div>
        </q-card>
      </div>
    </div>

    <q-card class="glass-card q-pa-md">
      <q-table
        flat
        dark
        row-key="id"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        rows-per-page-label="Filas"
      >
        <template #body-cell-lesson="slotProps">
          <q-td :props="slotProps">
            <div class="text-weight-medium">{{ slotProps.row.lesson?.title || 'Sin lección' }}</div>
            <div class="text-caption text-grey-5">{{ slotProps.row.module?.title || 'Sin módulo' }} · {{ slotProps.row.activity_type }}</div>
          </q-td>
        </template>

        <template #body-cell-passing_score="slotProps">
          <q-td :props="slotProps">
            <q-chip dense color="secondary" text-color="dark">{{ slotProps.row.passing_score }}%</q-chip>
          </q-td>
        </template>

        <template #body-cell-rewards="slotProps">
          <q-td :props="slotProps">
            <div class="text-weight-medium">{{ slotProps.row.xp_reward }} XP</div>
            <div class="text-caption text-grey-5">{{ slotProps.row.coin_reward }} monedas</div>
          </q-td>
        </template>

        <template #body-cell-actions="slotProps">
          <q-td :props="slotProps">
            <div class="row justify-end q-gutter-sm">
              <q-btn flat no-caps color="secondary" label="Preview" @click="preview(slotProps.row)" />
              <q-btn flat no-caps color="primary" label="Editar" @click="openDialog(slotProps.row)" />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Ajustar recompensa de actividad</div>
          <q-btn flat round dense icon="close" @click="closeDialog" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="q-mb-md">
            <div class="text-subtitle1 text-weight-bold">{{ editingConfig?.lesson?.title || 'Actividad' }}</div>
            <div class="text-caption text-grey-5">{{ editingConfig?.module?.title || 'Sin módulo' }} · {{ editingConfig?.activity_type }}</div>
          </div>

          <TeacherActivitySettingsPanel
            v-model:max-attempts="form.max_attempts"
            v-model:passing-score="form.passing_score"
            v-model:xp-reward="form.xp_reward"
            v-model:coin-reward="form.coin_reward"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps color="grey-5" label="Cancelar" @click="closeDialog" />
          <q-btn color="primary" no-caps :loading="saving" label="Guardar ajustes" @click="saveConfig" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TeacherActivitySettingsPanel from 'src/components/teacher/TeacherActivitySettingsPanel.vue'
import { api } from 'src/services/api'

const $q = useQuasar()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const selectedCourseId = ref(null)
const courses = ref([])
const rows = ref([])
const editingConfig = ref(null)
const form = ref(emptyForm())

const columns = [
  { name: 'lesson', label: 'Actividad', field: 'lesson', align: 'left' },
  { name: 'max_attempts', label: 'Intentos', field: 'max_attempts', align: 'left' },
  { name: 'passing_score', label: 'Nota mínima', field: 'passing_score', align: 'left' },
  { name: 'rewards', label: 'Recompensas', field: 'rewards', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const courseOptions = computed(() => courses.value.map((course) => ({ label: course.title, value: course.id })))
const metrics = computed(() => {
  const totalXp = rows.value.reduce((accumulator, row) => accumulator + Number(row.xp_reward || 0), 0)
  const totalCoins = rows.value.reduce((accumulator, row) => accumulator + Number(row.coin_reward || 0), 0)
  return [
    { label: 'Actividades', value: rows.value.length },
    { label: 'XP total del curso', value: totalXp },
    { label: 'Monedas potenciales', value: totalCoins },
    { label: 'Promedio de aprobación', value: rows.value.length ? `${Math.round(rows.value.reduce((acc, row) => acc + Number(row.passing_score || 0), 0) / rows.value.length)}%` : '0%' },
  ]
})

function emptyForm() {
  return {
    max_attempts: 3,
    passing_score: 70,
    xp_reward: 100,
    coin_reward: 25,
  }
}

function formatError(error, fallback) {
  const errors = error?.response?.data?.errors
  if (errors) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey && errors[firstKey]?.length) return errors[firstKey][0]
  }
  return error?.response?.data?.message || error?.message || fallback
}

async function loadCourses() {
  const { data } = await api.get('/instructor/courses', { params: { per_page: 100 } })
  courses.value = data?.data || []
  if (!selectedCourseId.value && courses.value.length) {
    selectedCourseId.value = courses.value[0].id
  }
}

async function loadRows() {
  if (!selectedCourseId.value) return
  const { data } = await api.get('/interactive-configs', {
    params: { course_id: selectedCourseId.value, per_page: 100 },
  })
  rows.value = data?.data || []
}

async function handleCourseChange() {
  await reloadPageData()
}

async function reloadPageData() {
  if (!selectedCourseId.value) return
  loading.value = true
  try {
    await loadRows()
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo cargar el panel de gamificación.') })
  } finally {
    loading.value = false
  }
}

function openDialog(config) {
  editingConfig.value = config
  form.value = {
    max_attempts: Number(config.max_attempts || 3),
    passing_score: Number(config.passing_score || 70),
    xp_reward: Number(config.xp_reward || 100),
    coin_reward: Number(config.coin_reward || 25),
  }
  dialog.value = true
}

function closeDialog() {
  if (saving.value) return
  dialog.value = false
  editingConfig.value = null
  form.value = emptyForm()
}

async function saveConfig() {
  if (!editingConfig.value) return
  saving.value = true
  try {
    await api.put(`/interactive-configs/${editingConfig.value.id}`, {
      lesson_id: editingConfig.value.lesson_id,
      authoring_mode: editingConfig.value.authoring_mode,
      activity_type: editingConfig.value.activity_type,
      config_payload: editingConfig.value.config_payload,
      is_active: editingConfig.value.is_active,
      version: editingConfig.value.version,
      max_attempts: Number(form.value.max_attempts || 3),
      passing_score: Number(form.value.passing_score || 70),
      xp_reward: Number(form.value.xp_reward || 0),
      coin_reward: Number(form.value.coin_reward || 0),
    })
    await reloadPageData()
    closeDialog()
    $q.notify({ type: 'positive', message: 'Ajustes de gamificación guardados.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo guardar la configuración.') })
  } finally {
    saving.value = false
  }
}

function preview(config) {
  if (!config?.lesson_id) return
  router.push({ name: 'teacher-lesson-preview', params: { lessonId: config.lesson_id } })
}

onMounted(async () => {
  loading.value = true
  try {
    await loadCourses()
    await reloadPageData()
  } catch (error) {
    $q.notify({ type: 'negative', message: formatError(error, 'No se pudo iniciar el panel de gamificación.') })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrap { max-width: 1260px; margin: 0 auto; }
.dialog-card { width: min(780px, 92vw); max-width: 92vw; }
.metric-card { min-height: 132px; }
</style>
