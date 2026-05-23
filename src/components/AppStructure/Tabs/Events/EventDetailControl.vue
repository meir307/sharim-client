<script setup>
import { computed, ref, toValue, watch } from 'vue'
import { broadcastModeDescription, DEFAULT_BROADCAST_MODE, EVENT_BROADCAST_MODES } from './eventBroadcastModes.js'
import { formatHebrewDate } from '@/utils/formatHebrewDate'
import { buildGuestEventQueryUrl, buildGuestShareMessage } from '@/utils/shareGuestUrl'
import {
  broadcastModeFromSharingParams,
  currentBroadcastFromEvent,
  parseSharingParams,
} from '@/utils/eventSharingModel.js'
import {
  loadFeedbackSessionTitle,
  loadLandingPageName,
  loadVotingPlaylistName,
  saveFeedbackSessionTitle,
  saveLandingPageName,
  saveVotingPlaylistName,
} from '@/utils/eventBroadcastDisplayStorage.js'
import { extractEventSharingCode, useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/UserStore'
import DisplaySong from '@/components/AppStructure/Tabs/Songs/DisplaySong.vue'
import ActivateLandingDialog from './ActivationDialogs/ActivateLandingDialog.vue'
import ActivateVotingDialog from './ActivationDialogs/ActivateVotingDialog.vue'
import ActivateLyricsDialog from './ActivationDialogs/ActivateLyricsDialog.vue'
import ActivateFeedbackDialog from './ActivationDialogs/ActivateFeedbackDialog.vue'

const props = defineProps({
  event: { type: Object, default: null },
})

const eventStore = useEventStore()
const userStore = useUserStore()

const broadcastModes = EVENT_BROADCAST_MODES

const currentBroadcast = ref(DEFAULT_BROADCAST_MODE)

const copySnackbar = ref(false)
const copySnackbarText = ref('')
const copySnackbarColor = ref('success')

const propEvent = computed(() => toValue(props.event))

const resolvedEvent = computed(
  () => eventStore.selectedEvent ?? propEvent.value,
)

const sharingCode = computed(() => extractEventSharingCode(resolvedEvent.value))

const guestLink = computed(() => buildGuestEventQueryUrl(sharingCode.value))

const guestShareMessage = computed(() => buildGuestShareMessage(guestLink.value))

const guestLinkHint = computed(() =>
  sharingCode.value
    ? ''
    : 'קוד השיתוף יופיע לאחר יצירת האירוע או כשהשרת מחזיר sharingCode',
)

const crowdSizeLabel = computed(() => {
  const raw = resolvedEvent.value?.crowdSize ?? resolvedEvent.value?.CrowdSize
  if (raw == null || String(raw).trim() === '') return ''
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return ''
  return `משתתפים כ ${Math.floor(n)} אנשים`
})

const eventTitleForSharing = computed(() => {
  const e = resolvedEvent.value
  return String(e?.name ?? e?.Name ?? '').trim() || 'אירוע'
})

const activeBroadcastMeta = computed(() =>
  broadcastModes.find((m) => m.value === currentBroadcast.value) || broadcastModes[0],
)

const votingPlaylistName = ref('')
const landingPageName = ref('')
const feedbackSessionTitle = ref('')

function eventIdForStorage(event) {
  return event?.id ?? event?.Id ?? eventStore.selectedEventId ?? null
}

function syncBroadcastLabelsFromEvent(event) {
  const eventId = eventIdForStorage(event)
  const sp = parseSharingParams(event?.sharingParams ?? event?.SharingParams)

  const playlistFromParams = String(sp?.playlistName ?? '').trim()
  if (playlistFromParams && eventId != null) {
    saveVotingPlaylistName(eventId, playlistFromParams)
    votingPlaylistName.value = playlistFromParams
  } else {
    votingPlaylistName.value =
      eventId != null ? loadVotingPlaylistName(eventId) : ''
  }

  const landingFromParams = String(
    sp?.landingPageName ?? sp?.LandingPageName ?? '',
  ).trim()
  if (landingFromParams && eventId != null) {
    saveLandingPageName(eventId, landingFromParams)
    landingPageName.value = landingFromParams
  } else {
    landingPageName.value = eventId != null ? loadLandingPageName(eventId) : ''
  }

  const feedbackTitleFromParams = String(sp?.title ?? sp?.Title ?? '').trim()
  if (feedbackTitleFromParams && eventId != null) {
    saveFeedbackSessionTitle(eventId, feedbackTitleFromParams)
    feedbackSessionTitle.value = feedbackTitleFromParams
  } else {
    feedbackSessionTitle.value =
      eventId != null ? loadFeedbackSessionTitle(eventId) : ''
  }
}

const activeBroadcastDescription = computed(() =>
  broadcastModeDescription(currentBroadcast.value, {
    playlistName: currentBroadcast.value === 'voting' ? votingPlaylistName.value : '',
    landingPageName: currentBroadcast.value === 'landing' ? landingPageName.value : '',
    feedbackSessionTitle:
      currentBroadcast.value === 'feedback' ? feedbackSessionTitle.value : '',
  }),
)

watch(
  resolvedEvent,
  (ev) => {
    currentBroadcast.value = currentBroadcastFromEvent(ev)
    syncBroadcastLabelsFromEvent(ev)
  },
  { immediate: true },
)

async function copyGuestShareMessage() {
  const text = guestShareMessage.value
  if (!text) {
    copySnackbarText.value = 'אין קישור לשיתוף — חסר קוד שיתוף לאירוע'
    copySnackbarColor.value = 'warning'
    copySnackbar.value = true
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    copySnackbarText.value = 'ההודעה הועתקה'
    copySnackbarColor.value = 'success'
    copySnackbar.value = true
  } catch {
    copySnackbarText.value = 'ההעתקה נכשלה'
    copySnackbarColor.value = 'error'
    copySnackbar.value = true
  }
}

const showLandingDialog = ref(false)
const showVotingDialog = ref(false)
const showLyricsDialog = ref(false)
const showFeedbackDialog = ref(false)

const showDisplaySong = ref(false)
const displaySongPlaylist = ref(null)
const activating = ref(false)

function openActivationDialog(mode) {
  showLandingDialog.value = mode === 'landing'
  showVotingDialog.value = mode === 'voting'
  showLyricsDialog.value = mode === 'lyrics'
  showFeedbackDialog.value = mode === 'feedback'
}

async function ensureSongsLoaded() {
  const list = Array.isArray(userStore.songs) ? userStore.songs : []
  if (list.length > 0) return
  try {
    await userStore.fetchSongs()
  } catch {
    // errors surfaced in UserStore
  }
}

async function onSharingActivate(sharingParams) {
  activating.value = true
  try {
    const mode = String(sharingParams?.broadcastMode ?? sharingParams?.BroadcastMode ?? '').trim()
    const eventId = eventIdForStorage(resolvedEvent.value)
    let params = sharingParams
    if (
      (mode === 'voting' || mode === 'feedback') &&
      eventId != null &&
      String(eventId).trim() !== ''
    ) {
      params = { ...sharingParams, eventId }
    }
    const saved = await eventStore.updateBrodcast(params)
    currentBroadcast.value = broadcastModeFromSharingParams(saved)
    const savedMode = String(saved?.broadcastMode ?? '').trim()
    if (savedMode === 'voting') {
      const name = String(saved?.playlistName ?? params?.playlistName ?? '').trim()
      if (name && eventId != null) {
        saveVotingPlaylistName(eventId, name)
        votingPlaylistName.value = name
      }
    }
    if (savedMode === 'landing') {
      const name = String(
        saved?.landingPageName ?? params?.landingPageName ?? '',
      ).trim()
      if (name && eventId != null) {
        saveLandingPageName(eventId, name)
        landingPageName.value = name
      }
    }
    if (savedMode === 'feedback') {
      const sessionTitle = String(saved?.title ?? params?.title ?? '').trim()
      if (sessionTitle && eventId != null) {
        saveFeedbackSessionTitle(eventId, sessionTitle)
        feedbackSessionTitle.value = sessionTitle
      }
    }
    copySnackbarText.value = 'מצב השידור עודכן'
    copySnackbarColor.value = 'success'
    copySnackbar.value = true
  } catch {
    // alert from store
  } finally {
    activating.value = false
  }
}

async function onLyricsActivate({ playlist, sharingParams }) {
  activating.value = true
  try {
    const saved = await eventStore.updateBrodcast(sharingParams)
    currentBroadcast.value = broadcastModeFromSharingParams(saved)
    await ensureSongsLoaded()
    displaySongPlaylist.value = playlist && typeof playlist === 'object' ? { ...playlist } : null
    showDisplaySong.value = true
  } catch {
    // alert from store
  } finally {
    activating.value = false
  }
}

function onDisplaySongClosed() {
  displaySongPlaylist.value = null
}
</script>

<template>
  <div class="tiles-container tab-panel-wrap">
    <div class="tab-panel-inner">
      <div class="event-detail-control__meta text-body-2 text-medium-emphasis mb-4">
        <v-icon size="14" class="me-1">mdi-calendar</v-icon>
        {{ formatHebrewDate(resolvedEvent?.date) }}
        <template v-if="crowdSizeLabel">
          <span class="mx-2">·</span>
          <v-icon size="14" class="me-1">mdi-account-group</v-icon>
          {{ crowdSizeLabel }}
        </template>
        <span class="mx-2">·</span>
        {{ resolvedEvent?.description || '—' }}
      </div>

      <div class="text-subtitle-2 text-medium-emphasis mb-2">
        <v-icon size="16" class="me-1">mdi-link-variant</v-icon>
        קישור האירוע (שתף עם הקהל)
      </div>
      <v-textarea
        :model-value="guestShareMessage"
        readonly
        density="compact"
        hide-details="auto"
        variant="outlined"
        rows="6"
        auto-grow
        class="event-detail-control__share-message mb-1"
        :placeholder="guestLinkHint"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            size="small"
            density="compact"
            aria-label="העתק הודעה"
            :disabled="!guestShareMessage"
            @click="copyGuestShareMessage"
          />
        </template>
      </v-textarea>
     
      <p class="text-caption text-warning mb-4">
        {{ guestLinkHint }}
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
        <span class="text-body-2 text-medium-emphasis">{{ activeBroadcastDescription }}</span>
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
          :disabled="activating"
          @click="openActivationDialog(mode.value)"
        >
          {{ mode.label }}
        </v-btn>
      </div>
    </div>
  </div>

  <ActivateLandingDialog v-model="showLandingDialog" @activate="onSharingActivate" />
  <ActivateVotingDialog
    v-model="showVotingDialog"
    :event-name="eventTitleForSharing"
    @activate="onSharingActivate"
  />
  <ActivateLyricsDialog v-model="showLyricsDialog" @activate="onLyricsActivate" />
  <ActivateFeedbackDialog v-model="showFeedbackDialog" @activate="onSharingActivate" />

  <DisplaySong
    v-model="showDisplaySong"
    :playlist="displaySongPlaylist"
    link-url=""
    song-title=""
    :cords="null"
    @closed="onDisplaySongClosed"
  />

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

.event-detail-control__share-message :deep(textarea) {
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  unicode-bidi: plaintext;
}

.event-detail-control__broadcast-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
