<template>
  <q-page class="admin-page q-pa-xl">
    <div class="page-wrap">
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-lg">
          <h2 class="q-mb-xs">Reportes y auditoría</h2>
          <p class="q-mb-none text-grey-5">
            Detecta cuellos de botella pedagógicos y desbalances en XP o recompensas antes de que rompan la experiencia.
          </p>
        </div>
        <div class="col-12 col-lg-auto row q-gutter-sm">
          <q-btn flat no-caps color="secondary" icon="refresh" label="Recargar" @click="reloadAll" />
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-xl-7">
          <q-card class="panel-card q-mb-lg">
            <q-card-section>
              <div class="text-h6 text-weight-bold">Cuellos de botella</div>
              <div class="text-caption text-grey-5">Actividades que casi nadie logra pasar.</div>
            </q-card-section>
            <q-separator dark />
            <q-card-section class="q-pa-none">
              <q-table :rows="bottlenecks" :columns="bottleneckColumns" row-key="interactive_config_id" flat dark>
                <template #body-cell-severity="props">
                  <q-td :props="props">
                    <q-badge :color="severityColor(props.row.severity)" rounded>
                      {{ props.row.severity }}
                    </q-badge>
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row justify-end q-gutter-xs">
                      <q-btn flat round color="secondary" icon="visibility" @click="previewLesson(props.row)" />
                      <q-btn flat round color="primary" icon="tune" @click="openConfigDialog(props.row)" />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-xl-5">
          <q-card class="panel-card">
            <q-card-section>
              <div class="text-h6 text-weight-bold">Auditoría de gamificación</div>
              <div class="text-caption text-grey-5">Detecta XP y monedas fuera de balance.</div>
            </q-card-section>
            <q-separator dark />
            <q-card-section class="column q-gutter-md">
              <q-card v-for="item in anomalies" :key="item.interactive_config_id" flat bordered class="anomaly-card">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">{{ item.lesson?.title || 'Actividad' }}</div>
                  <div class="text-caption text-grey-5">{{ item.course?.title || 'Curso' }}</div>
                  <ul class="q-mt-sm q-mb-none">
                    <li v-for="issue in item.issues" :key="issue">{{ issue }}</li>
                  </ul>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps color="secondary" label="Preview" @click="previewLesson(item)" />
                  <q-btn flat no-caps color="primary" label="Ajustar" @click="openConfigDialog(item)" />
                </q-card-actions>
              </q-card>
              <div v-if="!anomalies.length" class="text-grey-5">No se detectaron anomalías críticas.</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-dialog v-model="configDialog.open" persistent>
        <q-card style="width: min(560px, 92vw)">
          <q-card-section>
            <div class="text-h6">Ajustar actividad</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ configDialog.lessonTitle }}</div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model.number="configDialog.model.max_attempts" type="number" outlined dense label="Máx. intentos" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model.number="configDialog.model.passing_score" type="number" outlined dense label="Passing score" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model.number="configDialog.model.xp_reward" type="number" outlined dense label="XP" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model.number="configDialog.model.coin_reward" type="number" outlined dense label="Monedas" />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn color="primary" no-caps label="Guardar ajuste" :loading="configSaving" @click="saveConfig" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()
const router = useRouter()
const bottlenecks = ref([])
const anomalies = ref([])
const configSaving = ref(false)

const configDialog = reactive({
  open: false,
  lessonTitle: '',
  courseTitle: '',
  courseId: null,
  courseSlug: '',
  lessonId: null,
  interactiveConfigId: null,
  model: {
    max_attempts: 3,
    passing_score: 70,
    xp_reward: 100,
    coin_reward: 25,
  },
})

const bottleneckColumns = [
  { name: 'lesson', label: 'Lección', field: (row) => row.lesson?.title || '-', align: 'left' },
  { name: 'course', label: 'Curso', field: (row) => row.course?.title || '-', align: 'left' },
  { name: 'failure_rate', label: 'Fallo %', field: (row) => `${row.failure_rate}%`, align: 'center' },
  { name: 'average_attempts', label: 'Intentos prom.', field: 'average_attempts', align: 'center' },
  { name: 'severity', label: 'Severidad', field: 'severity', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

function severityColor(severity) {
  return ({ critical: 'negative', warning: 'warning', healthy: 'positive' }[severity] || 'grey-6')
}

async function loadBottlenecks() {
  const { data } = await api.get('/admin/reports/bottlenecks')
  bottlenecks.value = data || []
}

async function loadAudit() {
  const { data } = await api.get('/admin/reports/gamification-audit')
  anomalies.value = data.anomalies || []
}

async function reloadAll() {
  await Promise.all([loadBottlenecks(), loadAudit()])
}

function previewLesson(row) {
  const lessonId = row.lesson?.id
  const course = row.course
  if (!lessonId) return

  router.push({
    name: 'admin-lesson-preview',
    params: { lessonId },
    query: {
      courseId: String(course?.id || ''),
      courseTitle: course?.title || '',
    },
  })
}

function openConfigDialog(row) {
  configDialog.open = true
  configDialog.lessonTitle = row.lesson?.title || 'Actividad'
  configDialog.courseTitle = row.course?.title || ''
  configDialog.courseId = row.course?.id || null
  configDialog.courseSlug = row.course?.slug || ''
  configDialog.lessonId = row.lesson?.id || null
  configDialog.interactiveConfigId = row.interactive_config_id
  configDialog.model = {
    max_attempts: Number(row.max_attempts || 3),
    passing_score: Number(row.passing_score || 70),
    xp_reward: Number(row.xp_reward || 100),
    coin_reward: Number(row.coin_reward || 25),
  }
}

async function saveConfig() {
  if (!configDialog.interactiveConfigId) return
  configSaving.value = true
  try {
    await api.put(`/interactive-configs/${configDialog.interactiveConfigId}`, configDialog.model)
    $q.notify({
      type: 'positive',
      message: 'Actividad ajustada correctamente.',
    })
    configDialog.open = false
    await reloadAll()
  } finally {
    configSaving.value = false
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

.panel-card,
.anomaly-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}
</style>
