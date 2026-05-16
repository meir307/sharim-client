<script setup>
import { computed, ref } from 'vue'
import { DEFAULT_BROADCAST_MODE, EVENT_BROADCAST_MODES } from './eventBroadcastModes.js'
import { formatHebrewDate } from '@/utils/formatHebrewDate'
import { buildGuestEventShareUrl } from '@/utils/shareGuestUrl'

const props = defineProps({
  event: { type: Object, default: null },
})

const broadcastModes = EVENT_BROADCAST_MODES

const currentBroadcast = ref(DEFAULT_BROADCAST_MODE)

const copySnackbar = ref(false)
const copySnackbarText = ref('')
const copySnackbarColor = ref('success')

const activeBroadcastMeta = computed(() =>
  broadcastModes.find((m) => m.value === currentBroadcast.value) || broadcastModes[0],
)

const guestLink = computed(() => buildGuestEventShareUrl(props.event?.shareCode))

async function copyGuestLink() {
  const url = guestLink.value
  if (!url) {
    copySnackbarText.value = 'אין קישור לשיתוף — הוסף קוד שיתוף לאירוע'
    copySnackbarColor.value = 'warning'
    copySnackbar.value = true
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    copySnackbarText.value = 'הקישור הועתק'
    copySnackbarColor.value = 'success'
    copySnackbar.value = true
  } catch {
    copySnackbarText.value = 'ההעתקה נכשלה'
    copySnackbarColor.value = 'error'
    copySnackbar.value = true
  }
}

function setBroadcast(mode) {
  currentBroadcast.value = mode
}
</script>

<template>
  <div class="tiles-container tab-panel-wrap">
    <div class="tab-panel-inner">
      <div class="event-detail-control__meta text-body-2 text-medium-emphasis mb-4">
        <v-icon size="14" class="me-1">mdi-calendar</v-icon>
        {{ formatHebrewDate(event?.date) }}
        <span class="mx-2">·</span>
        <v-icon size="14" class="me-1">mdi-playlist-music</v-icon>
        {{ event?.playlistName || '—' }}
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
        class="event-detail-control__link-input mb-2"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            size="small"
            density="compact"
            aria-label="העתק קישור"
            @click="copyGuestLink"
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
      <div class="event-detail-control__broadcast-grid">
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

  <v-snackbar v-model="copySnackbar" :color="copySnackbarColor" location="bottom" :timeout="3000">
    {{ copySnackbarText }}
  </v-snackbar>
</template>

<style scoped>
.event-detail-control__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.event-detail-control__broadcast-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
