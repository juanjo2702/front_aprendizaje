<template>
  <div class="avatar-frame-shell" :class="[normalizedFrameClass, { 'is-clickable': clickable }]" :style="shellStyle" :data-cy="normalizedFrameClass">
    <q-avatar :size="`${size}px`" class="avatar-core">
      <img v-if="src" :src="src" :alt="alt || name || 'Avatar'" />
      <span v-else>{{ initials }}</span>
    </q-avatar>
    <div v-if="frameSvg" class="avatar-frame-svg" v-html="frameSvg" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
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

const normalizedFrameClass = computed(() => props.frameClass || 'frame-default')
const shellStyle = computed(() => ({
  '--frame-size': `${props.size + 12}px`,
  '--avatar-size': `${props.size}px`,
}))

const initials = computed(() =>
  String(props.name || '')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
)
</script>

<style scoped>
.avatar-frame-shell {
  width: var(--frame-size);
  height: var(--frame-size);
  border-radius: 999px;
  padding: 6px;
  position: relative;
  display: inline-grid;
  place-items: center;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 45%),
    linear-gradient(135deg, rgba(100, 110, 255, 0.4), rgba(35, 215, 235, 0.18));
  box-shadow: 0 12px 24px rgba(4, 8, 24, 0.28);
}

.avatar-frame-shell.is-clickable {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.avatar-frame-shell.is-clickable:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 16px 28px rgba(4, 8, 24, 0.36);
}

.avatar-core {
  width: var(--avatar-size);
  height: var(--avatar-size);
  background: rgba(255, 255, 255, 0.08);
  color: #eef1ff;
  font-weight: 700;
  font-size: calc(var(--avatar-size) * 0.32);
}

.avatar-frame-svg {
  position: absolute;
  inset: 1px;
  pointer-events: none;
}

.avatar-frame-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.frame-default {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.frame-gold {
  background:
    radial-gradient(circle at top left, rgba(255, 253, 213, 0.48), transparent 44%),
    linear-gradient(135deg, #fbe17a, #f4a53d 55%, #9b5a18);
}

.frame-neon {
  background:
    radial-gradient(circle at top left, rgba(190, 255, 255, 0.55), transparent 40%),
    linear-gradient(135deg, #2ce7e6, #6366f1 55%, #992eff);
}

.frame-fire {
  background:
    radial-gradient(circle at top left, rgba(255, 234, 195, 0.48), transparent 40%),
    linear-gradient(135deg, #ffb347, #ff5f6d 50%, #8f1d1d);
}

.frame-ice {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.5), transparent 44%),
    linear-gradient(135deg, #bbf7ff, #3b82f6 55%, #132b74);
}

.frame-emerald {
  background:
    radial-gradient(circle at top left, rgba(236, 255, 247, 0.46), transparent 42%),
    linear-gradient(135deg, #65f5b4, #14b8a6 55%, #0d4d52);
}
</style>
