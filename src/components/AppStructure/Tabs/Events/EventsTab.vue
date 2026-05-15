<script setup>
import { ref } from 'vue'
import EventsListMain from './EventsListMain.vue'
import UpsertEvent from './UpsertEvent.vue'
import EventDetail from './EventDetail.vue'

const showUpsertEventDialog = ref(false)
const editEvent = ref(null)
const viewEvent = ref(null)

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

function onEventSaved() {
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
            />
            <div v-else class="tiles-container tab-panel-wrap">
              <div class="tab-panel-inner">
                <EventsListMain
                  @edit-event="onEditEventFromList"
                  @view-event="onViewEvent"
                />
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
