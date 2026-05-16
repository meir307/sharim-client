<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import PlaylistsMain from '../Playlists/playlists/PlaylistsMain.vue'
import UpsertPlaylist from '../Playlists/playlists/UpsertPlaylist.vue'
import FeedbackQuestions from './FeedbackQuestions.vue'
import LandingPage from './LandingPage.vue'
import UpsertLandingPage from './UpsertLandingPage.vue'
import { nextLandingPageId } from './landingPageModel.js'
import { useSettingsContentStore } from '@/stores/SettingsContentStore'
import { useUserStore } from '@/stores/UserStore'

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

const settingsContentStore = useSettingsContentStore()
const { landingPages } = storeToRefs(settingsContentStore)

const userStore = useUserStore()

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

watch(activeSection, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})

const showUpsertPlaylistDialog = ref(false)
const editPlaylist = ref(null)

const feedbackQuestionsDraft = ref([])
const feedbackQuestionsSaving = ref(false)
const feedbackQuestionsRef = ref(null)

function syncFeedbackQuestionsFromUser() {
  const raw = userStore.user?.feedbackQuestions
  feedbackQuestionsDraft.value = Array.isArray(raw) ? raw.map((q) => ({ ...q })) : []
}

watch(
  () => userStore.user?.feedbackQuestions,
  () => syncFeedbackQuestionsFromUser(),
  { immediate: true, deep: true },
)

const showUpsertLandingPageDialog = ref(false)
const editLandingPage = ref(null)

const upsertLandingPageKey = computed(() =>
  editLandingPage.value?.id != null ? String(editLandingPage.value.id) : 'new',
)

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

async function onSaveFeedbackQuestions(questions) {
  feedbackQuestionsSaving.value = true
  try {
    const saved = await userStore.saveFeedbackQuestions(questions)
    feedbackQuestionsDraft.value = saved.map((q) => ({ ...q }))
  } catch {
    // errors surfaced via UserStore (alert)
  } finally {
    feedbackQuestionsSaving.value = false
  }
}

function onAddLandingPage() {
  editLandingPage.value = null
  showUpsertLandingPageDialog.value = true
}

function onCloseUpsertLandingPageDialog() {
  showUpsertLandingPageDialog.value = false
  editLandingPage.value = null
}

function onEditLandingPageFromList(page) {
  editLandingPage.value = page && typeof page === 'object' ? { ...page } : null
  showUpsertLandingPageDialog.value = true
}

function onLandingPageSaved(page) {
  if (!page || typeof page !== 'object') return
  const payload = { ...page }
  const list = [...landingPages.value]
  const idx = list.findIndex((p) => p.id != null && payload.id != null && String(p.id) === String(payload.id))
  if (idx >= 0) {
    list[idx] = payload
  } else {
    if (payload.id == null) {
      payload.id = nextLandingPageId(list)
    }
    list.push(payload)
  }
  settingsContentStore.setLandingPages(list)
  editLandingPage.value = null
  showUpsertLandingPageDialog.value = false
}
</script>

<template>
  <div class="tab-page">
    <v-navigation-drawer
      v-if="showNavInDrawer"
      v-model="navDrawerOpen"
      temporary
      location="start"
      width="260"
      class="tab-nav-drawer"
    >
      <v-card class="navigation-card tab-nav-drawer-card" elevation="0" variant="flat">
        <v-list class="tab-nav-list py-2" density="comfortable" nav>
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
      <aside class="tab-nav-menu d-none d-md-block">
        <v-card class="navigation-card" elevation="0" variant="flat">
          <v-list class="tab-nav-list py-2" density="comfortable" nav>
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
        <v-card class="modern-card tab-content-card" elevation="0">
          <v-card-title class="modern-title tab-card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="tab-nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              />
              <h2 class="title-text">{{ pageTitle }}</h2>
              <v-spacer />
              <div v-if="activeSection === 'playlists'" class="tab-header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddPlaylist">
                  הוסף פלייליסט
                </v-btn>
              </div>
              <div v-else-if="activeSection === 'feedback-questions'" class="tab-header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddFeedbackQuestion">
                  הוסף שאלה
                </v-btn>
              </div>
              <div v-else-if="activeSection === 'landing-pages'" class="tab-header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddLandingPage">
                  הוסף דף נחיתה
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <div v-if="activeSection === 'playlists'" class="tiles-container tab-panel-wrap">
              <div class="tab-panel-inner">
                <PlaylistsMain @edit-playlist="onEditPlaylistFromList" />
              </div>
            </div>
            <div
              v-else-if="activeSection === 'feedback-questions'"
              class="tiles-container tab-panel-wrap tab-panel-wrap--fill"
            >
              <div class="tab-panel-inner tab-panel-inner--fill">
                <FeedbackQuestions
                  ref="feedbackQuestionsRef"
                  v-model="feedbackQuestionsDraft"
                  :saving="feedbackQuestionsSaving"
                  @save="onSaveFeedbackQuestions"
                />
              </div>
            </div>
            <div
              v-else-if="activeSection === 'landing-pages'"
              class="tiles-container tab-panel-wrap"
            >
              <div class="tab-panel-inner">
                <LandingPage
                  v-model="landingPages"
                  @edit-landing-page="onEditLandingPageFromList"
                />
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

    <v-dialog
      v-model="showUpsertLandingPageDialog"
      scrollable
      max-width="720"
      width="92%"
      persistent
    >
      <UpsertLandingPage
        v-if="showUpsertLandingPageDialog"
        :key="upsertLandingPageKey"
        :edit-landing-page="editLandingPage"
        @close-dialog="onCloseUpsertLandingPageDialog"
        @saved="onLandingPageSaved"
      />
    </v-dialog>
  </div>
</template>
