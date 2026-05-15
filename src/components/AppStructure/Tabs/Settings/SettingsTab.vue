<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PlaylistsMain from '../Playlists/playlists/PlaylistsMain.vue'
import UpsertPlaylist from '../Playlists/playlists/UpsertPlaylist.vue'
import FeedbackQuestions from './FeedbackQuestions.vue'

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const NAV_ITEMS = [
  { id: 'playlists', title: 'פלייליסטים', icon: 'mdi-playlist-music' },
  { id: 'feedback-questions', title: 'שאלות משוב', icon: 'mdi-comment-question-outline' },
  { id: 'landing-pages', title: 'דפי נחיתה', icon: 'mdi-web' },
]

const display = useDisplay()
const navDrawerOpen = ref(false)
const activeSection = ref('playlists')

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

watch(activeSection, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})

const showUpsertPlaylistDialog = ref(false)
const editPlaylist = ref(null)

const defaultFeedbackQuestions = ref([
  { id: 1, text: 'איך הייתה ההופעה?', type: 'stars' },
  { id: 2, text: 'מה השיר שהכי אהבת?', type: 'text' },
])

const feedbackQuestionsRef = ref(null)

const pageTitle = computed(() => {
  const item = NAV_ITEMS.find((n) => n.id === activeSection.value)
  return item?.title ?? 'הגדרות'
})

function openNavDrawer() {
  navDrawerOpen.value = true
}

function selectSection(id) {
  activeSection.value = id
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

function onAddFeedbackQuestion() {
  feedbackQuestionsRef.value?.addQuestion()
}
</script>

<template>
  <div class="settings-tab">
    <v-navigation-drawer
      v-if="showNavInDrawer"
      v-model="navDrawerOpen"
      temporary
      location="start"
      width="260"
      class="settings-tab__nav-drawer"
    >
      <v-card class="navigation-card settings-tab__nav-drawer-card" elevation="0" variant="flat">
        <v-list class="settings-tab__nav-list py-2" density="comfortable" nav>
          <v-list-item
            v-for="item in NAV_ITEMS"
            :key="item.id"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            :active="activeSection === item.id"
            color="primary"
            class="text-none"
            @click="selectSection(item.id)"
          />
        </v-list>
      </v-card>
    </v-navigation-drawer>

    <div class="content-wrapper">
      <!-- RTL (dir=rtl): aside first in row → physical right -->
      <aside class="settings-tab__nav-menu d-none d-md-block">
        <v-card class="navigation-card settings-tab__nav-card" elevation="0" variant="flat">
          <v-list class="settings-tab__nav-list py-2" density="comfortable" nav>
            <v-list-item
              v-for="item in NAV_ITEMS"
              :key="item.id"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
              :active="activeSection === item.id"
              color="primary"
              class="text-none"
              @click="selectSection(item.id)"
            />
          </v-list>
        </v-card>
      </aside>

      <div class="content-area">
        <v-card class="modern-card settings-tab__content-card" elevation="0">
          <v-card-title class="modern-title settings-tab__card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="settings-tab__nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              />
              <h2 class="title-text">{{ pageTitle }}</h2>
              <v-spacer />
              <div v-if="activeSection === 'playlists'" class="settings-tab__header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddPlaylist">
                  הוסף פלייליסט
                </v-btn>
              </div>
              <div v-else-if="activeSection === 'feedback-questions'" class="settings-tab__header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddFeedbackQuestion">
                  הוסף שאלה
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <div v-if="activeSection === 'playlists'" class="tiles-container settings-tab__panel-wrap">
              <div class="settings-tab__panel-inner">
                <PlaylistsMain @edit-playlist="onEditPlaylistFromList" />
              </div>
            </div>
            <div
              v-else-if="activeSection === 'feedback-questions'"
              class="tiles-container settings-tab__panel-wrap"
            >
              <div class="settings-tab__panel-inner">
                <FeedbackQuestions
                  ref="feedbackQuestionsRef"
                  v-model="defaultFeedbackQuestions"
                />
              </div>
            </div>
            <div
              v-else-if="activeSection === 'landing-pages'"
              class="tiles-container settings-tab__panel-wrap"
            >
              <div class="settings-tab__panel-inner settings-tab__placeholder pa-8 text-center text-body-1 text-medium-emphasis">
                ניהול דפי נחיתה יתווסף בקרוב.
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
.settings-tab {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .settings-tab {
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

.settings-tab__nav-menu {
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

.settings-tab__nav-list :deep(.v-list-item) {
  justify-content: flex-start;
}

.settings-tab__content-card {
  min-height: 100%;
}

.settings-tab__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.settings-tab__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.settings-tab__nav-open {
  flex-shrink: 0;
}

.settings-tab__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
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

.settings-tab__panel-wrap {
  width: 100%;
  min-width: 0;
}

.settings-tab__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}

.settings-tab__placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-tab__nav-drawer-card {
  height: 100%;
  border-radius: 0;
  border: none;
}

.settings-tab__nav-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
