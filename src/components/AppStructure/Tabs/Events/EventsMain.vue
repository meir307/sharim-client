<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PlaylistsMain from './playlists/PlaylistsMain.vue'
import UpsertPlaylist from './playlists/UpsertPlaylist.vue'
import EventsListMain from './events/EventsListMain.vue'

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const display = useDisplay()
const activeSubTab = ref('playlists')
const navDrawerOpen = ref(false)

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

watch(activeSubTab, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})

const showUpsertPlaylistDialog = ref(false)
const editPlaylist = ref(null)

const activeTitle = computed(() =>
  activeSubTab.value === 'playlists' ? 'פלייליסטים' : 'אירועים',
)

function openNavDrawer() {
  navDrawerOpen.value = true
}

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

function onAddEvent() {
  // TODO: open create event flow
}
</script>

<template>
  <div class="events-main">
    <v-navigation-drawer
      v-if="showNavInDrawer"
      v-model="navDrawerOpen"
      temporary
      location="start"
      width="260"
      class="events-main__nav-drawer"
    >
      <v-card class="navigation-card events-main__nav-drawer-card" elevation="0" variant="flat">
        <v-tabs
          v-model="activeSubTab"
          direction="vertical"
          class="events-main__tabs"
          bg-color="transparent"
          color="primary"
          slider-color="primary"
          density="comfortable"
        >
          <v-tab value="events" prepend-icon="mdi-calendar-star" text="אירועים" class="text-none" />
          <v-tab value="playlists" prepend-icon="mdi-playlist-music" text="פלייליסטים" class="text-none" />
         
        </v-tabs>
      </v-card>
    </v-navigation-drawer>

    <div class="content-wrapper">
      <aside class="navigation-menu d-none d-md-block">
        <v-card class="navigation-card" elevation="0" variant="flat">
          <v-tabs
            v-model="activeSubTab"
            direction="vertical"
            class="events-main__tabs"
            bg-color="transparent"
            color="primary"
            slider-color="primary"
            density="comfortable"
          >
            <v-tab value="events" prepend-icon="mdi-calendar-star" text="אירועים" class="text-none" />
            <v-tab value="playlists" prepend-icon="mdi-playlist-music" text="פלייליסטים" class="text-none" />
            
          </v-tabs>
        </v-card>
      </aside>

      <div class="content-area">
        <v-card class="modern-card events-main__content-card" elevation="0">
          <v-card-title class="modern-title events-main__card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="events-main__nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              ></v-btn>
              <h2 class="title-text">{{ activeTitle }}</h2>
              <v-spacer />
              <div class="events-main__header-actions">
                <template v-if="activeSubTab === 'playlists'">
                  <v-btn color="primary" class="add-btn" @click="onAddPlaylist">
                    <v-icon start>mdi-plus</v-icon>
                    הוסף פלייליסט
                  </v-btn>
                </template>
                <template v-else-if="activeSubTab === 'events'">
                  <v-btn color="primary" class="add-btn" @click="onAddEvent">
                    <v-icon start>mdi-plus</v-icon>
                    הוסף אירוע
                  </v-btn>
                </template>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-tabs-window v-model="activeSubTab" class="events-main__window">
              <v-tabs-window-item value="playlists">
                <div class="tiles-container events-main__panel-wrap">
                  <div class="events-main__panel-inner">
                    <PlaylistsMain @edit-playlist="onEditPlaylistFromList" />
                  </div>
                </div>
              </v-tabs-window-item>
              <v-tabs-window-item value="events">
                <div class="tiles-container events-main__panel-wrap">
                  <div class="events-main__panel-inner">
                    <EventsListMain />
                  </div>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
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
.events-main {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .events-main {
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

.events-main__content-card {
  min-height: 100%;
}

.events-main__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.events-main__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.events-main__nav-open {
  flex-shrink: 0;
}

.events-main__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
  min-width: 200px;
  min-height: 40px;
}

.events-main__tabs {
  width: 100%;
}

.events-main__tabs :deep(.v-tab) {
  justify-content: flex-start;
}

.events-main__window :deep(.v-window__container) {
  min-height: 200px;
}

.events-main__window :deep(.v-window-item) {
  min-height: 200px;
}

.events-main__window :deep(.tiles-container) {
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

.events-main__nav-drawer-card {
  height: 100%;
  border-radius: 0;
  border: none;
}

.events-main__nav-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.events-main__panel-wrap {
  width: 100%;
  min-width: 0;
}

.events-main__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}
</style>
