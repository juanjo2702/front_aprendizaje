<template>
  <q-card flat bordered class="reading-card">
    <q-card-section>
      <div class="reading-body" v-html="renderedContent" />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

const renderedContent = computed(() =>
  String(props.content || '')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />'),
)
</script>

<style scoped>
.reading-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.reading-body {
  color: #f2f4ff;
  line-height: 1.8;
}

.reading-body :deep(h1),
.reading-body :deep(h2),
.reading-body :deep(h3) {
  margin-top: 1.1rem;
  margin-bottom: 0.5rem;
}
</style>
