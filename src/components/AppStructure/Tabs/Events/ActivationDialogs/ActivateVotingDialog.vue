<script setup>
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { songRowForTable } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'
import { buildVotingSharingParams, playlistDisplayName } from '@/utils/eventSharingModel.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const selectedPlaylistKey = ref(null)
const maxSelections = ref(3)
const voteTitle = ref('בחרו את השירים האהובים עליכם')

const playlists = computed(() => {
  const raw = userStore.user?.playLists
  return Array.isArray(raw) ? raw : []
})

function playlistStableKey(playlist, index) {
  const id = playlist?.id ?? playlist?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

const playlistOptions = computed(() =>
  playlists.value.map((pl, index) => ({
    title: playlistDisplayName(pl) || '(ללא שם)',
    value: playlistStableKey(pl, index),
  })),
)

const selectedPlaylist = computed(() => {
  if (selectedPlaylistKey.value == null) return null
  const idx = playlists.value.findIndex(
    (p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value),
  )
  return idx >= 0 ? playlists.value[idx] : null
})

const categories = computed(() =>
  Array.isArray(userStore.user?.categories) ? userStore.user.categories : [],
)

const artists = computed(() =>
  Array.isArray(userStore.user?.artists) ? userStore.user.artists : [],
)

function firstDefinedString(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    if (!(k in obj)) continue
    const v = obj[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function displaySongName(row) {
  const n = firstDefinedString(row, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  return n || '(ללא שם)'
}

function rawSongsList() {
  return Array.isArray(userStore.songs) ? userStore.songs : []
}

function resolveSongEntry(entry) {
  if (entry == null) return null
  if (typeof entry === 'object' && (entry.id != null || entry.Id != null)) {
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

const previewSongs = computed(() => {
  const pl = selectedPlaylist.value
  if (!pl || typeof pl !== 'object') return []
  const raw = pl.songs ?? pl.Songs ?? pl.songList ?? pl.items ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .map(resolveSongEntry)
    .filter(Boolean)
    .map((song, i) => {
      const row = songRowForTable(song, categories.value, artists.value)
      const id = song.id ?? song.Id ?? i
      return {
        id,
        name: displaySongName(row),
        artistName: String(row.artistName ?? '').trim() || '—',
      }
    })
})

async function ensureSongsLoaded() {
  if (rawSongsList().length > 0) return
  try {
    await userStore.fetchSongs()
  } catch {
    // errors surfaced in UserStore
  }
}

/** Preview resolves playlist `{ id }` refs via the song catalog — fetch when dialog opens. */
watch(
  () => props.modelValue,
  async (open) => {
    if (open) await ensureSongsLoaded()
  },
)

watch(
  playlists,
  (list) => {
    if (!list.length) {
      selectedPlaylistKey.value = null
      return
    }
    if (
      selectedPlaylistKey.value == null ||
      list.findIndex((p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value)) < 0
    ) {
      selectedPlaylistKey.value = playlistStableKey(list[0], 0)
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

function votingPlaylistForSharing() {
  return previewSongs.value.map((song) => ({
    id: song.id,
    songName: song.name,
    artist: song.artistName === '—' ? '' : song.artistName,
  }))
}

function onActivate() {
  try {
    const sharingParams = buildVotingSharingParams({
      playlistName: playlistDisplayName(selectedPlaylist.value),
      maxSelections: maxSelections.value,
      title: voteTitle.value,
      playlist: votingPlaylistForSharing(),
    })
    emit('activate', sharingParams)
    close()
  } catch (err) {
    alert(err?.message ?? String(err))
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    width="92%"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-vote-outline" color="info" />
          הפעלת הצבעה על שירים
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          הקהל יבחרו שירים מהפלייליסט שתגדירו.
        </p>

        <v-row dense>
          <v-col cols="12">
            <v-select
              v-model="selectedPlaylistKey"
              label="פלייליסט להצבעה"
              :items="playlistOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              hide-details="auto"
              :disabled="!playlistOptions.length"
            />
          </v-col>
          <v-col cols="12" sm="7">
            <v-text-field
              v-model="voteTitle"
              label="כותרת להצבעה"
              density="comfortable"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" sm="5">
            <v-text-field
              v-model.number="maxSelections"
              label="מקסימום שירים לבחירה"
              type="number"
              min="1"
              max="99"
              density="comfortable"
              hide-details="auto"
            />
          </v-col>
        </v-row>
        <p v-if="!playlistOptions.length" class="text-caption text-warning mb-2">
          אין פלייליסטים — הוסף בלשונית פלייליסטים.
        </p>

        <div class="text-caption text-medium-emphasis mt-4 mb-2">רשימת השירים שתוצג לקהל</div>
        <v-card variant="outlined">
          <v-list
            v-if="previewSongs.length"
            density="comfortable"
            class="py-0 activate-voting-dialog__song-list"
          >
            <v-list-item
              v-for="song in previewSongs"
              :key="song.id"
              class="activate-voting-dialog__list-item"
            >
              <template #prepend>
                <v-checkbox-btn :model-value="false" color="primary" density="compact" disabled />
              </template>
              <v-list-item-title class="text-body-2 activate-voting-dialog__song-line">
                <span class="font-weight-medium">{{ song.name }}</span>
                <span v-if="song.artistName && song.artistName !== '—'" class="text-medium-emphasis">
                  · {{ song.artistName }}
                </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis pa-4 text-center mb-0">
            אין שירים בפלייליסט שנבחר.
          </p>
        </v-card>

        <div class="popup-btn-row mt-4">
          <v-btn color="info" :disabled="!selectedPlaylist" @click="onActivate">הפעל</v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* ~4 comfortable-density rows, then scroll */
.activate-voting-dialog__song-list {
  max-height: 14rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.activate-voting-dialog__list-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  min-height: 3.5rem;
}

.activate-voting-dialog__list-item:last-child {
  border-bottom: none;
}

.activate-voting-dialog__song-line {
  white-space: normal;
  line-height: 1.4;
}
</style>
