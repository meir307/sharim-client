<script setup>
import { ref } from 'vue'
import PlaylistsMain from './playlists/PlaylistsMain.vue'
import UpsertPlaylist from './playlists/UpsertPlaylist.vue'

const showUpsertPlaylistDialog = ref(false)
const editPlaylist = ref(null)

function onAddPlaylist() {
  editPlaylist.value = null
  showUpsertPlaylistDialog.value = true
}

function onCloseUpsertPlaylistDialog() {
  showUpsertPlaylistDialog.value = false
  editPlaylist.value = null
}

function onEditPlaylistFromList(playlist) {
  editPlaylist.value = playlist && typeof playlist === 'object' ? { ...playlist } : null
  showUpsertPlaylistDialog.value = true
}

function onPlaylistSaved() {
  editPlaylist.value = null
  showUpsertPlaylistDialog.value = false
}
</script>

<template>
  <div class="playlists-tab">
    <div class="content-wrapper">
      <div class="content-area">
        <v-card class="modern-card playlists-tab__content-card" elevation="0">
          <v-card-title class="modern-title playlists-tab__card-title">
            <div class="title-container">
              <h2 class="title-text">פלייליסטים</h2>
              <v-spacer />
              <div class="playlists-tab__header-actions">
                <v-btn color="primary" class="add-btn" @click="onAddPlaylist">
                  <v-icon start>mdi-plus</v-icon>
                  הוסף פלייליסט
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <div class="tiles-container playlists-tab__panel-wrap">
              <div class="playlists-tab__panel-inner">
                <PlaylistsMain @edit-playlist="onEditPlaylistFromList" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showUpsertPlaylistDialog" max-width="960" width="92%" persistent>
      <UpsertPlaylist
        v-if="showUpsertPlaylistDialog"
        :show-dialog="showUpsertPlaylistDialog"
        :edit-playlist="editPlaylist"
        @close-dialog="onCloseUpsertPlaylistDialog"
        @saved="onPlaylistSaved"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
.playlists-tab {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .playlists-tab {
    margin-top: -24px;
    padding-inline: 16px;
    padding-top: 24px;
  }
}

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

.content-area {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.playlists-tab__content-card {
  min-height: 100%;
}

.playlists-tab__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.playlists-tab__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.playlists-tab__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  min-width: 200px;
  min-height: 40px;
}

@media (max-width: 960px) {
  .content-wrapper {
    max-height: none;
    min-height: auto;
  }

  .content-area {
    overflow-y: visible;
  }
}

.playlists-tab__panel-wrap {
  width: 100%;
  min-width: 0;
}

.playlists-tab__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}
</style>
