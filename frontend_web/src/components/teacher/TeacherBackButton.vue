<template>
  <q-btn
    flat
    no-caps
    rounded
    icon="arrow_back"
    :label="label"
    class="teacher-back-btn"
    @click="goBack"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  label: { type: String, default: 'Volver' },
  fallbackRoute: {
    type: Object,
    default: () => ({ name: 'teacher-dashboard' }),
  },
})

const router = useRouter()

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.go(-1)
    return
  }

  router.push(props.fallbackRoute)
}
</script>

<style scoped>
.teacher-back-btn {
  color: #eaeaf5;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
