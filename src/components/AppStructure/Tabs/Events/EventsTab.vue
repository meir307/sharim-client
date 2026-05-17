<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import EventsListMain from './EventsListMain.vue'
import UpsertEvent from './UpsertEvent.vue'
import EventDetail from './EventDetail.vue'
import { useEventStore } from '@/stores/eventStore'

const showUpsertEventDialog = ref(false)
const editEvent = ref(null)
const viewEvent = ref(null)

const eventStore = useEventStore()
const { events } = storeToRefs(eventStore)

onMounted(() => {
  eventStore.fetchEvents().catch(() => {
    // errors surfaced via EventStore (alert)
  })
})

const upsertEventKey = computed(() =>
  editEvent.value?.id != null ? String(editEvent.value.id) : 'new',
)

function onAddEvent() {
  editEvent.value = null
  showUpsertEventDialog.value = true
}

function onCloseUpsertEventDialog() {
  showUpsertEventDialog.value = false
  editEvent.value = null
}

function onDeleteEventFromList(_event) {
  // wire to API in a follow-up
}

function onEditEventFromList(event) {
  editEvent.value = event && typeof event === 'object' ? { ...event } : null
  showUpsertEventDialog.value = true
}

function onEditEventFromDetail(event) {
  onEditEventFromList(event)
}

async function onEventSaved(payload) {
  if (!payload || typeof payload !== 'object') return
  try {
    const saved =
      payload.id != null && payload.id !== ''
        ? await eventStore.updateEvent(payload)
        : await eventStore.createEvent(payload)

    if (viewEvent.value && String(viewEvent.value.id) === String(saved.id)) {
      viewEvent.value = { ...saved }
    }

    editEvent.value = null
    showUpsertEventDialog.value = false
  } catch {
    // errors surfaced via EventStore (alert)
  }
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
                  @view-event="onViewEvent"
                  @delete-event="onDeleteEventFromList"
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
