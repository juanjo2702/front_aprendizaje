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

const normalizedFrameClass = computed(() => {
  const raw = String(props.frameClass || '').trim().toLowerCase()

  if (!raw) return 'frame-default'

  const aliases = {
    'aurora-neon': 'frame-aurora',
    aurora: 'frame-aurora',
    'frame-aurora': 'frame-aurora',
    'frame-solar': 'frame-solar',
    solar: 'frame-solar',
    'frame-obsidian': 'frame-obsidian',
    obsidian: 'frame-obsidian',
    'frame-obsidiana': 'frame-obsidian',
    obsidiana: 'frame-obsidian',
    'frame-gold': 'frame-gold',
    gold: 'frame-gold',
    'frame-neon': 'frame-neon',
    neon: 'frame-neon',
    'frame-fire': 'frame-fire',
    fire: 'frame-fire',
    'frame-ice': 'frame-ice',
    ice: 'frame-ice',
    'frame-emerald': 'frame-emerald',
    emerald: 'frame-emerald',
  }

  return aliases[raw] || raw
})
const shellStyle = computed(() => ({
  '--frame-size': `${props.size + 18}px`,
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
  padding: 9px;
  position: relative;
  display: inline-grid;
  place-items: center;
  background:
    radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.38), transparent 24%),
    linear-gradient(135deg, rgba(100, 110, 255, 0.62), rgba(35, 215, 235, 0.3));
  box-shadow:
    0 14px 30px rgba(4, 8, 24, 0.34),
    0 0 0 2px rgba(255, 255, 255, 0.07);
  overflow: visible;
}

.avatar-frame-shell::before,
.avatar-frame-shell::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.avatar-frame-shell::before {
  inset: 2px;
  border: 3px solid rgba(255, 255, 255, 0.26);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.2),
    0 0 18px rgba(255, 255, 255, 0.08);
}

.avatar-frame-shell::after {
  inset: -4px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  opacity: 0.85;
}

.avatar-frame-shell.is-clickable {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.avatar-frame-shell.is-clickable:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow:
    0 18px 32px rgba(4, 8, 24, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.08);
}

.avatar-core {
  width: var(--avatar-size);
  height: var(--avatar-size);
  background: rgba(255, 255, 255, 0.08);
  color: #eef1ff;
  font-weight: 700;
  font-size: calc(var(--avatar-size) * 0.32);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.12);
}

.avatar-core :deep(img) {
  object-fit: cover;
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

.frame-aurora {
  background:
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.68), transparent 20%),
    conic-gradient(from 180deg, #20d5ec, #6d49ff, #ff4fd8, #20d5ec);
  box-shadow:
    0 0 0 3px rgba(32, 213, 236, 0.24),
    0 0 28px rgba(109, 73, 255, 0.34),
    0 0 52px rgba(32, 213, 236, 0.22);
}

.frame-aurora::before {
  border-color: rgba(255, 255, 255, 0.44);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.28),
    0 0 18px rgba(32, 213, 236, 0.2);
}

.frame-aurora::after {
  inset: -6px;
  border-color: rgba(32, 213, 236, 0.36);
  box-shadow: 0 0 18px rgba(32, 213, 236, 0.24);
}

.frame-solar {
  background:
    radial-gradient(circle at 25% 18%, rgba(255, 255, 255, 0.66), transparent 22%),
    conic-gradient(from 180deg, #fff3b0, #f7c948, #ef8f00, #b45309, #fff3b0);
  box-shadow:
    0 0 0 3px rgba(247, 201, 72, 0.26),
    0 0 24px rgba(247, 201, 72, 0.32),
    0 0 44px rgba(239, 143, 0, 0.24);
}

.frame-solar::before {
  border-color: rgba(255, 244, 193, 0.54);
}

.frame-solar::after {
  inset: -6px;
  border-color: rgba(247, 201, 72, 0.42);
}

.frame-obsidian {
  background:
    radial-gradient(circle at 24% 18%, rgba(196, 247, 255, 0.42), transparent 20%),
    linear-gradient(135deg, #020617, #162033 48%, #23d5ec 100%);
  box-shadow:
    0 0 0 3px rgba(35, 213, 236, 0.18),
    0 0 24px rgba(35, 213, 236, 0.18),
    0 0 42px rgba(8, 18, 38, 0.48);
}

.frame-obsidian::before {
  border-color: rgba(118, 240, 255, 0.42);
}

.frame-obsidian::after {
  inset: -6px;
  border-color: rgba(35, 213, 236, 0.32);
}

.frame-gold {
  background:
    radial-gradient(circle at top left, rgba(255, 253, 213, 0.48), transparent 44%),
    linear-gradient(135deg, #fbe17a, #f4a53d 55%, #9b5a18);
  box-shadow:
    0 0 0 3px rgba(251, 225, 122, 0.22),
    0 0 24px rgba(244, 165, 61, 0.28);
}

.frame-neon {
  background:
    radial-gradient(circle at top left, rgba(190, 255, 255, 0.55), transparent 40%),
    linear-gradient(135deg, #2ce7e6, #6366f1 55%, #992eff);
  box-shadow:
    0 0 0 3px rgba(44, 231, 230, 0.22),
    0 0 28px rgba(153, 46, 255, 0.24);
}

.frame-fire {
  background:
    radial-gradient(circle at top left, rgba(255, 234, 195, 0.48), transparent 40%),
    linear-gradient(135deg, #ffb347, #ff5f6d 50%, #8f1d1d);
  box-shadow:
    0 0 0 3px rgba(255, 179, 71, 0.18),
    0 0 24px rgba(255, 95, 109, 0.24);
}

.frame-ice {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.5), transparent 44%),
    linear-gradient(135deg, #bbf7ff, #3b82f6 55%, #132b74);
  box-shadow:
    0 0 0 3px rgba(187, 247, 255, 0.2),
    0 0 24px rgba(59, 130, 246, 0.22);
}

.frame-emerald {
  background:
    radial-gradient(circle at top left, rgba(236, 255, 247, 0.46), transparent 42%),
    linear-gradient(135deg, #65f5b4, #14b8a6 55%, #0d4d52);
  box-shadow:
    0 0 0 3px rgba(101, 245, 180, 0.18),
    0 0 24px rgba(20, 184, 166, 0.2);
}
</style>
