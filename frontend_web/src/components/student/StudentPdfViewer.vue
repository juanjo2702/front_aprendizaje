<template>
  <div class="pdf-shell">
    <iframe :src="source" title="Visor de documento" />
  </div>
</template>

<script setup>
defineProps({
  source: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.pdf-shell {
  border-radius: 20px;
  overflow: hidden;
  min-height: 70vh;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pdf-shell iframe {
  width: 100%;
  min-height: 70vh;
  border: 0;
  background: #ffffff;
}
</style>
