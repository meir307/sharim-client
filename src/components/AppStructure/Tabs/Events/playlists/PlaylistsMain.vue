<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { songRowForTable } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'
import DisplaySong from '@/components/AppStructure/Tabs/Songs/DisplaySong.vue'

const emit = defineEmits(['edit-playlist'])

const userStore = useUserStore()
const songsLoading = ref(false)
const showDisplaySong = ref(false)
const displaySongPlaylist = ref(null)
/** Stable key: playlist `id` or fallback `i:{index}` */
const selectedPlaylistKey = ref(null)

const DISPLAY_SONG_SESSION_KEY = 'displaySongPlaylistSession'

function loadDisplaySongSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DISPLAY_SONG_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.show) return null
    const playlist = parsed.playlist
    if (!playlist || typeof playlist !== 'object') return null
    return playlist
  } catch {
    return null
  }
}

function saveDisplaySongSession() {
  if (typeof window === 'undefined') return
  if (showDisplaySong.value && displaySongPlaylist.value) {
    localStorage.setItem(
      DISPLAY_SONG_SESSION_KEY,
      JSON.stringify({ show: true, playlist: displaySongPlaylist.value }),
    )
    return
  }
  localStorage.removeItem(DISPLAY_SONG_SESSION_KEY)
}

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

function playlistStableKey(playlist, index) {
  const id = playlist?.id ?? playlist?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

function playlistDisplayName(playlist) {
  return (
    firstDefinedString(playlist, ['name', 'Name', 'playlistName', 'PlaylistName', 'title', 'Title']) ||
    '(ללא שם)'
  )
}

const playlists = computed(() => {
  const raw = userStore.user?.playLists
  return Array.isArray(raw) ? raw : []
})

function findPlaylistIndexByKey(key) {
  if (key == null || key === '') return -1
  return playlists.value.findIndex((p, i) => playlistStableKey(p, i) === String(key))
}

const selectedPlaylist = computed(() => {
  const idx = findPlaylistIndexByKey(selectedPlaylistKey.value)
  if (idx < 0) return null
  return playlists.value[idx]
})

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

const categories = computed(() =>
  Array.isArray(userStore.user?.categories) ? userStore.user.categories : [],
)

const artists = computed(() =>
  Array.isArray(userStore.user?.artists) ? userStore.user.artists : [],
)

function displaySongName(row) {
  const n = firstDefinedString(row, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  return n || '(ללא שם)'
}

/** Same resolution as UpsertPlaylist selected list (names, not raw ids). */
function playlistSongTableRow(song) {
  return songRowForTable(song, categories.value, artists.value)
}

function playlistSongListTitle(song) {
  return displaySongName(playlistSongTableRow(song))
}

function playlistSongListSubtitle(song) {
  const row = playlistSongTableRow(song)
  const art = String(row.artistName ?? '').trim()
  const cat = String(row.categoryName ?? '').trim()
  const bits = [art, cat].filter(Boolean)
  return bits.length ? bits.join(' · ') : undefined
}

const selectedPlaylistSongs = computed(() => {
  const pl = selectedPlaylist.value
  if (!pl || typeof pl !== 'object') return []
  const raw = pl.songs ?? pl.Songs ?? pl.songList ?? pl.items ?? []
  if (!Array.isArray(raw)) return []
  return raw.map(resolveSongEntry).filter(Boolean)
})

function selectPlaylist(playlist, index) {
  selectedPlaylistKey.value = playlistStableKey(playlist, index)
}

function onEditPlaylist(playlist) {
  emit('edit-playlist', playlist)
}

async function onActivatePlaylist(playlist) {
  await ensureSongsLoaded()
  displaySongPlaylist.value = playlist && typeof playlist === 'object' ? { ...playlist } : null
  showDisplaySong.value = true
  saveDisplaySongSession()
}

function onDisplaySongClosed() {
  displaySongPlaylist.value = null
  saveDisplaySongSession()
}

async function onDeletePlaylist(playlist, index) {
  const name = playlistDisplayName(playlist)
  if (!window.confirm(`למחוק את הפלייליסט "${name}"?`)) {
    return
  }
  try {
    await userStore.deletePlaylistAt(index)
  } catch {
    // errors surfaced in UserStore
  }
}

watch(
  playlists,
  (list) => {
    if (!list.length) {
      selectedPlaylistKey.value = null
      return
    }
    const cur = selectedPlaylistKey.value
    if (cur == null || findPlaylistIndexByKey(cur) < 0) {
      selectPlaylist(list[0], 0)
    }
  },
  { immediate: true },
)

async function ensureSongsLoaded() {
  if (rawSongsList().length > 0) return
  songsLoading.value = true
  try {
    await userStore.fetchSongs()
  } catch {
    // fetchSongs surfaces errors
  } finally {
    songsLoading.value = false
  }
}

watch(
  [showDisplaySong, displaySongPlaylist],
  () => {
    saveDisplaySongSession()
  },
  { deep: true },
)

onMounted(() => {
  ensureSongsLoaded()
  const restored = loadDisplaySongSession()
  if (restored) {
    displaySongPlaylist.value = restored
    showDisplaySong.value = true
  }
})
</script>

<template>
  <div class="playlists-main">
    <v-row class="playlists-main__row" dense>
      <!-- RTL: first column is on the right — playlist names -->
      <v-col cols="12" md="5" class="playlists-main__col-playlists">
        <div class="playlists-main__panel-head text-subtitle-2 text-medium-emphasis mb-2">פלייליסטים</div>
        <v-card variant="outlined" class="playlists-main__card">
          <v-list v-if="playlists.length" density="compact" class="py-0">
            <v-list-item
              v-for="(pl, index) in playlists"
              :key="playlistStableKey(pl, index)"
              :active="selectedPlaylistKey === playlistStableKey(pl, index)"
              color="primary"
              rounded="shaped"
              @click="selectPlaylist(pl, index)"
            >
              <v-list-item-title class="text-body-1 font-weight-medium">
                {{ playlistDisplayName(pl) }}
              </v-list-item-title>
              <template #append>
                <div class="playlists-main__playlist-actions" @click.stop>
                  <v-btn
                    icon="mdi-play-circle-outline"
                    variant="text"
                    size="small"
                    density="comfortable"
                    color="success"
                    aria-label="הפעל פלייליסט"
                    @click="onActivatePlaylist(pl)"
                  />
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    density="comfortable"
                    color="primary"
                    aria-label="ערוך פלייליסט"
                    @click="onEditPlaylist(pl)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    density="comfortable"
                    color="error"
                    aria-label="מחק פלייליסט"
                    @click="onDeletePlaylist(pl, index)"
                  />
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="playlists-main__empty text-body-2 text-medium-emphasis pa-6 text-center">
            אין פלייליסטים. הוסף פלייליסט מהסרגל למעלה.
          </div>
        </v-card>
      </v-col>

      <!-- Second column — songs of selected playlist (left in RTL) -->
      <v-col cols="12" md="7" class="playlists-main__col-songs">
        <div class="playlists-main__panel-head text-subtitle-2 text-medium-emphasis mb-2">שירים בפלייליסט</div>
        <v-card variant="outlined" class="playlists-main__card playlists-main__card--songs">
          <v-progress-linear v-if="songsLoading" indeterminate height="3" />
          <v-list v-if="selectedPlaylist && selectedPlaylistSongs.length" density="comfortable" class="py-0">
            <v-list-item
              v-for="(song, sIndex) in selectedPlaylistSongs"
              :key="`${selectedPlaylistKey}-${sIndex}`"
              :title="playlistSongListTitle(song)"
              :subtitle="playlistSongListSubtitle(song)"
            >
              <template #prepend>
                <span class="playlists-main__song-index text-medium-emphasis">{{ sIndex + 1 }}.</span>
              </template>
            </v-list-item>
          </v-list>
          <div
            v-else-if="selectedPlaylist && !selectedPlaylistSongs.length"
            class="playlists-main__empty text-body-2 text-medium-emphasis pa-6 text-center"
          >
            לפלייליסט זה אין שירים.
          </div>
          <div v-else class="playlists-main__empty text-body-2 text-medium-emphasis pa-6 text-center">
            בחר פלייליסט מהרשימה מימין.
          </div>
        </v-card>
      </v-col>
    </v-row>

    <DisplaySong
      v-model="showDisplaySong"
      :playlist="displaySongPlaylist"
      link-url=""
      song-title=""
      :cords="null"
      @closed="onDisplaySongClosed"
    />
  </div>
</template>

<style scoped>
.playlists-main {
  width: 100%;
  min-width: 0;
}

.playlists-main__row {
  align-items: stretch;
}

.playlists-main__card {
  min-height: 200px;
  max-height: min(60vh, 520px);
  overflow-y: auto;
}

.playlists-main__card--songs {
  min-height: 240px;
}

.playlists-main__song-index {
  min-width: 1.75rem;
  font-variant-numeric: tabular-nums;
}

.playlists-main__empty {
  line-height: 1.45;
}

.playlists-main__playlist-actions {
  display: flex;
  align-items: center;
}
</style>
