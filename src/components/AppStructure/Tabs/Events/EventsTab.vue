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
  <div class="events-tab" :class="{ 'events-tab--detail': viewEvent }">
    <div class="content-wrapper">
      <div class="content-area" :class="{ 'content-area--event-detail': viewEvent }">
        <v-card
          class="modern-card events-tab__content-card"
          :class="{ 'events-tab__content-card--detail': viewEvent }"
          elevation="0"
        >
          <v-card-title v-if="!viewEvent" class="modern-title events-tab__card-title">
            <div class="title-container">
              <h2 class="title-text">אירועים</h2>
              <v-spacer />
              <div class="events-tab__header-actions">
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
            <div v-else class="tiles-container events-tab__panel-wrap">
              <div class="events-tab__panel-inner">
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

<style scoped>
.events-tab {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .events-tab {
    margin-top: -24px;
    padding-inline: 16px;
    padding-top: 24px;
  }
}

.events-tab--detail {
  margin-top: -14px;
  padding-top: 10px;
}

@media (min-width: 600px) {
  .events-tab--detail {
    margin-top: -22px;
    padding-top: 10px;
  }
}

.events-tab--detail :deep(.event-detail__toolbar) {
  padding-top: 0;
  padding-bottom: 6px;
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

.content-area--event-detail {
  overflow: visible;
}

.events-tab__content-card {
  min-height: 100%;
}

.events-tab__content-card--detail {
  overflow: visible;
}

.events-tab__content-card--detail :deep(.v-card-text) {
  overflow: visible;
}

.events-tab__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.events-tab__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

.events-tab__header-actions {
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

.events-tab__panel-wrap {
  width: 100%;
  min-width: 0;
}

.events-tab__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}
</style>
