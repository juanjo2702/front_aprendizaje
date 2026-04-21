<template>
  <q-btn
    flat
    no-caps
    rounded
    icon="arrow_back"
    :label="label"
    class="app-back-btn"
    @click="goBack"
  />
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  label: {
    type: String,
    default: 'Volver',
  },
  fallbackRoute: {
    type: Object,
    default: () => ({ name: 'home' }),
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
.app-back-btn {
  color: #edf2f7;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
