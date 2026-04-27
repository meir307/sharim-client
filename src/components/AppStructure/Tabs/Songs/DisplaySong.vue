<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { useSharingStore } from '@/stores/SharingStore'
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
const sharingStore = useSharingStore()
const playlistSongIndex = ref(0)
const DISPLAY_SONG_INDEX_KEY = 'displaySongPlaylistIndexSession'

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

function currentPlaylistSessionKey() {
  if (!hasPlaylist.value || !props.playlist) return ''
  const id = props.playlist.id ?? props.playlist.Id
  if (id != null && String(id).trim() !== '') return `id:${String(id).trim()}`
  return `name:${displayPlaylistName.value}`
}

function loadSavedPlaylistSongIndex() {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(DISPLAY_SONG_INDEX_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return 0
    if (String(parsed.playlistKey ?? '') !== currentPlaylistSessionKey()) return 0
    const idx = Number(parsed.index)
    return Number.isInteger(idx) && idx >= 0 ? idx : 0
  } catch {
    return 0
  }
}

function savePlaylistSongIndex() {
  if (typeof window === 'undefined') return
  if (!hasPlaylist.value || !open.value || resolvedPlaylistSongs.value.length === 0) return
  localStorage.setItem(
    DISPLAY_SONG_INDEX_KEY,
    JSON.stringify({
      playlistKey: currentPlaylistSessionKey(),
      index: playlistSongIndex.value,
    }),
  )
}

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
    const max = Math.max(0, resolvedPlaylistSongs.value.length - 1)
    playlistSongIndex.value = Math.min(loadSavedPlaylistSongIndex(), max)
  }
})

watch(
  [open, playlistSongIndex, () => props.playlist],
  () => {
    savePlaylistSongIndex()
  },
  { deep: false },
)

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
    if (direct != null && String(direct).trim() !== '') return String(direct)
    const inner = raw.cords ?? raw.Cords
    if (inner != null && inner !== raw) return cordsTextFromSong(inner)
    // No displayable chord text (avoid showing "{}" / metadata-only objects)
    return ''
  }
  return ''
}

const cordsDisplayText = computed(() => cordsTextFromSong(displayCords.value))
const showCordsPanel = computed(() => cordsDisplayText.value.trim().length > 0)

/** `rm=minimal` trims embed chrome; RTL inside the doc still comes from Google’s viewer (varies by browser). */
function googleDocumentPreviewUrl(docId) {
  const u = new URL(`https://docs.google.com/document/d/${encodeURIComponent(docId)}/preview`)
  u.searchParams.set('rm', 'minimal')
  return u.toString()
}

const GOOGLE_EMBED = [
  [/\/document\/d\/([a-zA-Z0-9_-]+)/, (id) => googleDocumentPreviewUrl(id)],
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

function notifyUpdateActiveLink() {
  const url = String(displayLinkUrl.value ?? '').trim()
  if (!open.value || !url) return
  void sharingStore.updateActiveLink(url)
}

watch(
  () => [open.value, displayLinkUrl.value, playlistSongIndex.value],
  () => {
    notifyUpdateActiveLink()
  },
  { immediate: true },
)

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
        <div v-if="showPlaylistHeader" class="display-song__head-inner display-song__head-inner--playlist">
          <div class="display-song__head-playlist-row">
            <v-btn
              icon="mdi-skip-next"
              variant="text"
              density="comfortable"
              class="display-song__head-nav-btn flex-shrink-0"
              :disabled="playlistSongIndex <= 0"
              aria-label="שיר קודם"
              @click="playlistPrev"
            />
            <div class="display-song__head-playlist-title-wrap min-w-0">
              <div class="display-song__head-playlist__title display-song__head-playlist__title-line">
                
                <span class="text-truncate min-w-0 display-song__head-playlist-names">
                  <span class="font-weight-medium">{{ displaySongTitle }}</span>
                  <span class="text-body-2 text-medium-emphasis mx-1"> מתוך פלייליסט </span>
                  <span class="font-weight-medium">{{ displayPlaylistName }}</span>
                </span>
                <span class="text-caption text-medium-emphasis tabular-nums display-song__head-playlist-count flex-shrink-0">
                  ({{ playlistSongIndex + 1 }}/{{ resolvedPlaylistSongs.length }})
                </span>
              </div>
            </div>
            <v-btn
              icon="mdi-skip-previous"
              variant="text"
              density="comfortable"
              class="display-song__head-nav-btn flex-shrink-0"
              :disabled="playlistSongIndex >= resolvedPlaylistSongs.length - 1"
              aria-label="שיר הבא"
              @click="playlistNext"
            />
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            class="display-song__head-close"
            aria-label="סגור"
            @click="close"
          />
        </div>
        <div
          v-else-if="hasPlaylist"
          class="display-song__head-row display-song__head-inner w-100 min-w-0"
        >
          <span class="display-song__head-title-center text-truncate min-w-0 font-weight-medium">{{
            displayPlaylistName
          }}</span>
          <v-btn icon="mdi-close" variant="text" class="display-song__head-close" aria-label="סגור" @click="close" />
        </div>
        <div v-else class="display-song__head-row display-song__head-inner w-100 min-w-0">
          <span class="display-song__head-title-center text-truncate min-w-0">{{ displaySongTitle }}</span>
          <v-btn icon="mdi-close" variant="text" class="display-song__head-close" aria-label="סגור" @click="close" />
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
          <div v-if="showCordsPanel" class="display-song__cords-wrap" dir="rtl">
            <pre class="display-song__cords-pre text-body-2" dir="rtl">{{ cordsDisplayText }}</pre>
          </div>
          <div class="display-song__shell" :class="{ 'display-song__shell--full': !showCordsPanel }">
            <div ref="iframeScrollerRef" class="display-song__iframe-scroller">
              <iframe
                v-if="open && displayLinkUrl"
                :key="`${embedSrc}#${playlistSongIndex}`"
                class="display-song__iframe display-song__iframe--dark"
                :src="embedSrc"
                :title="displaySongTitle"
                dir="rtl"
                lang="he"
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
  position: relative;
  flex-shrink: 0;
  margin-bottom: 0;
  padding-inline: 12px 4px;
}

.display-song__head-row {
  box-sizing: border-box;
}

.display-song__head-inner {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding-inline: 44px;
}

.display-song__head-inner--playlist {
  text-align: center;
}

.display-song__head-playlist-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.display-song__head-playlist-title-wrap {
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 140px);
  display: flex;
  justify-content: center;
  text-align: center;
}

.display-song__head-playlist__title-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.display-song__head-playlist-names {
  flex: 1 1 auto;
  min-width: 0;
}

.display-song__head-title-center {
  display: block;
  width: 100%;
  text-align: center;
}

.display-song__head-close {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 0;
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
  flex: 1 1 50%;
  max-width: 50%;
  min-width: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 16px;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: #111;
  direction: rtl;
  text-align: right;
}

.display-song__cords-pre {
  margin: 0;
  padding: 12px 16px;
  min-height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: #e6e6e6;
  background-color: #1b1b1b;
  font-size: 21px;
  direction: rtl;
  text-align: right;
  unicode-bidi: plaintext;
}

.display-song__shell {
  flex: 1 1 50%;
  max-width: 50%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.display-song__shell--full {
  flex: 1 1 auto;
  max-width: 100%;
}

.display-song__iframe-scroller {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  direction: rtl;
}

.display-song__iframe {
  display: block;
  width: 100%;
  height: min(320vh, 9600px);
  min-height: min(180vh, 4800px);
  border: 0;
}

.display-song__iframe--dark {
  /* Best-effort dark mode for iframe-rendered pages. */
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95);
  background: #111;
}

@media (max-width: 600px) {
  .display-song__body {
    flex-direction: column;
  }

  /* DOM order is cords then iframe; stack with text/iframe on top */
  .display-song__shell {
    order: 1;
    flex: 1 1 auto;
    max-width: 100%;
    width: 100%;
  }

  .display-song__cords-wrap {
    order: 2;
    flex: 0 0 auto;
    max-width: 100%;
    max-height: min(32vh, 280px);
    border-inline-end: none;
    border-bottom: none;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .display-song__iframe {
    min-height: 360px;
  }
}
</style>
