<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/UserStore'
import UpsertSong from './UpsertSong.vue'
import UpsertCategory from './UpsertCategory.vue'
import UpsertArtist from './UpsertArtist.vue'
import DisplaySong from './DisplaySong.vue'
import { useSongsMainList, useSongsMainActiveTitle, runDeleteCategoryConfirmed, runDeleteArtistConfirmed } from './songsMainTable.js'

const userStore = useUserStore()
const display = useDisplay()

/** Same pattern as UpsertPlaylist catalog `v-data-table`: `fixed-header` + numeric `height` enables body scroll. */
const songsTableHeightPx = computed(() => {
  const h = Number(display.height?.value) || 800
  return Math.min(Math.round(h * 0.68), 760)
})

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const activeTab = ref('songs')
const navDrawerOpen = ref(false)

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

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
const artistTableHeightPx = 420

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

function onDeleteCategory(category) {
  runDeleteCategoryConfirmed(userStore, category)
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

function onDeleteArtist(artist) {
  runDeleteArtistConfirmed(userStore, artist)
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

const songsList = useSongsMainList(userStore, categories, artists, songsLoading);
const activeTitle = useSongsMainActiveTitle(activeTab);

async function onSongSaved() {
  await songsList.loadSongs()
}

const showLinkPreviewDialog = ref(false)
const linkPreviewUrl = ref('')
const linkPreviewTitle = ref('')
const linkPreviewCords = ref(null)
const songSearchText = ref('')
const DISPLAY_SINGLE_SONG_SESSION_KEY = 'displaySingleSongSession'

const filteredSongTableItems = computed(() => {
  const list = Array.isArray(songsList.songTableItems) ? songsList.songTableItems : []
  const q = String(songSearchText.value ?? '').trim().toLowerCase()
  if (!q) return list
  return list.filter((row) => {
    const name = String(row?.name ?? '').toLowerCase()
    const artist = String(row?.artistName ?? '').toLowerCase()
    return name.includes(q) || artist.includes(q)
  })
})

function loadSingleSongSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DISPLAY_SINGLE_SONG_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.show) return null
    const linkUrl = String(parsed.linkUrl ?? '').trim()
    if (!linkUrl) return null
    return {
      linkUrl,
      title: String(parsed.title ?? '').trim(),
      cords: parsed.cords ?? null,
    }
  } catch {
    return null
  }
}

function saveSingleSongSession() {
  if (typeof window === 'undefined') return
  if (showLinkPreviewDialog.value && String(linkPreviewUrl.value ?? '').trim()) {
    localStorage.setItem(
      DISPLAY_SINGLE_SONG_SESSION_KEY,
      JSON.stringify({
        show: true,
        linkUrl: String(linkPreviewUrl.value ?? '').trim(),
        title: String(linkPreviewTitle.value ?? '').trim(),
        cords: linkPreviewCords.value ?? null,
      }),
    )
    return
  }
  localStorage.removeItem(DISPLAY_SINGLE_SONG_SESSION_KEY)
}

function pickCordsFromSongRow(row) {
  if (!row || typeof row !== 'object') return null
  return row.cords ?? row.Cords ?? null
}

function openLinkPreview(item) {
  const url = String(item?.linkUrl ?? '').trim()
  if (!url) return
  linkPreviewUrl.value = url
  linkPreviewTitle.value = String(item?.name ?? '').trim() || url
  const id = item?.id
  const fromStore =
    id != null ? userStore.songs.find((s) => String(s?.id) === String(id)) : null
  linkPreviewCords.value = pickCordsFromSongRow(fromStore) ?? pickCordsFromSongRow(item)
  showLinkPreviewDialog.value = true
  saveSingleSongSession()
}

function onLinkPreviewAfterLeave() {
  linkPreviewUrl.value = ''
  linkPreviewTitle.value = ''
  linkPreviewCords.value = null
  saveSingleSongSession()
}

watch(
  [showLinkPreviewDialog, linkPreviewUrl, linkPreviewTitle, linkPreviewCords],
  () => {
    saveSingleSongSession()
  },
  { deep: true },
)

onMounted(() => {
  const restored = loadSingleSongSession()
  if (!restored) return
  linkPreviewUrl.value = restored.linkUrl
  linkPreviewTitle.value = restored.title || restored.linkUrl
  linkPreviewCords.value = restored.cords
  showLinkPreviewDialog.value = true
})
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
                  <v-text-field
                    v-model="songSearchText"
                    label="חיפוש שיר/אמן"
                    variant="solo-filled"
                    density="compact"
                    flat
                    clearable
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    class="songs-main__songs-search"
                  />
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
                  <v-card variant="outlined" class="songs-main__songs-table-card">
                    <v-data-table
                      class="songs-main__songs-table"
                      :headers="songTableHeaders"
                      :items="filteredSongTableItems"
                      :items-per-page="-1"
                      :loading="songsLoading"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                      fixed-header
                      :height="songsTableHeightPx"
                    >
                      <template #item.name="{ item }">
                        <a
                          v-if="item.linkUrl"
                          href="#"
                          role="button"
                          class="songs-main__song-name-link text-primary text-decoration-none font-weight-medium cursor-pointer"
                          @click.prevent="openLinkPreview(item)"
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
                  </v-card>
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
                      :items-per-page="-1"
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
                      :items-per-page="-1"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                      fixed-header
                      :height="artistTableHeightPx"
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

    <DisplaySong
      v-model="showLinkPreviewDialog"
      :link-url="linkPreviewUrl"
      :song-title="linkPreviewTitle"
      :cords="linkPreviewCords"
      @closed="onLinkPreviewAfterLeave"
    />
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
  max-height: none;
  overflow: visible;
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
  overflow-y: visible;
  height: auto;
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

.songs-main__songs-search {
  min-width: min(34vw, 280px);
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

/* Match UpsertPlaylist `.upsert-playlist__catalog-card` — clip so VDataTable owns internal scroll */
.songs-main__songs-table-card {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.songs-main__song-name-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
