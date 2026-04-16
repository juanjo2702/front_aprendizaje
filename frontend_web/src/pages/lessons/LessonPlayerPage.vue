<template>
  <q-page class="q-pa-md">
    <course-player :initial-lesson-id="lessonId" :preview-mode="previewMode" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CoursePlayer from 'src/components/course/CoursePlayer.vue'

const props = defineProps({
  previewMode: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const lessonId = computed(() => Number(route.params.lessonId || 0))
const previewMode = computed(() => props.previewMode)
</script>
