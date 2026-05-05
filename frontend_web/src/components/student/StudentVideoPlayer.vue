<template>
  <div class="video-shell">
    <iframe
      v-if="iframeSource"
      ref="iframeElement"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  trackingMode: {
    type: String,
    default: 'native',
  },
})

const emit = defineEmits(['ended'])

const videoElement = ref(null)
const iframeElement = ref(null)
let player = null
let videojsLib = null
let youtubePlayer = null
let vimeoPlayer = null
let youtubeApiPromise = null
let vimeoApiPromise = null

function appendQueryParams(url, params = {}) {
  const normalized = String(url || '').trim()
  if (!normalized) return normalized

  try {
    const target = new URL(normalized)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        target.searchParams.set(key, String(value))
      }
    })
    return target.toString()
  } catch {
    return normalized
  }
}

function normalizeEmbedUrl(url) {
  const normalized = String(url || '').trim()

  if (!normalized) return ''
  if (normalized.includes('/embed/') || normalized.includes('player.vimeo.com/video/')) return normalized

  if (normalized.includes('youtube.com/watch')) {
    const videoId = normalized.split('v=')[1]?.split('&')[0]
    return videoId
      ? appendQueryParams(`https://www.youtube.com/embed/${videoId}`, {
          enablejsapi: 1,
          rel: 0,
          playsinline: 1,
        })
      : normalized
  }

  if (normalized.includes('youtu.be/')) {
    const videoId = normalized.split('/').pop()
    return videoId
      ? appendQueryParams(`https://www.youtube.com/embed/${videoId}`, {
          enablejsapi: 1,
          rel: 0,
          playsinline: 1,
        })
      : normalized
  }

  if (normalized.includes('vimeo.com/')) {
    const videoId = normalized.split('/').filter(Boolean).pop()
    return videoId
      ? appendQueryParams(`https://player.vimeo.com/video/${videoId}`, {
          autoplay: 0,
          muted: 0,
        })
      : normalized
  }

  if (normalized.includes('youtube.com/embed/')) {
    return appendQueryParams(normalized, {
      enablejsapi: 1,
      rel: 0,
      playsinline: 1,
    })
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

const effectiveTrackingMode = computed(() => {
  const explicit = String(props.trackingMode || '').toLowerCase()
  if (explicit && explicit !== 'native') return explicit

  const provider = String(props.provider || '').toLowerCase()
  if (provider && provider !== 'native' && provider !== 'external') return provider

  if (iframeSource.value.includes('youtube.com/embed/')) return 'youtube'
  if (iframeSource.value.includes('player.vimeo.com/video/')) return 'vimeo'
  return iframeSource.value ? 'manual' : 'native'
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

function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }

      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function loadYouTubeApi() {
  if (typeof window !== 'undefined' && window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }

      loadExternalScript('https://www.youtube.com/iframe_api').catch(reject)
    })
  }

  return youtubeApiPromise
}

function loadVimeoApi() {
  if (typeof window !== 'undefined' && window.Vimeo?.Player) {
    return Promise.resolve(window.Vimeo)
  }

  if (!vimeoApiPromise) {
    vimeoApiPromise = loadExternalScript('https://player.vimeo.com/api/player.js')
      .then(() => window.Vimeo)
  }

  return vimeoApiPromise
}

function destroyExternalTrackers() {
  try {
    youtubePlayer?.destroy?.()
  } catch {
    // noop
  }

  try {
    vimeoPlayer?.off?.('ended')
    vimeoPlayer?.destroy?.()
  } catch {
    // noop
  }

  youtubePlayer = null
  vimeoPlayer = null
}

async function initExternalTracking() {
  destroyExternalTrackers()

  if (!iframeSource.value || !iframeElement.value) return

  if (effectiveTrackingMode.value === 'youtube') {
    const yt = await loadYouTubeApi()
    youtubePlayer = new yt.Player(iframeElement.value, {
      events: {
        onStateChange(event) {
          if (event?.data === yt.PlayerState.ENDED) {
            emit('ended')
          }
        },
      },
    })
    return
  }

  if (effectiveTrackingMode.value === 'vimeo') {
    const vimeo = await loadVimeoApi()
    vimeoPlayer = new vimeo.Player(iframeElement.value)
    vimeoPlayer.on('ended', () => emit('ended'))
  }
}

function updateSource() {
  if (iframeSource.value) {
    if (player) {
      player.dispose()
      player = null
    }
    nextTick(() => {
      initExternalTracking()
    })
    return
  }

  destroyExternalTrackers()

  if (!player) {
    nextTick(() => {
      initPlayer()
    })
    return
  }
  player.poster(props.poster || '')
  player.src(buildSource(props.source))
}

onMounted(() => {
  initPlayer()
  if (iframeSource.value) {
    nextTick(() => {
      initExternalTracking()
    })
  }
})

watch(() => props.source, updateSource)
watch(() => props.embedUrl, updateSource)
watch(() => props.provider, updateSource)
watch(() => props.poster, updateSource)
watch(() => props.trackingMode, updateSource)

onBeforeUnmount(() => {
  if (player) {
    player.dispose()
    player = null
  }

  destroyExternalTrackers()
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
