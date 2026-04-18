<template>
  <div class="video-shell">
    <video
      ref="videoElement"
      class="video-js vjs-big-play-centered vjs-default-skin"
      playsinline
      controls
      preload="auto"
      @contextmenu.prevent
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'video.js/dist/video-js.css'

const props = defineProps({
  source: {
    type: String,
    default: '',
  },
  poster: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['ended'])

const videoElement = ref(null)
let player = null
let videojsLib = null

function buildSource(src) {
  const normalized = String(src || '')

  if (normalized.endsWith('.m3u8')) {
    return { src: normalized, type: 'application/x-mpegURL' }
  }

  return { src: normalized, type: 'video/mp4' }
}

async function initPlayer() {
  if (!videoElement.value || player) return
  if (!videojsLib) {
    const module = await import('video.js')
    videojsLib = module.default
  }

  player = videojsLib(videoElement.value, {
    controls: true,
    fluid: true,
    responsive: true,
    preload: 'auto',
    poster: props.poster || undefined,
    playbackRates: [0.75, 1, 1.25, 1.5, 2],
    controlBar: {
      pictureInPictureToggle: false,
    },
    html5: {
      vhs: {
        enableLowInitialPlaylist: true,
        smoothQualityChange: true,
      },
    },
  })

  player.src(buildSource(props.source))
  player.on('ended', () => emit('ended'))
}

function updateSource() {
  if (!player) return
  player.poster(props.poster || '')
  player.src(buildSource(props.source))
}

onMounted(() => {
  initPlayer()
})

watch(() => props.source, updateSource)
watch(() => props.poster, updateSource)

onBeforeUnmount(() => {
  if (player) {
    player.dispose()
    player = null
  }
})
</script>

<style scoped>
.video-shell {
  border-radius: 20px;
  overflow: hidden;
  background: #050715;
  min-height: 320px;
}

.video-shell :deep(.video-js) {
  width: 100%;
  min-height: 320px;
  background: #050715;
}
</style>
