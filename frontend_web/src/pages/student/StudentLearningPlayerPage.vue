<template>
  <q-page class="player-page">
    <LearningPlayer :initial-lesson-id="lessonId" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LearningPlayer from 'src/components/student/LearningPlayer.vue'

const route = useRoute()
const lessonId = computed(() => Number(route.params.lessonId || 0))
</script>

<style scoped>
.player-page {
  padding: 22px;
}
</style>
