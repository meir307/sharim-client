<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { songListUrl } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  linkUrl: { type: String, default: '' },
  songTitle: { type: String, default: '' },
  cords: { type: [Object, String], default: null },
  /** When set, dialog shows this playlist’s songs (first on open); use prev/next in the header. */
  playlist: { type: Object, default: null },
})

const emit = defineEmits(['closed'])

const userStore = useUserStore()
const playlistSongIndex = ref(0)

function firstDefinedString(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    if (!(k in obj)) continue
    const v = obj[k]
    if (v != null && String(v).trim() !== '') {
      return String(v).trim()
    }
  }
  return ''
}

const hasPlaylist = computed(
  () => props.playlist != null && typeof props.playlist === 'object',
)

function rawSongsList() {
  return Array.isArray(userStore.songs) ? userStore.songs : []
}

function resolveSongEntry(entry) {
  if (entry == null) return null
  if (typeof entry === 'object' && entry !== null && (entry.id != null || entry.Id != null)) {
    const idStr = String(entry.id ?? entry.Id).trim()
    const fromStore = rawSongsList().find((s) => String(s.id ?? s.Id ?? '').trim() === idStr)
    return fromStore ?? entry
  }
  if (typeof entry === 'number' || (typeof entry === 'string' && /^\d+$/.test(String(entry).trim()))) {
    const idStr = String(entry).trim()
    return rawSongsList().find((s) => String(s.id ?? s.Id ?? '').trim() === idStr) ?? null
  }
  return typeof entry === 'object' ? entry : null
}

const resolvedPlaylistSongs = computed(() => {
  if (!hasPlaylist.value) return []
  const pl = props.playlist
  const raw = pl.songs ?? pl.Songs ?? pl.songList ?? pl.items ?? []
  if (!Array.isArray(raw)) return []
  return raw.map(resolveSongEntry).filter(Boolean)
})

/** Playlist mode with at least one song — custom title bar + position + nav. */
const showPlaylistHeader = computed(
  () => hasPlaylist.value && resolvedPlaylistSongs.value.length > 0,
)

const displayPlaylistName = computed(() => {
  if (!hasPlaylist.value || !props.playlist) return ''
  return (
    firstDefinedString(props.playlist, [
      'name',
      'Name',
      'playlistName',
      'PlaylistName',
      'title',
      'Title',
    ]) || '(ללא שם)'
  )
})

const activePlaylistSong = computed(() => {
  const list = resolvedPlaylistSongs.value
  const i = playlistSongIndex.value
  if (!list.length || i < 0 || i >= list.length) return null
  return list[i]
})

const displayLinkUrl = computed(() => {
  if (activePlaylistSong.value) {
    return songListUrl(activePlaylistSong.value)
  }
  return String(props.linkUrl ?? '').trim()
})

const displaySongTitle = computed(() => {
  if (activePlaylistSong.value) {
    return (
      firstDefinedString(activePlaylistSong.value, [
        'name',
        'Name',
        'title',
        'Title',
        'songName',
        'SongName',
      ]) || ''
    )
  }
  return String(props.songTitle ?? '').trim()
})

const displayCords = computed(() => {
  if (activePlaylistSong.value) {
    return activePlaylistSong.value.cords ?? activePlaylistSong.value.Cords ?? null
  }
  return props.cords
})

watch([open, () => props.playlist], ([isOpen]) => {
  if (isOpen && hasPlaylist.value) {
    playlistSongIndex.value = 0
  }
})

function playlistPrev() {
  if (playlistSongIndex.value > 0) {
    playlistSongIndex.value -= 1
  }
}

function playlistNext() {
  const n = resolvedPlaylistSongs.value.length
  if (playlistSongIndex.value < n - 1) {
    playlistSongIndex.value += 1
  }
}

function cordsTextFromSong(raw) {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string') {
    const t = raw.trim()
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        return cordsTextFromSong(JSON.parse(t))
      } catch {
        return raw
      }
    }
    return raw
  }
  if (typeof raw === 'object' && raw !== null) {
    const direct =
      raw.cordsText ?? raw.CordsText ?? raw.cords_text ?? raw.Cords_Text
    if (direct != null) return String(direct)
    const inner = raw.cords ?? raw.Cords
    if (inner != null && inner !== raw) return cordsTextFromSong(inner)
    return JSON.stringify(raw)
  }
  return ''
}

const cordsDisplayText = computed(() => cordsTextFromSong(displayCords.value))
const showCordsPanel = computed(() => cordsDisplayText.value.trim() !== '')

const GOOGLE_EMBED = [
  [/\/document\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/document/d/${id}/preview`],
  [/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/spreadsheets/d/${id}/htmlview`],
  [/\/presentation\/d\/([a-zA-Z0-9_-]+)/, (id) => `https://docs.google.com/presentation/d/${id}/embed`],
]

function embedUrlForLinkPreview(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./i, '').toLowerCase()
    if (host !== 'docs.google.com') return s
    for (const [re, toUrl] of GOOGLE_EMBED) {
      const m = u.pathname.match(re)
      if (m) return toUrl(m[1])
    }
    return s
  } catch {
    return s
  }
}

const embedSrc = computed(() => embedUrlForLinkPreview(displayLinkUrl.value))

const SCROLL_LINE_PX = 1
const SCROLL_INTERVAL_MS = 130

const iframeScrollerRef = ref(null)
let scrollTimer = null

function stopAutoScroll() {
  if (scrollTimer != null) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
}

function scrollWrapperOneLine() {
  const wrap = iframeScrollerRef.value
  if (!wrap) return
  const max = Math.max(0, wrap.scrollHeight - wrap.clientHeight)
  if (max <= 0) return
  const cur = wrap.scrollTop
  if (cur >= max - SCROLL_LINE_PX) {
    wrap.scrollTop = max
    stopAutoScroll()
    return
  }
  wrap.scrollTop = Math.min(max, cur + SCROLL_LINE_PX)
}

function startAutoScroll() {
  stopAutoScroll()
  scrollTimer = setInterval(scrollWrapperOneLine, SCROLL_INTERVAL_MS)
}

watch([open, embedSrc, playlistSongIndex], async ([isOpen, src]) => {
  stopAutoScroll()
  if (!isOpen || !String(src ?? '').trim()) return
  await nextTick()
  const sc = iframeScrollerRef.value
  if (sc) sc.scrollTop = 0
  startAutoScroll()
})

onBeforeUnmount(stopAutoScroll)

function close() {
  open.value = false
}
</script>

<template>
  <v-dialog
    v-model="open"
    class="display-song-dialog"
    width="100%"
    max-width="100%"
    scrollable
    persistent
    retain-focus
    scroll-strategy="block"
    role="dialog"
    aria-modal="true"
    @after-leave="emit('closed')"
  >
    <v-card class="display-song__card" rounded="lg">
      <v-card-title class="popup-title display-song__head">
        <div v-if="showPlaylistHeader" class="display-song__head-playlist">
          <div class="display-song__head-playlist__title text-truncate min-w-0">
            <span class="font-weight-medium">{{ displaySongTitle }}</span>
            <span class="text-body-2 text-medium-emphasis mx-1">  מתוך פלייליסט </span>
            <span class="font-weight-medium">{{ displayPlaylistName }}</span>
          </div>
          <div class="display-song__head-nav-center">
            <span class="text-caption text-medium-emphasis tabular-nums">
              {{ playlistSongIndex + 1 }}/{{ resolvedPlaylistSongs.length }}
            </span>
            <v-btn
              icon="mdi-skip-previous"
              variant="text"
              density="comfortable"
              :disabled="playlistSongIndex <= 0"
              aria-label="שיר קודם"
              @click="playlistPrev"
            />
            <v-btn
              icon="mdi-skip-next"
              variant="text"
              density="comfortable"
              :disabled="playlistSongIndex >= resolvedPlaylistSongs.length - 1"
              aria-label="שיר הבא"
              @click="playlistNext"
            />
          </div>
          <div class="display-song__head-playlist__actions-end">
            <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
          </div>
        </div>
        <div
          v-else-if="hasPlaylist"
          class="display-song__head-row d-flex align-center gap-2 w-100 min-w-0"
        >
          <span class="text-truncate flex-grow-1 min-w-0 font-weight-medium">{{ displayPlaylistName }}</span>
          <v-btn icon="mdi-close" variant="text" class="flex-shrink-0" aria-label="סגור" @click="close" />
        </div>
        <div v-else class="display-song__head-row d-flex align-center gap-2 w-100 min-w-0">
          <span class="text-truncate flex-grow-1 min-w-0">{{ displaySongTitle }}</span>
          <v-btn icon="mdi-close" variant="text" class="flex-shrink-0" aria-label="סגור" @click="close" />
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="display-song__card-text pa-0">
        <div
          v-if="hasPlaylist && resolvedPlaylistSongs.length === 0"
          class="display-song__playlist-empty pa-8 text-body-1 text-medium-emphasis text-center"
        >
          אין שירים בפלייליסט זה.
        </div>
        <div v-else class="display-song__body" dir="ltr">
          <div v-if="showCordsPanel" class="display-song__cords-wrap">
            <pre class="display-song__cords-pre text-body-2" dir="rtl">{{ cordsDisplayText }}</pre>
          </div>
          <div class="display-song__shell">
            <div ref="iframeScrollerRef" class="display-song__iframe-scroller">
              <iframe
                v-if="open && displayLinkUrl"
                :key="`${embedSrc}#${playlistSongIndex}`"
                class="display-song__iframe"
                :src="embedSrc"
                :title="displaySongTitle"
                referrerpolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/**
 * Full-viewport modal: scrim covers the whole window (including the app bar).
 * Panel stays full width, anchored below TopStrip (`v-app-bar` ≈ 48px + 1px).
 */
.display-song-dialog :deep(.v-overlay) {
  /* Above `v-app-bar` / `v-navigation-drawer` defaults */
  z-index: 2600 !important;
}

.display-song-dialog :deep(.v-overlay__content) {
  position: fixed !important;
  margin: 0 !important;
  inset-inline: 0 !important;
  inset-block-start: var(--display-song-under-bar, 49px) !important;
  width: 100% !important;
  max-width: 100% !important;
  height: calc(100dvh - var(--display-song-under-bar, 49px)) !important;
  max-height: calc(100dvh - var(--display-song-under-bar, 49px)) !important;
  min-height: 0 !important;
  transform: none !important;
  align-self: stretch !important;
}

.display-song__card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.display-song__head {
  flex-shrink: 0;
  margin-bottom: 0;
  padding-inline: 12px 4px;
}

.display-song__head-row {
  box-sizing: border-box;
}

/* Title | (counter + prev + next) centered | close — equal outer columns keep nav in the middle */
.display-song__head-playlist {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.display-song__head-nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: nowrap;
  justify-self: center;
}

.display-song__head-playlist__actions-end {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.display-song__card-text {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.display-song__body {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  align-items: stretch;
  min-height: 0;
  min-width: 0;
  width: 100%;
  background: rgb(var(--v-theme-surface));
}

.display-song__cords-wrap {
  flex: 0 0 clamp(220px, 36vw, 420px);
  max-width: 45%;
  min-width: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 16px;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  
}

.display-song__cords-pre {
  margin: 0;
  padding: 12px 16px;
  box-sizing: border-box;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgb(236, 220, 149);
  font-size: 21px;
}

.display-song__shell {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.display-song__iframe-scroller {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.display-song__iframe {
  display: block;
  width: 100%;
  height: min(320vh, 9600px);
  min-height: min(180vh, 4800px);
  border: 0;
}

@media (max-width: 720px) {
  .display-song__body {
    flex-direction: column;
  }

  .display-song__cords-wrap {
    flex: 0 0 auto;
    max-width: 100%;
    max-height: min(32vh, 280px);
    border-inline-end: none;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .display-song__iframe {
    min-height: 360px;
  }
}
</style>
