<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import UpsertEvent from './UpsertEvent.vue'

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const NAV_ITEMS = [
  { id: 'control', title: 'שליטה ושיתוף', icon: 'mdi-broadcast' },
  { id: 'voting', title: 'תוצאות הצבעה', icon: 'mdi-vote-outline' },
  { id: 'feedback', title: 'תוצאות משוב', icon: 'mdi-comment-text-outline' },
]

const props = defineProps({
  event: { type: Object, default: null },
})

const emit = defineEmits(['back'])

const showUpsertEventDialog = ref(false)
const editEvent = ref(null)

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

const demoEvent = {
  id: 1,
  name: 'חתונה — שבת הקרובה',
  date: '2026-05-16',
  shareCode: '483291',
  playlistName: 'פלייליסט חתונה',
}

const ev = computed(() => props.event || demoEvent)

const broadcastModes = [
  { value: 'off', label: 'כבוי', icon: 'mdi-power-standby', color: 'grey', description: 'הקהל רואה "ממתין"' },
  { value: 'voting', label: 'הצבעה', icon: 'mdi-vote-outline', color: 'info', description: 'הקהל מצביע על שירים' },
  { value: 'lyrics', label: 'מילות שירים', icon: 'mdi-broadcast', color: 'success', description: 'הקהל רואה את השיר הנוכחי' },
  { value: 'feedback', label: 'משוב', icon: 'mdi-comment-text-outline', color: 'warning', description: 'הקהל ממלא משוב' },
  { value: 'closed', label: 'סגור', icon: 'mdi-check-circle-outline', color: 'default', description: 'האירוע הסתיים' },
]

const currentBroadcast = ref('off')

const activeBroadcastMeta = computed(() =>
  broadcastModes.find((m) => m.value === currentBroadcast.value) || broadcastModes[0],
)

const guestLink = computed(() => `https://sharim.app/guest/event/${ev.value.shareCode || '---'}`)

const demoVotingResults = [
  { id: 1, name: 'אור הירח', artistName: 'קיצבי', votes: 18 },
  { id: 2, name: 'מקום לדאגה', artistName: 'שקט', votes: 14 },
  { id: 3, name: 'dfvdfv', artistName: '—', votes: 8 },
  { id: 4, name: 'fgb', artistName: '—', votes: 2 },
]

const votingHeaders = [
  { title: '#', key: 'rank', sortable: false, width: 48, align: 'center' },
  { title: 'שם השיר', key: 'name', sortable: false },
  { title: 'אמן', key: 'artistName', sortable: false },
  { title: 'הצבעות', key: 'votes', sortable: false, width: 100, align: 'center' },
]

const demoFeedbackResults = [
  {
    id: 1,
    question: 'איך הייתה ההופעה?',
    type: 'stars',
    avgRating: 4.3,
    totalResponses: 23,
    distribution: [1, 2, 3, 8, 9],
  },
  {
    id: 2,
    question: 'מה השיר שהכי אהבת?',
    type: 'text',
    totalResponses: 18,
    responses: [
      'אור הירח בהחלט!',
      'מקום לדאגה — מושלם',
      'הכל היה מעולה',
      'השירים של קיצבי',
    ],
  },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function starsArray(count) {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(count))
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
  editEvent.value = ev.value && typeof ev.value === 'object' ? { ...ev.value } : null
  showUpsertEventDialog.value = true
}

function onCloseUpsertEventDialog() {
  showUpsertEventDialog.value = false
  editEvent.value = null
}

function onEventSaved() {
  editEvent.value = null
  showUpsertEventDialog.value = false
}

function setBroadcast(mode) {
  currentBroadcast.value = mode
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
      class="event-detail__nav-drawer"
    >
      <v-card class="navigation-card event-detail__nav-drawer-card" elevation="0" variant="flat">
        <v-list class="event-detail__nav-list py-2" density="comfortable" nav>
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
      <h2 class="event-detail__event-name text-h6 font-weight-bold mb-0">{{ ev.name }}</h2>
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

    <div class="content-wrapper">
      <!-- RTL (dir=rtl): aside first in row → physical right -->
      <aside class="event-detail__nav-menu d-none d-md-block">
        <v-card class="navigation-card event-detail__nav-card" elevation="0" variant="flat">
          <v-list class="event-detail__nav-list py-2" density="comfortable" nav>
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
        <v-card class="modern-card event-detail__content-card" elevation="0">
          <v-card-title class="modern-title event-detail__card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="event-detail__nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              />
              <h2 class="title-text">{{ pageTitle }}</h2>
              <v-spacer />
              <div v-if="activeSection === 'control'" class="event-detail__header-actions">
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
            <div v-if="activeSection === 'control'" class="tiles-container event-detail__panel-wrap">
              <div class="event-detail__panel-inner">
                <div class="event-detail__meta text-body-2 text-medium-emphasis mb-4">
                  <v-icon size="14" class="me-1">mdi-calendar</v-icon>
                  {{ formatDate(ev.date) }}
                  <span class="mx-2">·</span>
                  <v-icon size="14" class="me-1">mdi-playlist-music</v-icon>
                  {{ ev.playlistName || '—' }}
                </div>

                <div class="text-subtitle-2 text-medium-emphasis mb-2">
                  <v-icon size="16" class="me-1">mdi-link-variant</v-icon>
                  קישור האירוע (שתף עם הקהל)
                </div>
                <v-text-field
                  :model-value="guestLink"
                  readonly
                  density="compact"
                  hide-details
                  variant="outlined"
                  class="event-detail__link-input mb-2"
                >
                  <template #append-inner>
                    <v-btn
                      icon="mdi-content-copy"
                      variant="text"
                      size="small"
                      density="compact"
                      aria-label="העתק קישור"
                    />
                  </template>
                </v-text-field>
                <p class="text-caption text-medium-emphasis mb-4">
                  קישור זה ניתן מראש (למשל עם הכרטיס). הקהל יראה תוכן לפי מה שתבחר לשדר.
                </p>

                <v-divider class="mb-4" />

                <div class="text-subtitle-2 text-medium-emphasis mb-1">
                  <v-icon size="16" class="me-1">mdi-broadcast</v-icon>
                  מה הקהל רואה עכשיו
                </div>
                <div class="d-flex align-center ga-2 mb-3">
                  <v-chip
                    :color="activeBroadcastMeta.color"
                    :prepend-icon="activeBroadcastMeta.icon"
                    variant="flat"
                    size="small"
                  >
                    {{ activeBroadcastMeta.label }}
                  </v-chip>
                  <span class="text-body-2 text-medium-emphasis">{{ activeBroadcastMeta.description }}</span>
                </div>
                <div class="event-detail__broadcast-grid">
                  <v-btn
                    v-for="mode in broadcastModes"
                    :key="mode.value"
                    :variant="currentBroadcast === mode.value ? 'flat' : 'tonal'"
                    :color="currentBroadcast === mode.value ? mode.color : undefined"
                    :prepend-icon="mode.icon"
                    size="small"
                    class="text-none"
                    @click="setBroadcast(mode.value)"
                  >
                    {{ mode.label }}
                  </v-btn>
                </div>
              </div>
            </div>

            <div v-else-if="activeSection === 'voting'" class="tiles-container event-detail__panel-wrap">
              <div class="event-detail__panel-inner">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-body-2 text-medium-emphasis">
                    סה"כ {{ demoVotingResults.reduce((s, r) => s + r.votes, 0) }} הצבעות
                  </span>
                  <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary">רענן</v-btn>
                </div>
                <div v-if="!demoVotingResults.length" class="text-body-2 text-medium-emphasis text-center pa-6">
                  עדיין אין הצבעות.
                </div>
                <v-data-table
                  v-else
                  class="modern-table"
                  :headers="votingHeaders"
                  :items="demoVotingResults.map((s, i) => ({ ...s, rank: i + 1 }))"
                  :items-per-page="-1"
                  density="compact"
                  hide-default-footer
                >
                  <template #item.rank="{ item }">
                    <span class="tabular-nums text-medium-emphasis">{{ item.rank }}</span>
                  </template>
                  <template #item.name="{ item }">
                    <span class="font-weight-medium">{{ item.name }}</span>
                  </template>
                  <template #item.votes="{ item }">
                    <v-chip size="small" color="info" variant="tonal" class="tabular-nums">
                      {{ item.votes }}
                    </v-chip>
                  </template>
                </v-data-table>
              </div>
            </div>

            <div v-else-if="activeSection === 'feedback'" class="tiles-container event-detail__panel-wrap">
              <div class="event-detail__panel-inner">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-body-2 text-medium-emphasis">תוצאות משוב</span>
                  <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary">רענן</v-btn>
                </div>
                <div v-if="!demoFeedbackResults.length" class="text-body-2 text-medium-emphasis text-center pa-6">
                  עדיין אין תגובות משוב.
                </div>
                <div v-else class="event-detail__feedback-list">
                  <v-card
                    v-for="fb in demoFeedbackResults"
                    :key="fb.id"
                    variant="tonal"
                    class="event-detail__feedback-item pa-4 mb-3"
                  >
                    <div class="text-subtitle-2 font-weight-medium mb-2">{{ fb.question }}</div>
                    <div class="text-caption text-medium-emphasis mb-2">{{ fb.totalResponses }} תגובות</div>

                    <template v-if="fb.type === 'stars'">
                      <div class="event-detail__stars-result">
                        <div class="event-detail__stars-avg">
                          <span class="text-h5 font-weight-bold">{{ fb.avgRating.toFixed(1) }}</span>
                          <div class="event-detail__stars-icons">
                            <v-icon
                              v-for="(filled, i) in starsArray(fb.avgRating)"
                              :key="i"
                              size="18"
                              :color="filled ? 'amber' : 'grey-lighten-2'"
                            >
                              {{ filled ? 'mdi-star' : 'mdi-star-outline' }}
                            </v-icon>
                          </div>
                        </div>
                        <div class="event-detail__stars-bars">
                          <div v-for="star in 5" :key="star" class="event-detail__star-bar-row">
                            <span class="text-caption tabular-nums">{{ star }}</span>
                            <v-progress-linear
                              :model-value="fb.totalResponses ? (fb.distribution[star - 1] / fb.totalResponses) * 100 : 0"
                              color="amber"
                              bg-color="grey-lighten-3"
                              height="8"
                              rounded
                              class="event-detail__star-bar"
                            />
                            <span class="text-caption tabular-nums event-detail__star-count">{{ fb.distribution[star - 1] }}</span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <template v-if="fb.type === 'text'">
                      <v-list density="compact" class="py-0 bg-transparent">
                        <v-list-item
                          v-for="(resp, ri) in fb.responses"
                          :key="ri"
                          class="px-0"
                        >
                          <v-list-item-title class="text-body-2 text-wrap">
                            <v-icon size="14" color="grey" class="me-1">mdi-format-quote-open</v-icon>
                            {{ resp }}
                          </v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </template>
                  </v-card>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showUpsertEventDialog" max-width="720" width="92%" persistent>
      <UpsertEvent
        v-if="showUpsertEventDialog"
        :show-dialog="showUpsertEventDialog"
        :edit-event="editEvent"
        @close-dialog="onCloseUpsertEventDialog"
        @saved="onEventSaved"
      />
    </v-dialog>
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

.content-wrapper {
  display: flex;
  position: relative;
  width: 100%;
  min-width: 0;
  gap: 16px;
  min-height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
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

.event-detail__nav-menu {
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

.event-detail__nav-list :deep(.v-list-item) {
  justify-content: flex-start;
}

.event-detail__content-card {
  min-height: 100%;
}

.event-detail__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.event-detail__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.event-detail__nav-open {
  flex-shrink: 0;
}

.event-detail__header-actions {
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

.event-detail__panel-wrap {
  width: 100%;
  min-width: 0;
}

.event-detail__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}

.event-detail__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.event-detail__broadcast-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-detail__stars-result {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.event-detail__stars-avg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
}

.event-detail__stars-icons {
  display: flex;
  gap: 2px;
}

.event-detail__stars-bars {
  flex: 1;
  min-width: 140px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-detail__star-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-detail__star-bar {
  flex: 1;
}

.event-detail__star-count {
  min-width: 20px;
  text-align: end;
}

.event-detail__nav-drawer-card {
  height: 100%;
  border-radius: 0;
  border: none;
}

.event-detail__nav-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
</style>
