<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import UpsertSong from './UpsertSong.vue'
import UpsertCategory from './UpsertCategory.vue'

const userStore = useUserStore()

const activeTab = ref('songs')
const showUpsertDialog = ref(false)
const selectedSong = ref(null)
const songs = ref([])

const showCategoryDialog = ref(false)
const selectedCategory = ref(null)

const categories = computed(() => {
  return Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
})

/** Fixed width for category name column (px) — keep in sync with styles below */
const categoryNameColPx = 160

const categoryTableHeaders = [
  {
    title: 'שם',
    key: 'name',
    sortable: true,
    width: categoryNameColPx,
    minWidth: categoryNameColPx,
    maxWidth: categoryNameColPx,
    nowrap: true,
  },
  { title: 'פעולות', key: 'actions', sortable: false, align: 'end', minWidth: 96 },
]

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
  // TODO: open UpsertArtist dialog
}

function onEditSong(song) {
  selectedSong.value = song
  showUpsertDialog.value = true
}

function onCloseDialog() {
  showUpsertDialog.value = false
}

function onSongSaved(savedSong) {
  const index = songs.value.findIndex((song) => song.id === savedSong.id)
  if (index >= 0) {
    songs.value[index] = { ...songs.value[index], ...savedSong }
    return
  }
  songs.value.unshift(savedSong)
}
</script>

<template>
  <div class="songs-main">
    <!-- Memunim FactoryMain: navigation (first in DOM → visual right in RTL) | content (left) -->
    <div class="content-wrapper">
      <aside class="navigation-menu">
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
          <!-- HazardsMain-style header inside content (like Memunim screenshot) -->
          <v-card-title class="modern-title songs-main__card-title">
            <div class="title-container">
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
                <div class="tiles-container">
                  <template v-if="songs.length">
                    <v-card
                      v-for="song in songs"
                      :key="song.id || `${song.name}-${song.artist}`"
                      class="songs-main__song-item"
                      variant="outlined"
                    >
                      <v-card-text class="d-flex align-center justify-space-between py-3">
                        <div class="min-width-0">
                          <div class="font-weight-medium text-truncate">{{ song.name }}</div>
                          <div class="text-body-2 text-medium-emphasis text-truncate">
                            {{ song.artist }} | {{ song.category }} | {{ song.language }}
                          </div>
                        </div>
                        <v-btn
                          size="small"
                          variant="text"
                          color="primary"
                          prepend-icon="mdi-pencil"
                          @click="onEditSong(song)"
                        >
                          ערוך
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </template>
                  <div v-else class="no-data">כאן תוצג רשימת השירים.</div>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="categories">
                <div
                  class="tiles-container songs-main__categories-wrap"
                  :style="{ '--category-name-col': `${categoryNameColPx}px` }"
                >
                  <div class="songs-main__categories-narrow">
                    <v-data-table
                      class="songs-main__categories-table"
                      :headers="categoryTableHeaders"
                      :items="categories"
                      item-value="id"
                      density="comfortable"
                      hide-default-footer
                    >
                      <template #colgroup>
                        <colgroup>
                          <col class="songs-main__category-col-name" />
                          <col />
                        </colgroup>
                      </template>
                      <template #item.actions="{ item }">
                        <div class="songs-main__category-actions">
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
                <div class="tiles-container">
                  <div class="no-data">כאן תוצג רשימת האמנים.</div>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showUpsertDialog" max-width="1000" width="90%" persistent>
      <UpsertSong
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
    flex-direction: column;
    max-height: none;
    min-height: auto;
  }

  .navigation-menu {
    width: 100%;
    position: relative;
  }

  .content-area {
    overflow-y: visible;
  }
}

.songs-main__song-item + .songs-main__song-item {
  margin-top: 8px;
}

.songs-main__category-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 4px;
  white-space: nowrap;
}

.songs-main__categories-wrap {
  width: 100%;
  min-width: 0;
}

/* Centered narrow strip for the categories table */
.songs-main__categories-narrow {
  width: 100%;
  max-width: 480px;
  margin-left: auto;
  margin-right: 0;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.songs-main__categories-table :deep(col.songs-main__category-col-name) {
  width: var(--category-name-col, 160px);
}

/* Lock first column — Vuetify can still widen cells without this */
.songs-main__categories-wrap :deep(thead th:first-child),
.songs-main__categories-wrap :deep(tbody td:first-child) {
  width: var(--category-name-col, 160px);
  min-width: var(--category-name-col, 160px);
  max-width: var(--category-name-col, 160px);
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
