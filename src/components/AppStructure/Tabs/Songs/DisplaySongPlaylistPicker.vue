<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { songRowForTable } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'

const open = defineModel({ type: Boolean, default: false })

const userStore = useUserStore()

const props = defineProps({
  songs: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
  playlistName: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const TITLE_KEYS = ['name', 'Name', 'title', 'Title', 'songName', 'SongName']

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

const rows = computed(() =>
  (Array.isArray(props.songs) ? props.songs : []).map((song, index) => {
    const row = songRowForTable(song, categories.value, artists.value)
    const artist = String(row.artistName ?? '').trim()
    return {
      index,
      title: firstDefinedString(row, TITLE_KEYS) || `שיר ${index + 1}`,
      artist: artist && artist !== '—' ? artist : '',
    }
  }),
)

const dialogTitle = computed(() => {
  const name = String(props.playlistName ?? '').trim()
  return name ? `רשימת שירים · ${name}` : 'רשימת שירים'
})

function close() {
  open.value = false
}

function onSelect(index) {
  emit('select', index)
  open.value = false
}
</script>

<template>
  <v-dialog
    v-model="open"
    class="display-song-playlist-picker-dialog"
    max-width="480"
    width="94%"
    scrollable
    persistent
  >
    <v-card class="display-song-playlist-picker" dir="rtl">
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2 min-w-0">
          <v-icon icon="mdi-playlist-music" color="primary" class="flex-shrink-0" />
          <span class="text-truncate">{{ dialogTitle }}</span>
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-list density="comfortable" class="display-song-playlist-picker__list py-0">
          <v-list-item
            v-for="row in rows"
            :key="row.index"
            class="display-song-playlist-picker__item"
            :class="{ 'display-song-playlist-picker__item--active': row.index === activeIndex }"
            :active="row.index === activeIndex"
            :color="row.index === activeIndex ? 'primary' : undefined"
            :variant="row.index === activeIndex ? 'tonal' : 'text'"
            @click="onSelect(row.index)"
          >
            <template #prepend>
              <v-icon
                :icon="row.index === activeIndex ? 'mdi-music-note' : 'mdi-music-note-outline'"
                :color="row.index === activeIndex ? 'primary' : undefined"
                size="22"
              />
            </template>
            <v-list-item-title
              class="text-body-1"
              :class="{ 'font-weight-bold': row.index === activeIndex }"
            >
              {{ row.title }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="row.artist" class="text-body-2">
              {{ row.artist }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.display-song-playlist-picker-dialog :deep(.v-overlay) {
  z-index: 2700 !important;
}

.display-song-playlist-picker-dialog :deep(.v-overlay__content) {
  z-index: 2700 !important;
}

.display-song-playlist-picker__list {
  max-height: min(60dvh, 520px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.display-song-playlist-picker__item {
  cursor: pointer;
}

.display-song-playlist-picker__item + .display-song-playlist-picker__item {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.display-song-playlist-picker__item--active :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-primary));
}
</style>
