<script setup>
import { ref } from 'vue'
import UpsertSong from './UpsertSong.vue'

const tab = ref('songs')
const showUpsertDialog = ref(false)
const selectedSong = ref(null)
const songs = ref([])

function onAddSong() {
  selectedSong.value = null
  showUpsertDialog.value = true
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
  <div>
    <v-card class="modern-card">
      <v-card-title class="modern-title">
        <div class="title-container">
          <h2 class="title-text">שירים</h2>
          <v-spacer />
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                v-bind="props"
                class="menu-btn"
                color="white"
              />
            </template>
            <v-list>
              <v-list-item disabled>
                <template #prepend>
                  <v-icon>mdi-tune-variant</v-icon>
                </template>
                <v-list-item-title>הגדרות תצוגה</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn color="primary" class="add-btn" @click="onAddSong">
            <v-icon start>mdi-plus</v-icon>
            הוסף שיר
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="pa-0">
        <div class="songs-main__layout d-flex flex-column flex-md-row flex-grow-1 min-height-0">
          <v-tabs
            v-model="tab"
            direction="vertical"
            class="songs-main__tabs flex-shrink-0"
            bg-color="surface"
            color="primary"
            slider-color="primary"
            density="comfortable"
          >
            <v-tab value="songs" prepend-icon="mdi-music-note" text="שירים" class="text-none" />
            <v-tab value="categories" prepend-icon="mdi-shape" text="קטגוריות" class="text-none" />
            <v-tab value="artists" prepend-icon="mdi-account-music" text="אמנים" class="text-none" />
          </v-tabs>

          <v-tabs-window v-model="tab" class="songs-main__window flex-grow-1 min-width-0">
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
              <div class="tiles-container">
                <div class="no-data">כאן תוצג רשימת הקטגוריות.</div>
              </div>
            </v-tabs-window-item>
            <v-tabs-window-item value="artists">
              <div class="tiles-container">
                <div class="no-data">כאן תוצג רשימת האמנים.</div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="showUpsertDialog" max-width="1000" width="90%" persistent>
      <UpsertSong
        :show-dialog="showUpsertDialog"
        :edit-song="selectedSong"
        @close-dialog="onCloseDialog"
        @saved="onSongSaved"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
.songs-main__layout {
  min-height: 280px;
  background: #fafafa;
}

.songs-main__tabs {
  width: 100%;
  max-width: 100%;
  border-inline-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (min-width: 960px) {
  .songs-main__tabs {
    width: 200px;
    max-width: 200px;
  }
}

.songs-main__window :deep(.v-window__container) {
  height: 100%;
}

.songs-main__window :deep(.v-window-item) {
  height: 100%;
  min-height: 220px;
}

.songs-main__window :deep(.tiles-container) {
  min-height: 220px;
}

.songs-main__song-item + .songs-main__song-item {
  margin-top: 8px;
}
</style>
