<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGuestStore } from '@/stores/guestStore'
import { guestBroadcastModeChangeMessage } from '@/components/AppStructure/Tabs/Events/eventBroadcastModes.js'
import GuestLandingView from './GuestLandingView.vue'
import GuestVotingView from './GuestVotingView.vue'
import GuestLyricsView from './GuestLyricsView.vue'
import GuestFeedbackView from './GuestFeedbackView.vue'

const route = useRoute()
const guestStore = useGuestStore()

const modeComponents = {
  landing: GuestLandingView,
  voting: GuestVotingView,
  lyrics: GuestLyricsView,
  feedback: GuestFeedbackView,
}

const activeComponent = computed(() => modeComponents[guestStore.broadcastMode] ?? null)

const modeSnackbar = ref(false)
const modeSnackbarText = ref('')

function sharingCodeFromRoute() {
  const ev = route.query.ev
  const q = Array.isArray(ev) ? ev[0] : ev
  if (q != null && String(q).trim() !== '') return String(q).trim()
  const p = route.params.shareCode
  if (p != null && String(p).trim() !== '') return String(p).trim()
  return ''
}

async function load() {
  guestStore.stopBroadcastPolling()
  await guestStore.loadBySharingCode(sharingCodeFromRoute())
}

watch(
  () => guestStore.broadcastModeJustChanged,
  (changed) => {
    if (!changed) return
    modeSnackbarText.value = guestBroadcastModeChangeMessage(guestStore.broadcastMode)
    modeSnackbar.value = true
    guestStore.clearBroadcastModeJustChanged()
  },
)

onMounted(load)

onUnmounted(() => {
  guestStore.stopBroadcastPolling()
})

watch(() => [route.query.ev, route.params.shareCode], load)
</script>

<template>
  <div class="guest-event">
    <div class="guest-event__container">
      <v-progress-linear
        v-if="guestStore.loading"
        indeterminate
        color="primary"
        class="mb-4"
      />

      <v-alert
        v-else-if="guestStore.error"
        type="warning"
        variant="tonal"
        class="mb-4 text-start"
      >
        {{ guestStore.error }}
      </v-alert>

      <template v-else-if="guestStore.sharingParams">
        <div class="guest-event__header text-center">
          <v-icon size="36" color="primary" class="mb-2">mdi-music-note-eighth</v-icon>
          <h1 class="text-h5 font-weight-bold mb-1">{{ guestStore.eventName }}</h1>
        </div>

        <component
          :is="activeComponent"
          v-if="activeComponent"
          :sharing-params="guestStore.sharingParams"
          :sharing-code="guestStore.sharingCode"
        />

        <p v-else class="text-body-2 text-medium-emphasis text-center mt-8">
          מצב שידור לא מוכר.
        </p>
      </template>
    </div>

    <v-snackbar v-model="modeSnackbar" location="bottom" color="primary" :timeout="4000">
      {{ modeSnackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.guest-event {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.04) 0%, transparent 40%);
  padding: 24px 16px 48px;
}

.guest-event__container {
  width: 100%;
  max-width: 480px;
}

.guest-event__header {
  padding-top: 8px;
}
</style>
