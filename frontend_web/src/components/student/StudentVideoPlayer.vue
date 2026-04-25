<template>
  <div class="video-shell">
    <iframe
      v-if="iframeSource"
      class="video-embed"
      :src="iframeSource"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    />
    <video
      v-else
      ref="videoElement"
      data-cy="student-video-element"
      class="video-js vjs-big-play-centered vjs-default-skin"
      playsinline
      controls
      preload="auto"
      @contextmenu.prevent
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'video.js/dist/video-js.css'

const props = defineProps({
  source: {
    type: String,
    default: '',
  },
  embedUrl: {
    type: String,
    default: '',
  },
  provider: {
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

function normalizeEmbedUrl(url) {
  const normalized = String(url || '').trim()

  if (!normalized) return ''
  if (normalized.includes('/embed/') || normalized.includes('player.vimeo.com/video/')) return normalized

  if (normalized.includes('youtube.com/watch')) {
    const videoId = normalized.split('v=')[1]?.split('&')[0]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : normalized
  }

  if (normalized.includes('youtu.be/')) {
    const videoId = normalized.split('/').pop()
    return videoId ? `https://www.youtube.com/embed/${videoId}` : normalized
  }

  if (normalized.includes('vimeo.com/')) {
    const videoId = normalized.split('/').filter(Boolean).pop()
    return videoId ? `https://player.vimeo.com/video/${videoId}` : normalized
  }

  return normalized
}

const iframeSource = computed(() => {
  const explicitEmbed = normalizeEmbedUrl(props.embedUrl)
  if (explicitEmbed) return explicitEmbed

  const normalizedSource = String(props.source || '').trim()
  const provider = String(props.provider || '').toLowerCase()

  if (provider === 'youtube' || provider === 'vimeo') {
    return normalizeEmbedUrl(normalizedSource)
  }

  if (/youtube\.com|youtu\.be|vimeo\.com/.test(normalizedSource)) {
    return normalizeEmbedUrl(normalizedSource)
  }

  return ''
})

function buildSource(src) {
  const normalized = String(src || '')

  if (normalized.endsWith('.m3u8')) {
    return { src: normalized, type: 'application/x-mpegURL' }
  }

  return { src: normalized, type: 'video/mp4' }
}

async function initPlayer() {
  if (!videoElement.value || player || iframeSource.value) return
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
  if (iframeSource.value) {
    if (player) {
      player.dispose()
      player = null
    }
    return
  }

  if (!player) return
  player.poster(props.poster || '')
  player.src(buildSource(props.source))
}

onMounted(() => {
  initPlayer()
})

watch(() => props.source, updateSource)
watch(() => props.embedUrl, updateSource)
watch(() => props.provider, updateSource)
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

.video-embed {
  width: 100%;
  min-height: 420px;
  border: 0;
  background: #050715;
}
</style>
