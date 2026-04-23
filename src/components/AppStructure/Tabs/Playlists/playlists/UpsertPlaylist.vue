<template>
  <v-container class="upsert-playlist pa-2">
    <v-row justify="center">
      <v-col cols="12">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            {{ isUpdateMode ? 'עדכון פלייליסט' : 'הוספת פלייליסט' }}
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </v-card-title>

          <v-card-text class="pt-2">
            <v-row class="upsert-playlist__columns" dense>
              <v-col cols="12" md="6" class="upsert-playlist__col-form">
                <v-text-field
                  v-model="playlistName"
                  class="upsert-playlist__name"
                  label="שם הפלייליסט"
                  density="comfortable"
                  hide-details="auto"
                  :rules="[requiredRule]"
                />

                <div class="upsert-playlist__list-head text-subtitle-2 text-medium-emphasis mb-1">
                  שירים נבחרים
                </div>
                <p class="upsert-playlist__reorder-hint text-caption text-medium-emphasis mb-1">
                  לשינוי הסדר: השתמש בחיצים למעלה / למטה ליד כל שורה.
                </p>
                <v-card variant="outlined" class="upsert-playlist__list-card">
                  <v-list v-if="selectedSongs.length" density="compact" class="py-0">
                    <v-list-item
                      v-for="(song, index) in selectedSongs"
                      :key="songKey(song)"
                      :title="selectedSongListTitle(song)"
                      :subtitle="selectedSongListSubtitle(song)"
                    >
                      <template #prepend>
                        <div class="upsert-playlist__reorder">
                          <v-btn
                            icon="mdi-chevron-up"
                            variant="text"
                            size="x-small"
                            density="compact"
                            :disabled="index === 0"
                            aria-label="הזז למעלה ברשימה"
                            @click="moveSelectedUp(index)"
                          />
                          <v-btn
                            icon="mdi-chevron-down"
                            variant="text"
                            size="x-small"
                            density="compact"
                            :disabled="index === selectedSongs.length - 1"
                            aria-label="הזז למטה ברשימה"
                            @click="moveSelectedDown(index)"
                          />
                        </div>
                      </template>
                      <template #append>
                        <v-btn
                          icon="mdi-close"
                          variant="text"
                          size="small"
                          density="comfortable"
                          aria-label="הסר מהפלייליסט"
                          @click="removeFromSelected(song)"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                  <div v-else class="upsert-playlist__empty text-body-2 text-medium-emphasis pa-4">
                    עדיין לא נבחרו שירים. בחר משמאל.
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" md="6" class="upsert-playlist__col-catalog">
                <div class="upsert-playlist__list-head text-subtitle-2 text-medium-emphasis mb-1">
                  כל השירים
                </div>
                <v-card variant="outlined" class="upsert-playlist__catalog-card">
                  <v-data-table
                    class="upsert-playlist__catalog-table"
                    :headers="catalogHeaders"
                    :items="catalogTableItems"
                    :loading="songsLoading"
                    item-value="__rowKey"
                    density="compact"
                    hide-default-footer
                    fixed-header
                    :height="catalogTableHeightPx"
                  >
                    <template #item.name="{ item }">
                      <span class="font-weight-medium">{{ displaySongName(item) }}</span>
                    </template>
                    <template #item.categoryName="{ item }">
                      <span class="text-body-2">{{ item.categoryName || '—' }}</span>
                    </template>
                    <template #item.artistName="{ item }">
                      <span class="text-body-2">{{ item.artistName || '—' }}</span>
                    </template>
                    <template #item.actions="{ item }">
                      <v-btn
                        icon="mdi-plus"
                        variant="text"
                        size="small"
                        density="comfortable"
                        aria-label="הוסף לפלייליסט"
                        @click="addToSelected(item)"
                      />
                    </template>
                    <template #no-data>
                      <div class="upsert-playlist__empty text-body-2 text-medium-emphasis pa-4">
                        {{ catalogNoDataText }}
                      </div>
                    </template>
                  </v-data-table>
                </v-card>
              </v-col>
            </v-row>

            <div class="popup-btn-row mt-4">
              <v-btn color="primary" :loading="isSaving" @click="savePlaylist">
                {{ isUpdateMode ? 'עדכן' : 'הוסף' }}
              </v-btn>
              <v-btn :disabled="isSaving" @click="closeDialog">סגור</v-btn>
              <v-spacer />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { songRowForTable } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'

const catalogHeaders = [
  { title: 'שם', key: 'name', sortable: true, minWidth: 120 },
  { title: 'קטגוריה', key: 'categoryName', sortable: true, minWidth: 100 },
  { title: 'אמן', key: 'artistName', sortable: true, minWidth: 100 },
  { title: '', key: 'actions', sortable: false, align: 'end', width: 52, minWidth: 52 },
]

/** Match scroll area to selected-songs card (fixed-header table needs numeric height). */
const catalogTableHeightPx = 420

const props = defineProps({
  showDialog: {
    type: Boolean,
    required: true,
  },
  editPlaylist: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close-dialog', 'saved'])

const userStore = useUserStore()
const playlistName = ref('')
const selectedSongs = ref([])
const songsLoading = ref(false)
const isSaving = ref(false)

const isUpdateMode = computed(() => {
  const p = props.editPlaylist
  if (!p || typeof p !== 'object') return false
  const id = p.id ?? p.Id
  return id != null && String(id).trim() !== ''
})

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

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

function songKey(s) {
  if (!s || typeof s !== 'object') return ''
  const id = s.id ?? s.Id
  if (id != null && String(id).trim() !== '') return `id:${String(id).trim()}`
  const name = firstDefinedString(s, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  const url = firstDefinedString(s, ['url', 'Url', 'link', 'Link'])
  return `n:${name}|u:${url}`
}

const categories = computed(() =>
  Array.isArray(userStore.user?.categories) ? userStore.user.categories : [],
)

const artists = computed(() =>
  Array.isArray(userStore.user?.artists) ? userStore.user.artists : [],
)

/** Resolved row for list display (names, not raw category/artist ids). */
function selectedSongTableRow(song) {
  return songRowForTable(song, categories.value, artists.value)
}

function selectedSongListTitle(song) {
  return displaySongName(selectedSongTableRow(song))
}

function selectedSongListSubtitle(song) {
  const row = selectedSongTableRow(song)
  const art = String(row.artistName ?? '').trim()
  const cat = String(row.categoryName ?? '').trim()
  const bits = [art, cat].filter(Boolean)
  return bits.length ? bits.join(' · ') : undefined
}

const catalogTableItems = computed(() => {
  const list = Array.isArray(userStore.songs) ? userStore.songs : []
  const catList = categories.value
  const artList = artists.value
  const selectedKeys = new Set(selectedSongs.value.map((s) => songKey(s)))
  return [...list]
    .filter((s) => !selectedKeys.has(songKey(s)))
    .map((s) => {
      const row = songRowForTable(s, catList, artList)
      return { ...row, __rowKey: songKey(row) }
    })
    .sort((a, b) => displaySongName(a).localeCompare(displaySongName(b), 'he'))
})

const catalogNoDataText = computed(() => {
  if (songsLoading.value) return 'טוען…'
  const all = Array.isArray(userStore.songs) ? userStore.songs : []
  if (all.length === 0) return 'אין שירים. הוסף שירים בלשונית השירים.'
  if (catalogTableItems.value.length === 0) return 'כל השירים כבר נוספו לפלייליסט.'
  return ''
})

function displaySongName(row) {
  const n = firstDefinedString(row, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  return n || '(ללא שם)'
}

function isSelected(song) {
  const k = songKey(song)
  return selectedSongs.value.some((x) => songKey(x) === k)
}

function addToSelected(song) {
  if (isSelected(song)) return
  selectedSongs.value = [...selectedSongs.value, song]
}

function removeFromSelected(song) {
  const k = songKey(song)
  selectedSongs.value = selectedSongs.value.filter((x) => songKey(x) !== k)
}

function moveSelectedUp(index) {
  if (index <= 0) return
  const next = [...selectedSongs.value]
  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
  selectedSongs.value = next
}

function moveSelectedDown(index) {
  if (index >= selectedSongs.value.length - 1) return
  const next = [...selectedSongs.value]
  ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
  selectedSongs.value = next
}

function playlistNameFromEdit(p) {
  if (!p || typeof p !== 'object') return ''
  return firstDefinedString(p, ['name', 'Name', 'playlistName', 'PlaylistName', 'title', 'Title'])
}

/** Resolve playlist entry to a store song row (by id or loose match). */
function resolveSongRef(entry) {
  if (!entry) return null
  if (typeof entry === 'object' && entry !== null && (entry.id != null || entry.Id != null)) {
    const idStr = String(entry.id ?? entry.Id).trim()
    const rawSongs = Array.isArray(userStore.songs) ? userStore.songs : []
    const fromStore = rawSongs.find((s) => String(s.id ?? s.Id ?? '').trim() === idStr)
    if (fromStore) return fromStore
    return entry
  }
  if (typeof entry === 'number' || (typeof entry === 'string' && /^\d+$/.test(String(entry).trim()))) {
    const idStr = String(entry).trim()
    const rawSongs = Array.isArray(userStore.songs) ? userStore.songs : []
    return rawSongs.find((s) => String(s.id ?? s.Id ?? '').trim() === idStr) ?? null
  }
  return typeof entry === 'object' ? entry : null
}

function songsArrayFromEdit(p) {
  if (!p || typeof p !== 'object') return []
  const raw = p.songs ?? p.Songs ?? p.songList ?? p.items ?? []
  if (!Array.isArray(raw)) return []
  return raw.map(resolveSongRef).filter(Boolean)
}

async function ensureSongsLoaded() {
  if (Array.isArray(userStore.songs) && userStore.songs.length > 0) return
  songsLoading.value = true
  try {
    await userStore.fetchSongs()
  } catch {
    // fetchSongs shows alert on failure
  } finally {
    songsLoading.value = false
  }
}

function resetFromProps() {
  const p = props.editPlaylist
  playlistName.value = p ? playlistNameFromEdit(p) : ''
  const resolved = songsArrayFromEdit(p)
  selectedSongs.value = resolved.length ? resolved : []
}

watch(
  () => [props.showDialog, props.editPlaylist],
  async ([open]) => {
    if (!open) return
    await ensureSongsLoaded()
    await nextTick()
    resetFromProps()
  },
  { flush: 'post', immediate: true },
)

function closeDialog() {
  emit('close-dialog')
}

async function savePlaylist() {
  const name = String(playlistName.value ?? '').trim()
  if (!name) {
    alert('יש להזין שם פלייליסט')
    return
  }

  const songs = selectedSongs.value.map((s) => {
    const { __rowKey, ...rest } = s
    return { ...rest }
  })

  isSaving.value = true
  try {
    const saved = await userStore.upsertPlaylist({
      id: props.editPlaylist?.id ?? props.editPlaylist?.Id ?? null,
      name,
      songs,
    })
    if (!saved) return
    emit('saved', saved)
    closeDialog()
  } catch (error) {
    console.error('Failed to save playlist:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.upsert-playlist__columns {
  align-items: stretch;
}

.upsert-playlist__list-card {
  max-height: min(52vh, 420px);
  overflow-y: auto;
}

.upsert-playlist__catalog-card {
  overflow: hidden;
}

.upsert-playlist__empty {
  text-align: center;
}

.upsert-playlist__name {
  margin-bottom: 8px;
}

.upsert-playlist__reorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-inline-end: 4px;
}

.upsert-playlist__reorder-hint {
  line-height: 1.35;
}
</style>
