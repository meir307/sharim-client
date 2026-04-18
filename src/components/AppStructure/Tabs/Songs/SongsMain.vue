<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/UserStore'
import UpsertSong from './UpsertSong.vue'
import UpsertCategory from './UpsertCategory.vue'
import UpsertArtist from './UpsertArtist.vue'

const userStore = useUserStore()
const display = useDisplay()

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const activeTab = ref('songs')
const navDrawerOpen = ref(false)

const showNavInDrawer = computed(() => (display.width?.value ?? 0) < NAV_DRAWER_BREAKPOINT)

watch(activeTab, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})
const showUpsertDialog = ref(false)
const selectedSong = ref(null)
const songsLoading = ref(false)

const showCategoryDialog = ref(false)
const selectedCategory = ref(null)

const showArtistDialog = ref(false)
const selectedArtist = ref(null)

const categories = computed(() => {
  return Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
})

const artists = computed(() => {
  return Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
})

/** Fixed width for name column in categories / artists tables (px) — sync with scoped CSS */
const entityNameColPx = 160

const entityTableHeaders = [
  {
    title: 'שם',
    key: 'name',
    sortable: true,
    width: entityNameColPx,
    minWidth: entityNameColPx,
    maxWidth: entityNameColPx,
    nowrap: true,
  },
  { title: 'פעולות', key: 'actions', sortable: false, align: 'end', minWidth: 96 },
]

const songTableHeaders = [
  { title: 'שם', key: 'name', sortable: true, minWidth: 140 },
  { title: 'קטגוריה', key: 'categoryName', sortable: true, minWidth: 120 },
  { title: 'אמן', key: 'artistName', sortable: true, minWidth: 120 },
  { title: 'פעולות', key: 'actions', sortable: false, align: 'end', width: 96, minWidth: 96 },
]

function looksLikeNumericId(value) {
  if (value == null || value === '') return false
  if (typeof value === 'number' && Number.isFinite(value)) return true
  const s = String(value).trim()
  return s !== '' && /^\d+$/.test(s)
}

function categoryNameForSong(song, catList) {
  const v = song?.category
  if (v == null || v === '') return ''
  if (looksLikeNumericId(v)) {
    const c = catList.find((x) => String(x?.id) === String(v).trim())
    return c?.name != null ? String(c.name).trim() : String(v)
  }
  return String(v).trim()
}

function artistNameForSong(song, artList) {
  const v = song?.artist
  if (v == null || v === '') return ''
  if (looksLikeNumericId(v)) {
    const a = artList.find((x) => String(x?.id) === String(v).trim())
    return a?.name != null ? String(a.name).trim() : String(v)
  }
  return String(v).trim()
}

/** External URL for the song name cell (supports common API casings). */
function songListUrl(row) {
  if (!row || typeof row !== 'object') return ''
  const keys = ['url', 'Url', 'link', 'Link', 'songUrl', 'SongUrl']
  for (const k of keys) {
    if (!(k in row)) continue
    const v = row[k]
    if (v != null && String(v).trim() !== '') {
      return String(v).trim()
    }
  }
  return ''
}

function songRowForTable(s, catList, artList) {
  const linkUrl = songListUrl(s)
  const row = Object.assign({}, s)
  row.categoryName = categoryNameForSong(s, catList)
  row.artistName = artistNameForSong(s, artList)
  row.linkUrl = linkUrl
  return row
}

const songsForTable = computed(() => {
  const catList = categories.value
  const artList = artists.value
  return userStore.songs.map((s) => songRowForTable(s, catList, artList))
})

async function loadSongs() {
  songsLoading.value = true
  try {
    await userStore.fetchSongs()
  } catch {
    // `fetchSongs` clears `userStore.songs` on failure
  } finally {
    songsLoading.value = false
  }
}

onMounted(() => {
  loadSongs()
})

const tabTitles = {
  songs: 'שירים',
  categories: 'קטגוריות',
  artists: 'אמנים',
}

const activeTitle = computed(() => tabTitles[activeTab.value] ?? 'שירים')

function onAddSong() {
  selectedSong.value = null
  showUpsertDialog.value = true
}

function onAddCategory() {
  selectedCategory.value = null
  showCategoryDialog.value = true
}

function onEditCategory(category) {
  selectedCategory.value = category
  showCategoryDialog.value = true
}

async function onDeleteCategory(category) {
  const name = category?.name ?? ''
  if (!window.confirm(`למחוק את הקטגוריה "${name}"?`)) {
    return
  }
  try {
    await userStore.deleteCategory(category.id)
  } catch {
    // errors surfaced in store
  }
}

function onCloseCategoryDialog() {
  showCategoryDialog.value = false
}

function onAddArtist() {
  selectedArtist.value = null
  showArtistDialog.value = true
}

function onEditArtist(artist) {
  selectedArtist.value = artist
  showArtistDialog.value = true
}

async function onDeleteArtist(artist) {
  const name = artist?.name ?? ''
  if (!window.confirm(`למחוק את האמן "${name}"?`)) {
    return
  }
  try {
    await userStore.deleteArtist(artist.id)
  } catch {
    // errors surfaced in store
  }
}

function onCloseArtistDialog() {
  showArtistDialog.value = false
}

function onEditSong(song) {
  selectedSong.value = song
  showUpsertDialog.value = true
}

function onCloseDialog() {
  showUpsertDialog.value = false
  selectedSong.value = null
}

function openNavDrawer() {
  navDrawerOpen.value = true
}

async function onSongSaved() {
  await loadSongs()
}
</script>

<template>
  <div class="songs-main">
    <v-navigation-drawer
      v-if="showNavInDrawer"
      v-model="navDrawerOpen"
      temporary
      location="start"
      width="260"
      class="songs-main__nav-drawer"
    >
      <v-card class="navigation-card songs-main__nav-drawer-card" elevation="0" variant="flat">
        <v-tabs
          v-model="activeTab"
          direction="vertical"
          class="songs-main__tabs"
          bg-color="transparent"
          color="primary"
          slider-color="primary"
          density="comfortable"
        >
          <v-tab value="songs" prepend-icon="mdi-music-note" text="שירים" class="text-none" />
          <v-tab value="categories" prepend-icon="mdi-shape" text="קטגוריות" class="text-none" />
          <v-tab value="artists" prepend-icon="mdi-account-music" text="אמנים" class="text-none" />
        </v-tabs>
      </v-card>
    </v-navigation-drawer>

    <div class="content-wrapper">
      <aside class="navigation-menu d-none d-md-block">
        <v-card class="navigation-card" elevation="0" variant="flat">
          <v-tabs
            v-model="activeTab"
            direction="vertical"
            class="songs-main__tabs"
            bg-color="transparent"
            color="primary"
            slider-color="primary"
            density="comfortable"
          >
            <v-tab value="songs" prepend-icon="mdi-music-note" text="שירים" class="text-none" />
            <v-tab value="categories" prepend-icon="mdi-shape" text="קטגוריות" class="text-none" />
            <v-tab value="artists" prepend-icon="mdi-account-music" text="אמנים" class="text-none" />
          </v-tabs>
        </v-card>
      </aside>

      <div class="content-area">
        <v-card class="modern-card songs-main__content-card" elevation="0">
          <v-card-title class="modern-title songs-main__card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="songs-main__nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              ></v-btn>
              <h2 class="title-text">{{ activeTitle }}</h2>
              <v-spacer />
              <div class="songs-main__header-actions">
                <template v-if="activeTab === 'songs'">
                 
                  <v-btn color="primary" class="add-btn" @click="onAddSong">
                    <v-icon start>mdi-plus</v-icon>
                    הוסף שיר
                  </v-btn>
                </template>
                <template v-else-if="activeTab === 'categories'">
                  <v-btn color="primary" class="add-btn" @click="onAddCategory">
                    <v-icon start>mdi-plus</v-icon>
                    הוסף קטגוריה
                  </v-btn>
                </template>
                <template v-else-if="activeTab === 'artists'">
                  <v-btn color="primary" class="add-btn" @click="onAddArtist">
                    <v-icon start>mdi-plus</v-icon>
                    הוסף אמן
                  </v-btn>
                </template>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-tabs-window v-model="activeTab" class="songs-main__window">
              <v-tabs-window-item value="songs">
                <div class="tiles-container songs-main__songs-table-wrap">
                  <div class="songs-main__songs-table-inner">
                    <v-data-table
                      class="songs-main__songs-table"
                      :headers="songTableHeaders"
                      :items="songsForTable"
                      :loading="songsLoading"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                    >
                      <template #item.name="{ item }">
                        <a
                          v-if="item.linkUrl"
                          :href="item.linkUrl"
                          class="songs-main__song-name-link text-primary text-decoration-none font-weight-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {{ item.name }}
                        </a>
                        <span v-else class="font-weight-medium">{{ item.name }}</span>
                      </template>
                      <template #item.actions="{ item }">
                        <v-btn
                          size="small"
                          variant="text"
                          color="primary"
                          prepend-icon="mdi-pencil"
                          aria-label="ערוך שיר"
                          @click="onEditSong(item)"
                        >
                          ערוך
                        </v-btn>
                      </template>
                      <template #no-data>
                        <div class="no-data pa-6">
                          {{ songsLoading ? 'טוען…' : 'אין שירים. לחץ על &quot;הוסף שיר&quot;.' }}
                        </div>
                      </template>
                    </v-data-table>
                  </div>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="categories">
                <div
                  class="tiles-container songs-main__entity-wrap"
                  :style="{ '--entity-name-col': `${entityNameColPx}px` }"
                >
                  <div class="songs-main__entity-narrow">
                    <v-data-table
                      class="songs-main__entity-table"
                      :headers="entityTableHeaders"
                      :items="categories"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                    >
                      <template #colgroup>
                        <colgroup>
                          <col class="songs-main__entity-col-name" />
                          <col />
                        </colgroup>
                      </template>
                      <template #item.actions="{ item }">
                        <div class="songs-main__entity-actions">
                          <v-btn
                            icon="mdi-pencil"
                            size="small"
                            variant="text"
                            color="primary"
                            aria-label="ערוך קטגוריה"
                            @click="onEditCategory(item)"
                          />
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            aria-label="מחק קטגוריה"
                            @click="onDeleteCategory(item)"
                          />
                        </div>
                      </template>
                      <template #no-data>
                        <div class="no-data pa-6">אין קטגוריות. לחץ על &quot;הוסף קטגוריה&quot;.</div>
                      </template>
                    </v-data-table>
                  </div>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="artists">
                <div
                  class="tiles-container songs-main__entity-wrap"
                  :style="{ '--entity-name-col': `${entityNameColPx}px` }"
                >
                  <div class="songs-main__entity-narrow">
                    <v-data-table
                      class="songs-main__entity-table"
                      :headers="entityTableHeaders"
                      :items="artists"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                    >
                      <template #colgroup>
                        <colgroup>
                          <col class="songs-main__entity-col-name" />
                          <col />
                        </colgroup>
                      </template>
                      <template #item.actions="{ item }">
                        <div class="songs-main__entity-actions">
                          <v-btn
                            icon="mdi-pencil"
                            size="small"
                            variant="text"
                            color="primary"
                            aria-label="ערוך אמן"
                            @click="onEditArtist(item)"
                          />
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            aria-label="מחק אמן"
                            @click="onDeleteArtist(item)"
                          />
                        </div>
                      </template>
                      <template #no-data>
                        <div class="no-data pa-6">אין אמנים. לחץ על &quot;הוסף אמן&quot;.</div>
                      </template>
                    </v-data-table>
                  </div>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showUpsertDialog" max-width="1000" width="90%" persistent>
      <UpsertSong
        v-if="showUpsertDialog"
        :show-dialog="showUpsertDialog"
        :edit-song="selectedSong"
        @close-dialog="onCloseDialog"
        @saved="onSongSaved"
      />
    </v-dialog>

    <v-dialog v-model="showCategoryDialog" max-width="640" width="90%" persistent>
      <UpsertCategory
        :show-dialog="showCategoryDialog"
        :edit-category="selectedCategory"
        @close-dialog="onCloseCategoryDialog"
        @saved="onCloseCategoryDialog"
      />
    </v-dialog>

    <v-dialog v-model="showArtistDialog" max-width="640" width="90%" persistent>
      <UpsertArtist
        :show-dialog="showArtistDialog"
        :edit-artist="selectedArtist"
        @close-dialog="onCloseArtistDialog"
        @saved="onCloseArtistDialog"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
/*
 * Full width: break out of App.vue v-container max-width (1280px) to use v-main width.
 * margin-inline centers the 100vw strip on the constrained parent (full-bleed pattern).
 */
.songs-main {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .songs-main {
    margin-top: -24px;
    padding-inline: 16px;
    padding-top: 24px;
  }
}

/* Memunim FactoryMain.vue — menu right, content left in RTL */
.content-wrapper {
  display: flex;
  position: relative;
  width: 100%;
  min-width: 0;
  gap: 16px;
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  overflow: hidden;
}

.navigation-menu {
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex: 0 0 auto;
  flex-shrink: 0;
  width: 250px;
  z-index: 10;
}

.navigation-card {
  width: 100%;
  padding: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
}

.content-area {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.songs-main__content-card {
  min-height: 100%;
}

/* Stable purple header height across tab changes */
.songs-main__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.songs-main__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.songs-main__nav-open {
  flex-shrink: 0;
}

.songs-main__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  /* Reserve space so header height stays similar when switching (menu + add vs single add) */
  min-width: 200px;
  min-height: 40px;
}

.songs-main__tabs {
  width: 100%;
}

.songs-main__tabs :deep(.v-tab) {
  justify-content: flex-start;
}

.songs-main__window :deep(.v-window__container) {
  min-height: 200px;
}

.songs-main__window :deep(.v-window-item) {
  min-height: 200px;
}

.songs-main__window :deep(.tiles-container) {
  min-height: 200px;
}

@media (max-width: 960px) {
  .content-wrapper {
    flex-direction: row;
    max-height: none;
    min-height: auto;
  }

  .navigation-menu {
    display: none !important;
  }

  .content-area {
    overflow-y: visible;
  }
}

.songs-main__nav-drawer-card {
  height: 100%;
  border-radius: 0;
  border: none;
}

.songs-main__nav-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.songs-main__song-item + .songs-main__song-item {
  margin-top: 8px;
}

.songs-main__entity-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 4px;
  white-space: nowrap;
}

.songs-main__entity-wrap {
  width: 100%;
  min-width: 0;
}

/* Narrow strip for categories / artists tables (aligned end in LTR coordinates) */
.songs-main__entity-narrow {
  width: 100%;
  max-width: 480px;
  margin-left: auto;
  margin-right: 0;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.songs-main__entity-table :deep(col.songs-main__entity-col-name) {
  width: var(--entity-name-col, 160px);
}

/* Lock first column — Vuetify can still widen cells without this */
.songs-main__entity-wrap :deep(thead th:first-child),
.songs-main__entity-wrap :deep(tbody td:first-child) {
  width: var(--entity-name-col, 160px);
  min-width: var(--entity-name-col, 160px);
  max-width: var(--entity-name-col, 160px);
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}

.songs-main__songs-table-wrap {
  width: 100%;
  min-width: 0;
}

.songs-main__songs-table-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.songs-main__song-name-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
