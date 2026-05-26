<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import EventDetailControl from './EventDetailControl.vue'
import EventDetailVoting from './EventDetailVoting.vue'
import EventDetailFeedback from './EventDetailFeedback.vue'

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const NAV_ITEMS = [
  { id: 'control', title: 'שליטה ושיתוף', icon: 'mdi-broadcast', component: EventDetailControl },
  { id: 'voting', title: 'תוצאות הצבעה', icon: 'mdi-vote-outline', component: EventDetailVoting },
  { id: 'feedback', title: 'תוצאות משוב', icon: 'mdi-comment-text-outline', component: EventDetailFeedback },
]

const props = defineProps({
  event: { type: Object, default: null },
})

const emit = defineEmits(['back', 'edit-event'])

const display = useDisplay()
const navDrawerOpen = ref(false)
const activeSection = ref('control')

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

watch(activeSection, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})

const pageTitle = computed(() => {
  const item = NAV_ITEMS.find((n) => n.id === activeSection.value)
  return item?.title ?? 'אירוע'
})

const activeNavItem = computed(() =>
  NAV_ITEMS.find((n) => n.id === activeSection.value) ?? NAV_ITEMS[0],
)

const event = computed(() => props.event)

/** @type {import('vue').Ref<number | null>} */
const selectedVotingSessionId = ref(null)
/** @type {import('vue').Ref<Array<{ title: string, value: number }>>} */
const votingPlaylistItems = ref([])
const votingTotalVotes = ref(0)
const votingLoading = ref(false)
/** @type {import('vue').Ref<{ refresh?: () => Promise<void> } | null>} */
const votingPanelRef = ref(null)

/** @type {import('vue').Ref<number | null>} */
const selectedFeedbackSessionId = ref(null)
/** @type {import('vue').Ref<Array<{ sessionTitle: string, value: number }>>} */
const feedbackSessionItems = ref([])
const feedbackTotalParticipate = ref(0)
const feedbackLoading = ref(false)
/** @type {import('vue').Ref<{ refresh?: () => Promise<void> } | null>} */
const feedbackPanelRef = ref(null)

const eventDetailId = computed(() => {
  const id = event.value?.id ?? event.value?.Id
  if (id == null || String(id).trim() === '') return null
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
})

watch(activeSection, (section) => {
  if (section !== 'voting') {
    selectedVotingSessionId.value = null
    votingPlaylistItems.value = []
    votingTotalVotes.value = 0
    votingLoading.value = false
  }
  if (section !== 'feedback') {
    selectedFeedbackSessionId.value = null
    feedbackSessionItems.value = []
    feedbackTotalParticipate.value = 0
    feedbackLoading.value = false
  }
})

async function refreshVotingResults() {
  await votingPanelRef.value?.refresh?.()
}

async function refreshFeedbackResults() {
  await feedbackPanelRef.value?.refresh?.()
}

function onVotingLoading(value) {
  votingLoading.value = Boolean(value)
}

function onFeedbackLoading(value) {
  feedbackLoading.value = Boolean(value)
}

function onSelectedVotingSessionId(value) {
  selectedVotingSessionId.value = value
}

function onSelectedFeedbackSessionId(value) {
  selectedFeedbackSessionId.value = value
}

function onVotingTotalVotes(value) {
  votingTotalVotes.value = Number(value) || 0
}

function onFeedbackTotalParticipate(value) {
  feedbackTotalParticipate.value = Number(value) || 0
}

function onVotingPlaylistItems(items) {
  votingPlaylistItems.value = Array.isArray(items) ? items : []
}

function onFeedbackSessionItems(items) {
  if (!Array.isArray(items)) {
    feedbackSessionItems.value = []
    return
  }
  feedbackSessionItems.value = items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      if ('sessionTitle' in item && item.value != null) {
        const value = Number(item.value)
        if (!Number.isFinite(value) || value <= 0) return null
        const sessionTitle = String(item.sessionTitle ?? '').trim()
        return {
          sessionTitle: sessionTitle || `סבב #${value}`,
          value,
        }
      }
      const value = Number(item.id ?? item.Id ?? item.value ?? item.Value)
      const sessionTitle = String(item.title ?? item.Title ?? item.sessionTitle ?? '').trim()
      if (!Number.isFinite(value) || value <= 0) return null
      return {
        sessionTitle: sessionTitle || `סבב #${value}`,
        value,
      }
    })
    .filter(Boolean)
}

function openNavDrawer() {
  navDrawerOpen.value = true
}

function selectSection(id) {
  activeSection.value = id
}

function onBack() {
  emit('back')
}

function onEdit() {
  if (event.value && typeof event.value === 'object') {
    emit('edit-event', { ...event.value })
  }
}
</script>

<template>
  <div class="event-detail">
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

    <div class="event-detail__toolbar">
      <h2 class="event-detail__event-name text-h6 font-weight-bold mb-0">{{ event?.name }}</h2>
      <v-spacer />
      <v-btn
        color="success"
        variant="flat"
        density="comfortable"
        rounded="lg"
        prepend-icon="mdi-arrow-left"
        class="event-detail__back text-none"
        @click="onBack"
      >
        חזרה לרשימה
      </v-btn>
    </div>

    <div class="content-wrapper content-wrapper--in-detail">
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
              <v-select
                v-if="activeSection === 'voting'"
                v-model="selectedVotingSessionId"
                :items="votingPlaylistItems"
                item-title="title"
                item-value="value"
                label="פלייליסט"
                density="compact"
                hide-details
                variant="outlined"
                class="event-detail__session-select ms-3"
                :disabled="!votingPlaylistItems.length"
                style="max-width: 220px"
              />
              <v-select
                v-if="activeSection === 'feedback'"
                v-model="selectedFeedbackSessionId"
                :items="feedbackSessionItems"
                item-title="sessionTitle"
                item-value="value"
                label="כותרת משוב"
                density="compact"
                hide-details
                variant="outlined"
                class="event-detail__session-select ms-3"
                :disabled="!feedbackSessionItems.length"
                style="max-width: 220px"
              />
              <span
                v-if="activeSection === 'voting'"
                class="title-text event-detail__session-total ms-3"
              >
                סה"כ {{ votingTotalVotes }} הצבעות
              </span>
              <span
                v-if="activeSection === 'feedback'"
                class="title-text event-detail__session-total ms-3"
              >
                סה"כ {{ feedbackTotalParticipate }} משתתפים
              </span>
              <v-spacer />
              <v-btn
                v-if="activeSection === 'voting'"
                color="primary"
                class="add-btn event-detail__section-refresh"
                prepend-icon="mdi-refresh"
                :loading="votingLoading"
                :disabled="eventDetailId == null"
                @click="refreshVotingResults"
              >
                רענן
              </v-btn>
              <v-btn
                v-if="activeSection === 'feedback'"
                color="primary"
                class="add-btn event-detail__section-refresh"
                prepend-icon="mdi-refresh"
                :loading="feedbackLoading"
                :disabled="eventDetailId == null"
                @click="refreshFeedbackResults"
              >
                רענן
              </v-btn>
              <div v-if="activeSection === 'control'" class="tab-header-actions">
                <v-btn
                  color="primary"
                  class="add-btn"
                  prepend-icon="mdi-pencil"
                  @click="onEdit"
                >
                  עריכה
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <EventDetailControl v-if="activeSection === 'control'" :event="event" />
            <EventDetailVoting
              v-else-if="activeSection === 'voting'"
              ref="votingPanelRef"
              :event="event"
              :selected-session-id="selectedVotingSessionId"
              @update:selected-session-id="onSelectedVotingSessionId"
              @update:playlist-items="onVotingPlaylistItems"
              @update:total-votes="onVotingTotalVotes"
              @update:loading="onVotingLoading"
            />
            <EventDetailFeedback
              v-else-if="activeSection === 'feedback'"
              ref="feedbackPanelRef"
              :event="event"
              :selected-session-id="selectedFeedbackSessionId"
              @update:selected-session-id="onSelectedFeedbackSessionId"
              @update:feedback-session-items="onFeedbackSessionItems"
              @update:total-participate="onFeedbackTotalParticipate"
              @update:loading="onFeedbackLoading"
            />
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-detail {
  width: 100%;
  min-width: 0;
  overflow: visible;
}

.event-detail__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  padding: 4px 4px 8px;
  overflow: visible;
}

.event-detail__event-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-detail__back {
  flex-shrink: 0;
  height: 35px;
}

.event-detail__back :deep(.v-btn__overlay),
.event-detail__back :deep(.v-btn__underlay) {
  border-radius: inherit;
}

.event-detail__session-select {
  flex-shrink: 0;
}

.event-detail__session-total {
  flex-shrink: 0;
  white-space: nowrap;
}

.event-detail__section-refresh {
  flex-shrink: 0;
}
</style>
