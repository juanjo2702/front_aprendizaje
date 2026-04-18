<template>
  <div class="column q-gutter-md">
    <StudentPdfViewer v-if="isPdf" :source="source" />

    <q-card v-else flat bordered class="resource-card">
      <q-card-section>
        <div class="text-h6 q-mb-sm">{{ fileName || 'Recurso descargable' }}</div>
        <div class="text-body2 text-grey-5 q-mb-md">
          Este recurso puede abrirse en una pestaña nueva o descargarse.
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" no-caps icon="open_in_new" label="Abrir recurso" :href="source" target="_blank" />
          <q-btn flat color="secondary" no-caps icon="download" label="Descargar" :href="source" target="_blank" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StudentPdfViewer from 'src/components/student/StudentPdfViewer.vue'

const props = defineProps({
  source: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    default: '',
  },
})

const isPdf = computed(() => String(props.source || '').toLowerCase().includes('.pdf'))
</script>

<style scoped>
.resource-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
