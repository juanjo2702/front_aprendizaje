<template>
  <div class="column q-gutter-md">
    <q-card class="preview-card q-pa-lg">
      <div class="cover-preview q-mb-md">
        <img v-if="coverSource" :src="coverSource" alt="Portada del curso" />
        <div v-else class="cover-empty">
          <q-icon name="image" size="42px" />
          <span>Portada pendiente</span>
        </div>
      </div>
      <q-badge color="secondary" outline class="q-mb-md">Vista previa en vivo</q-badge>
      <div class="text-caption text-grey-5 q-mb-sm">
        {{ categoryLabel }} · {{ levelLabel }} · {{ languageLabel }}
      </div>
      <div class="text-h5 text-weight-bold q-mb-sm">
        {{ form.title || 'Tu curso todavía no tiene título' }}
      </div>
      <div class="text-body1 text-grey-3 q-mb-md">
        {{ form.short_description || 'Aquí aparecerá el resumen corto que verá el estudiante.' }}
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-auto">
          <q-badge :color="statusColor">{{ statusLabel }}</q-badge>
        </div>
        <div v-if="form.has_certificate" class="col-auto">
          <q-badge color="secondary" outline>
            Certificado desde {{ normalizedScore }}%
          </q-badge>
        </div>
        <div v-if="form.has_certificate && form.certificate_requires_final_exam" class="col-auto">
          <q-badge color="warning" outline>
            Requiere examen final
          </q-badge>
        </div>
        <div class="col-auto">
          <q-badge color="primary" outline>
            {{ formattedPrice }}
          </q-badge>
        </div>
      </div>

      <div class="text-body2 text-grey-4" style="white-space: pre-line">
        {{ form.description || 'La descripción larga del curso se mostrará aquí mientras la vas escribiendo.' }}
      </div>

      <q-banner
        v-if="form.has_certificate && form.certificate_requires_final_exam"
        rounded
        class="bg-warning text-dark q-mt-md"
      >
        Este curso pedirá aprobar un examen final dentro de la plataforma antes de habilitar el certificado.
      </q-banner>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6">
        <q-card class="preview-card q-pa-lg full-height">
          <div class="text-subtitle1 text-weight-bold q-mb-md">Lo que aprenderán</div>
          <div v-if="whatYouLearn.length" class="column q-gutter-sm">
            <div v-for="(item, index) in whatYouLearn" :key="`learn-${index}`" class="row items-start q-gutter-sm">
              <q-icon name="check_circle" color="positive" size="18px" class="q-mt-xs" />
              <div class="col text-body2">{{ item }}</div>
            </div>
          </div>
          <div v-else class="text-body2 text-grey-5">
            Cuando agregues objetivos de aprendizaje aparecerán aquí.
          </div>
        </q-card>
      </div>

      <div class="col-12 col-lg-6">
        <q-card class="preview-card q-pa-lg full-height">
          <div class="text-subtitle1 text-weight-bold q-mb-md">Requisitos</div>
          <div v-if="requirements.length" class="column q-gutter-sm">
            <div v-for="(item, index) in requirements" :key="`req-${index}`" class="row items-start q-gutter-sm">
              <q-icon name="radio_button_checked" color="primary" size="14px" class="q-mt-sm" />
              <div class="col text-body2">{{ item }}</div>
            </div>
          </div>
          <div v-else class="text-body2 text-grey-5">
            Aquí se listarán los requisitos previos del curso.
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
  levelOptions: {
    type: Array,
    default: () => [],
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
})

const requirements = computed(() => serializeList(props.form.requirements_text))
const whatYouLearn = computed(() => serializeList(props.form.what_you_learn_text))
const categoryLabel = computed(() => props.categoryOptions.find((item) => item.value === props.form.category_id)?.label || 'Sin categoría')
const levelLabel = computed(() => props.levelOptions.find((item) => item.value === props.form.level)?.label || 'Todos los niveles')
const statusLabel = computed(() => props.statusOptions.find((item) => item.value === props.form.status)?.label || 'Borrador')
const languageLabel = computed(() => (props.form.language || 'es').toUpperCase())
const normalizedScore = computed(() => Number(props.form.certificate_min_score || 70))
const formattedPrice = computed(() => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD' }).format(Number(props.form.price || 0)))
const coverSource = computed(() => props.form.thumbnail_preview || props.form.thumbnail || '')
const statusColor = computed(() => ({
  draft: 'warning',
  pending: 'orange',
  published: 'positive',
  archived: 'grey-6',
}[props.form.status] || 'primary'))

function serializeList(text = '') {
  return String(text)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}
</script>

<style scoped>
.preview-card {
  background: linear-gradient(160deg, rgba(26, 26, 62, 0.92), rgba(20, 20, 45, 0.92));
  border: 1px solid rgba(108, 92, 231, 0.28);
  border-radius: 18px;
}

.cover-preview {
  height: 190px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-empty {
  height: 100%;
  display: grid;
  place-items: center;
  color: #9aa1d3;
}
</style>
