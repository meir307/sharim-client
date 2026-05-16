<script setup>
import { computed, ref } from 'vue'
import EventsListMain from './EventsListMain.vue'
import UpsertEvent from './UpsertEvent.vue'
import EventDetail from './EventDetail.vue'

const showUpsertEventDialog = ref(false)
const editEvent = ref(null)
const viewEvent = ref(null)

const events = ref([
  {
    id: 1,
    name: 'חתונה — שבת הקרובה',
    date: '2026-05-16',
    phase: 'voting',
    playlistName: 'פלייליסט חתונה',
    shareCode: '483291',
    totalVotes: 42,
    totalFeedback: 0,
  },
  {
    id: 2,
    name: 'בר מצווה — יוני',
    date: '2026-06-12',
    phase: 'draft',
    playlistName: 'פלייליסט בר מצווה',
    shareCode: '192847',
    totalVotes: 0,
    totalFeedback: 0,
  },
  {
    id: 3,
    name: 'אירוע חברה',
    date: '2026-04-20',
    phase: 'feedback',
    playlistName: 'מיקס חברה',
    shareCode: '556103',
    totalVotes: 87,
    totalFeedback: 23,
  },
])

const upsertEventKey = computed(() =>
  editEvent.value?.id != null ? String(editEvent.value.id) : 'new',
)

function nextEventId(list) {
  const ids = list
    .map((e) => Number(e.id))
    .filter((n) => !Number.isNaN(n) && n > 0)
  return ids.length ? Math.max(...ids) + 1 : 1
}

function onAddEvent() {
  editEvent.value = null
  showUpsertEventDialog.value = true
}

function onCloseUpsertEventDialog() {
  showUpsertEventDialog.value = false
  editEvent.value = null
}

function onEditEventFromList(event) {
  editEvent.value = event && typeof event === 'object' ? { ...event } : null
  showUpsertEventDialog.value = true
}

function onEditEventFromDetail(event) {
  onEditEventFromList(event)
}

function onEventSaved(payload) {
  if (!payload || typeof payload !== 'object') return
  const list = [...events.value]
  const idx =
    payload.id != null
      ? list.findIndex((e) => String(e.id) === String(payload.id))
      : -1

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload }
    if (viewEvent.value && String(viewEvent.value.id) === String(payload.id)) {
      viewEvent.value = { ...list[idx] }
    }
  } else {
    const id = payload.id ?? nextEventId(list)
    list.push({
      phase: 'draft',
      shareCode: String(100000 + id * 7919).slice(-6),
      totalVotes: 0,
      totalFeedback: 0,
      playlistName: '',
      ...payload,
      id,
    })
  }

  events.value = list
  editEvent.value = null
  showUpsertEventDialog.value = false
}

function onViewEvent(event) {
  viewEvent.value = event && typeof event === 'object' ? { ...event } : null
}

function onBackFromEventDetail() {
  viewEvent.value = null
}
</script>

<template>
  <div class="tab-page" :class="{ 'tab-page--detail': viewEvent }">
    <div class="content-wrapper">
      <div class="content-area" :class="{ 'content-area--visible': viewEvent }">
        <v-card
          class="modern-card tab-content-card"
          :class="{ 'tab-content-card--overflow-visible': viewEvent }"
          elevation="0"
        >
          <v-card-title v-if="!viewEvent" class="modern-title tab-card-title">
            <div class="title-container">
              <h2 class="title-text">אירועים</h2>
              <v-spacer />
              <div class="tab-header-actions">
                <v-btn color="primary" class="add-btn" prepend-icon="mdi-plus" @click="onAddEvent">
                  הוסף אירוע
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <EventDetail
              v-if="viewEvent"
              :event="viewEvent"
              @back="onBackFromEventDetail"
              @edit-event="onEditEventFromDetail"
            />
            <div v-else class="tiles-container tab-panel-wrap">
              <div class="tab-panel-inner">
                <EventsListMain
                  v-model="events"
                  @edit-event="onEditEventFromList"
                  @view-event="onViewEvent"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showUpsertEventDialog" scrollable max-width="720" width="92%" persistent>
      <UpsertEvent
        v-if="showUpsertEventDialog"
        :key="upsertEventKey"
        :edit-event="editEvent"
        @close-dialog="onCloseUpsertEventDialog"
        @saved="onEventSaved"
      />
    </v-dialog>
  </div>
</template>
