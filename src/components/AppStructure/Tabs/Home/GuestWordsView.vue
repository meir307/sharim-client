<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSharingStore } from '@/stores/SharingStore'

const route = useRoute()
const router = useRouter()
const sharingStore = useSharingStore()
const isTopWindow = typeof window === 'undefined' ? true : window.self === window.top

/** Prefer store (after home submit); fall back to `/guest/:emitCode` deep link. */
const displayCode = computed(() => {
  const fromStore = String(sharingStore.guestEmitCode ?? '').trim()
  if (fromStore) return fromStore
  return String(route.params.emitCode ?? '').trim()
})

const REFRESH_MS = 4000
let lyricsPollTimer = null

function absolutizeLink(link) {
  const t = String(link ?? '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const b = base === '/' ? '' : base.replace(/\/$/, '')
    return `${origin}${b}${t}`
  }
  return t
}

const guestLyricsHref = computed(() => absolutizeLink(sharingStore.guestLyricsLink))

/** Guest lyrics iframe only: map Google Docs URLs to embed-friendly paths (not used elsewhere in AppStructure). */
const GOOGLE_DOCS_EMBED = [
  [/\/document\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/document/d/${id}/preview`],
  [/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/spreadsheets/d/${id}/htmlview`],
  [/\/presentation\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/presentation/d/${id}/embed`],
]

function guestIframeSrcFromUrl(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'docs.google.com') return s
    for (const [re, toUrl] of GOOGLE_DOCS_EMBED) {
      const m = u.pathname.match(re)
      if (m) return toUrl(m[1])
    }
    return s
  } catch {
    return s
  }
}

const guestLyricsIframeSrc = computed(() => guestIframeSrcFromUrl(guestLyricsHref.value))

/** Real lyrics URL from server — hide placeholder until a valid link arrives. */
const showLyricsFrame = computed(() => {
  const s = String(sharingStore.guestLyricsLink ?? '').trim()
  return Boolean(s) && s !== 'xxxxx'
})

/** Avoid recursive iframe (our guest page embedding itself repeatedly). */
const canEmbedLyricsFrame = computed(() => {
  const src = String(guestLyricsIframeSrc.value ?? '').trim()
  if (!src) return false
  try {
    const u = new URL(src, window.location.origin)
    const sameOrigin = u.origin === window.location.origin
    if (!sameOrigin) return true
    return !u.pathname.includes('/guest/')
  } catch {
    return true
  }
})
const renderLyricsIframe = computed(
  () => isTopWindow && showLyricsFrame.value && canEmbedLyricsFrame.value,
)

onMounted(() => {
  lyricsPollTimer = setInterval(() => {
    void (async () => {
      const ok = await sharingStore.refreshLyrics()
      if (!ok) {
        router.replace({ name: 'home' })
      }
    })()
  }, REFRESH_MS)
})

onUnmounted(() => {
  if (lyricsPollTimer != null) {
    clearInterval(lyricsPollTimer)
    lyricsPollTimer = null
  }
})
</script>

<template>
  <div class="guest-words" :class="{ 'guest-words--lyrics': showLyricsFrame }">
    <iframe
      v-if="renderLyricsIframe"
      class="guest-words__iframe-full guest-words__iframe-full--dark"
      :src="guestLyricsIframeSrc"
      title="מילות השיר"
      referrerpolicy="no-referrer-when-downgrade"
    />

    <div v-if="!renderLyricsIframe" class="guest-words__inner">
      <v-icon class="guest-words__icon mb-4" color="success" size="72">mdi-check-decagram</v-icon>

      <h1 class="text-h4 font-weight-medium mb-3">הצטרפתם לשיתוף בהצלחה</h1>

      <p class="text-body-1 text-medium-emphasis mb-6">
        השיתוף פעיל. מילות השיר יוצגו כאן כשהמארגן ישדר את השיר.
      </p>

      <div
        v-if="sharingStore.guestLyricsLink === 'xxxxx'"
        class="guest-words__link-panel mb-6 pa-4 text-start w-100 rounded-lg"
      >
        <div class="text-caption text-medium-emphasis mb-2">קישור מילות השיר</div>
        <a
          class="guest-words__link-anchor text-body-2"
          :href="guestLyricsHref"
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
        >{{ sharingStore.guestLyricsLink }}</a>
      </div>

      <v-alert
        type="info"
        variant="tonal"
        border="start"
        prominent
        density="comfortable"
        class="mt-8 text-start"
        prepend-icon="mdi-information-outline"
      >
        <div class="text-subtitle-2 font-weight-medium mb-1">טיפ</div>
        <p class="text-body-2 mb-0 text-medium-emphasis">
          שמרו את הדף פתוח במהלך האירוע כדי לא לפספס את המילים כשהשידור יתחיל.
        </p>
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.guest-words {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  box-sizing: border-box;
  padding: 24px 16px;
  text-align: center;
}

.guest-words--lyrics {
  padding: 0;
  min-height: 100dvh;
  height: 100dvh;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  align-items: center;
}

.guest-words__iframe-full {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  display: block;
}

.guest-words__iframe-full--dark {
  /* Best-effort dark mode for cross-origin iframe content. */
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95);
  background: #111;
}

.guest-words__inner {
  width: 100%;
  max-width: 440px;
}

.guest-words__icon {
  opacity: 0.92;
}

.guest-words__code-card {
  border-radius: 12px;
}

.guest-words__code {
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  letter-spacing: 0.04em;
}

.guest-words__link-panel {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  word-break: break-all;
}

.guest-words__link-anchor {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}
</style>
