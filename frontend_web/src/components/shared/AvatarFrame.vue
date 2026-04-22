<template>
  <AvatarConMarco
    :src="src"
    :name="name"
    :alt="alt"
    :size="size"
    :frame-class="frameClass"
    :frame-svg="frameSvg"
    :clickable="clickable"
  />
</template>

<script setup>
import AvatarConMarco from 'src/components/shared/AvatarConMarco.vue'

defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 56,
  },
  frameClass: {
    type: String,
    default: '',
  },
  frameSvg: {
    type: String,
    default: '',
  },
  clickable: {
    type: Boolean,
    default: false,
  },
})
</script>
