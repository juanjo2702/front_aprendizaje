<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card class="dialog-card" data-cy="teacher-course-dialog">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">{{ course ? 'Editar curso' : 'Crear curso' }}</div>
        <q-btn flat round dense icon="close" @click="emit('update:modelValue', false)" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-lg-6">
            <div class="row q-col-gutter-md">
              <div class="col-12"><q-input v-model="form.title" data-cy="course-title-input" label="Título" outlined dense /></div>
              <div class="col-12"><q-input v-model="form.short_description" data-cy="course-short-description-input" label="Resumen corto" outlined dense maxlength="300" counter /></div>
              <div class="col-12"><q-input v-model="form.description" data-cy="course-description-input" type="textarea" label="Descripción" outlined autogrow /></div>
              <div class="col-12 col-md-4"><q-input v-model.number="form.price" data-cy="course-price-input" label="Precio" type="number" outlined dense min="0" step="0.01" /></div>
              <div class="col-12 col-md-4"><q-select v-model="form.category_id" data-cy="course-category-select" :options="categoryOptions" emit-value map-options label="Categoría" outlined dense clearable /></div>
              <div class="col-12 col-md-4"><q-select v-model="form.level" data-cy="course-level-select" :options="levelOptions" emit-value map-options label="Nivel" outlined dense /></div>
              <div class="col-12 col-md-4"><q-input v-model="form.language" data-cy="course-language-input" label="Idioma" outlined dense maxlength="10" /></div>
              <div class="col-12 col-md-4"><q-select v-model="form.status" data-cy="course-status-select" :options="statusOptions" emit-value map-options label="Estado" outlined dense /></div>
              <div class="col-12 col-md-4 flex flex-center"><q-toggle v-model="form.has_certificate" data-cy="course-has-certificate-toggle" color="secondary" label="Emitir certificado" /></div>
              <div class="col-12" v-if="form.has_certificate">
                <q-input v-model.number="form.certificate_min_score" data-cy="course-certificate-min-score-input" label="Puntaje mínimo" type="number" outlined dense min="0" max="100" />
              </div>
              <div class="col-12" v-if="form.has_certificate">
                <q-toggle
                  v-model="form.certificate_requires_final_exam"
                  data-cy="course-final-exam-toggle"
                  color="warning"
                  label="Requerir examen final dentro de la plataforma"
                />
                <div class="text-caption text-grey-5 q-mt-xs">
                  Después podrás elegir la lección de actividad que funcionará como examen final desde el Course Builder.
                </div>
              </div>
              <div class="col-12 col-md-6"><q-input v-model="form.requirements_text" type="textarea" label="Requisitos (uno por línea)" outlined autogrow /></div>
              <div class="col-12 col-md-6"><q-input v-model="form.what_you_learn_text" type="textarea" label="Lo que aprenderás (uno por línea)" outlined autogrow /></div>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <TeacherCourseLivePreview
              :form="form"
              :category-options="categoryOptions"
              :level-options="levelOptions"
              :status-options="statusOptions"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="between" class="q-px-md q-pb-md">
          <q-btn flat no-caps color="secondary" icon="auto_fix_high" data-cy="course-load-template-btn" label="Cargar ejemplo" @click="fillDemoTemplate" />
          <div class="row q-gutter-sm">
            <q-btn flat no-caps color="grey-5" label="Cancelar" @click="emit('update:modelValue', false)" />
            <q-btn color="primary" no-caps data-cy="course-save-btn" :loading="saving" :label="course ? 'Guardar cambios' : 'Crear curso'" @click="submit" />
          </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import TeacherCourseLivePreview from 'src/components/teacher/TeacherCourseLivePreview.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  course: { type: Object, default: null },
  categoryOptions: { type: Array, default: () => [] },
  levelOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])
const form = ref(emptyForm())

function emptyForm() {
  return {
    title: '',
    description: '',
    short_description: '',
    price: 0,
    category_id: null,
    level: 'all_levels',
    language: 'es',
    status: 'draft',
    has_certificate: false,
    certificate_requires_final_exam: false,
    certificate_min_score: 70,
    requirements_text: '',
    what_you_learn_text: '',
  }
}

function resetForm() {
  if (!props.course) {
    form.value = emptyForm()
    return
  }

  form.value = {
    title: props.course.title || '',
    description: props.course.description || '',
    short_description: props.course.short_description || '',
    price: Number(props.course.price || 0),
    category_id: props.course.category_id || null,
    level: props.course.level || 'all_levels',
    language: props.course.language || 'es',
    status: props.course.status || 'draft',
    has_certificate: Boolean(props.course.has_certificate),
    certificate_requires_final_exam: Boolean(props.course.certificate_requires_final_exam),
    certificate_min_score: Number(props.course.certificate_min_score || 70),
    requirements_text: (props.course.requirements || []).join('\n'),
    what_you_learn_text: (props.course.what_you_learn || []).join('\n'),
  }
}

function serializeList(text) {
  return text.split('\n').map((item) => item.trim()).filter(Boolean)
}

function submit() {
  emit('save', {
    title: form.value.title?.trim(),
    description: form.value.description?.trim() || null,
    short_description: form.value.short_description?.trim() || null,
    price: Number(form.value.price || 0),
    category_id: form.value.category_id || null,
    level: form.value.level,
    language: form.value.language?.trim() || 'es',
    status: form.value.status,
    requirements: serializeList(form.value.requirements_text),
    what_you_learn: serializeList(form.value.what_you_learn_text),
    has_certificate: Boolean(form.value.has_certificate),
    certificate_requires_final_exam: Boolean(form.value.has_certificate && form.value.certificate_requires_final_exam),
    certificate_min_score: Number(form.value.certificate_min_score || 70),
  })
}

function fillDemoTemplate() {
  const stamp = new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  form.value = {
    ...form.value,
    title: `Curso Demo Docente ${stamp}`,
    short_description: 'Curso de prueba para validar crear, editar, publicar y eliminar.',
    description: 'Este curso demo sirve para probar el flujo del docente mientras dejamos lista la edición de módulos, clases y actividades.',
    price: 0,
    level: 'beginner',
    language: 'es',
    status: 'draft',
    has_certificate: true,
    certificate_requires_final_exam: true,
    certificate_min_score: 70,
    requirements_text: 'Cuenta docente activa\nNavegador actualizado',
    what_you_learn_text: 'Crear cursos\nEditar información\nValidar el flujo docente\nPreparar módulos y clases',
  }
}

watch(() => [props.modelValue, props.course], ([open]) => {
  if (open) resetForm()
})
</script>

<style scoped>
.dialog-card { width: min(1200px, 94vw); max-width: 94vw; }
</style>
