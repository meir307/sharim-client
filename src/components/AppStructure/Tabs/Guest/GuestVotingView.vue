<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useGuestStore } from '@/stores/guestStore'
import {
  clearGuestVotedForSharingParams,
  hasGuestVotedForSharingParams,
  markGuestVotedForSharingParams,
} from '@/utils/guestSessionStorage.js'
import { SHOW_GUEST_SESSION_TEST_CONTROLS } from '@/utils/guestDevFlags.js'
import {
  applyVotingTextPlaceholders,
  votingCopyFromSharingParams,
  votingSessionFromSharingParams,
} from '@/utils/eventSharingModel.js'

const guestStore = useGuestStore()

const props = defineProps({
  sharingParams: { type: Object, required: true },
  sharingCode: { type: String, default: '' },
})

const emit = defineEmits(['ballot-step-active'])

/** @type {import('vue').Ref<'welcome' | 'intro' | 'voting'>} */
const step = ref('welcome')
const hasVoted = ref(false)
const declined = ref(false)
const submitting = ref(false)
const voteSongs = ref([])

const isBallotStep = computed(
  () => step.value === 'voting' && !hasVoted.value && !declined.value,
)

function copy(key) {
  return votingCopyFromSharingParams(props.sharingParams, key)
}

const eventName = computed(() => guestStore.eventName)

const welcomeTitle = computed(() =>
  applyVotingTextPlaceholders(copy('welcomeTitle'), {
    eventName: eventName.value,
  }),
)
const welcomeBody = computed(() => copy('welcomeBody'))
const title = computed(() => copy('title'))
const body = computed(() => copy('body'))
const introQuestion = computed(() => copy('introQuestion'))

const ballotHintText = computed(() =>
  applyVotingTextPlaceholders(copy('ballotHint'), {
    max: maxSelections.value,
  }),
)

const thankYouTitle = computed(() => copy('thankYouTitle'))
const thankYouBody = computed(() => copy('thankYouBody'))
const declinedTitle = computed(() => copy('declinedTitle'))
const declinedBody = computed(() => copy('declinedBody'))

const welcomeContinueButton = computed(() => copy('welcomeContinueButton'))
const introContinueButton = computed(() => copy('introContinueButton'))
const introDeclineButton = computed(() => copy('introDeclineButton'))
const declinedBackButton = computed(() => copy('declinedBackButton'))
const emptyPlaylistMessage = computed(() => copy('emptyPlaylistMessage'))

const submitVoteButtonLabel = computed(() =>
  applyVotingTextPlaceholders(copy('submitVoteButton'), {
    count: selectedCount.value,
  }),
)
const maxSelections = computed(() =>
  Math.max(1, Math.min(99, Number(props.sharingParams?.maxSelections) || 1)),
)
const selectedCount = computed(() => voteSongs.value.filter((s) => s.checked).length)

const votingSession = computed(() => votingSessionFromSharingParams(props.sharingParams))

function initSongs() {
  const pl = Array.isArray(props.sharingParams?.playlist) ? props.sharingParams.playlist : []
  voteSongs.value = pl.map((entry, i) => ({
    id: entry?.id ?? i,
    name:
      String(entry?.songName ?? entry?.name ?? '').trim() ||
      applyVotingTextPlaceholders(copy('songFallbackName'), {
        index: i + 1,
      }),
    artist: String(entry?.artist ?? entry?.artistName ?? '').trim(),
    checked: false,
  }))
}

function continueFromWelcome() {
  step.value = 'intro'
}

function continueToVoting() {
  step.value = 'voting'
}

function onNotInterested() {
  declined.value = true
}

function backToIntro() {
  declined.value = false
  step.value = 'intro'
}

function toggleSong(song) {
  if (hasVoted.value) return
  if (song.checked) {
    song.checked = false
    return
  }
  if (selectedCount.value >= maxSelections.value) return
  song.checked = true
}

async function submitVote() {
  if (selectedCount.value === 0 || hasVoted.value || submitting.value) return
  submitting.value = true
  try {
    const selections = voteSongs.value
      .filter((s) => s.checked)
      .map((s) => ({
        id: s.id,
        songName: s.name,
        artist: s.artist || undefined,
      }))
    await guestStore.guestVote(selections)
    hasVoted.value = true
    markGuestVotedForSharingParams(props.sharingParams)
  } catch (err) {
    const resData = err?.response?.data ?? {}
    const message = String(
      resData.message ??
        resData.errorMessage ??
        err?.message ??
        copy('submitVoteFailedMessage'),
    ).trim()
    alert(message)
  } finally {
    submitting.value = false
  }
}

function clearVoteSessionForTesting() {
  clearGuestVotedForSharingParams(props.sharingParams)
  hasVoted.value = false
  step.value = 'welcome'
  initSongs()
}

function applyVoteSessionState() {
  initSongs()
  declined.value = false
  if (hasGuestVotedForSharingParams(props.sharingParams)) {
    hasVoted.value = true
  } else {
    hasVoted.value = false
    step.value = 'welcome'
  }
}

watch(
  () => [
    votingSession.value.eventId,
    votingSession.value.playlistName,
    props.sharingParams?.playlist,
  ],
  applyVoteSessionState,
  { immediate: true, deep: false },
)

/** Pause live broadcast poll while guest is on the song ballot (not intro / thank-you). */
function syncBroadcastPollPause() {
  const pause = step.value === 'voting' && !hasVoted.value
  if (pause) {
    guestStore.pauseBroadcastPolling()
  } else {
    guestStore.resumeBroadcastPolling()
  }
}

watch([step, hasVoted], syncBroadcastPollPause, { immediate: true })

watch(
  isBallotStep,
  (active) => emit('ballot-step-active', active),
  { immediate: true },
)

onUnmounted(() => {
  guestStore.resumeBroadcastPolling()
  emit('ballot-step-active', false)
})
</script>

<template>
  <div
    class="guest-mode-view guest-mode-view--voting mt-4"
    :class="{ 'guest-mode-view--ballot-fill': isBallotStep }"
  >
    <v-card
      v-if="hasVoted"
      variant="tonal"
      color="success"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
      <h2 class="text-h6 font-weight-bold mb-2">{{ thankYouTitle }}</h2>
      <p class="text-body-2" :class="{ 'mb-4': SHOW_GUEST_SESSION_TEST_CONTROLS }">{{ thankYouBody }}</p>
      <v-btn
        v-if="SHOW_GUEST_SESSION_TEST_CONTROLS"
        variant="outlined"
        color="warning"
        size="small"
        @click="clearVoteSessionForTesting"
      >
        [בדיקה] נקה זיכרון הצבעה
      </v-btn>
    </v-card>

    <v-card
      v-else-if="declined"
      variant="tonal"
      color="grey"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="48" color="grey" class="mb-3">mdi-hand-wave-outline</v-icon>
      <h2 class="text-h6 font-weight-medium mb-2">{{ declinedTitle }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ declinedBody }}</p>
      <v-btn variant="text" color="primary" @click="backToIntro">
        {{ declinedBackButton }}
      </v-btn>
    </v-card>

    <div v-else-if="step === 'welcome'" class="guest-mode-view__intro text-center">
      <v-icon size="48" color="primary" class="mb-4">mdi-hand-wave</v-icon>
      <h2 class="text-h6 font-weight-bold mb-3">{{ welcomeTitle }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-6 guest-mode-view__body">
        {{ welcomeBody }}
      </p>
      <div class="guest-mode-view__intro-actions d-flex flex-column ga-3">
        <v-btn
          color="primary"
          size="large"
          block
          prepend-icon="mdi-arrow-left"
          @click="continueFromWelcome"
        >
          {{ welcomeContinueButton }}
        </v-btn>
      </div>
    </div>

    <div v-else-if="step === 'intro'" class="guest-mode-view__intro text-center">
      <h2 v-if="title" class="text-h6 font-weight-medium mb-3">{{ title }}</h2>
      <p
        v-if="body"
        class="text-body-2 text-medium-emphasis mb-4 guest-mode-view__body"
      >
        {{ body }}
      </p>
      <p class="text-body-2 text-medium-emphasis mb-6">
        {{ introQuestion }}
      </p>

      <div class="guest-mode-view__intro-actions d-flex flex-column ga-3">
        <v-btn
          color="primary"
          size="large"
          block
          prepend-icon="mdi-vote-outline"
          @click="continueToVoting"
        >
          {{ introContinueButton }}
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          block
          @click="onNotInterested"
        >
          {{ introDeclineButton }}
        </v-btn>
      </div>
    </div>

    <div v-else-if="step === 'voting'" class="guest-mode-view__ballot">
      <template v-if="voteSongs.length">
        <p class="guest-mode-view__ballot-hint text-body-2 text-medium-emphasis text-center mb-3">
          {{ ballotHintText }}
        </p>

        <v-card variant="outlined" class="guest-mode-view__list-card guest-mode-view__list-card--fill">
          <v-list density="comfortable" class="py-0 guest-mode-view__song-list">
            <v-list-item
              v-for="song in voteSongs"
              :key="song.id"
              class="guest-mode-view__list-item"
              @click="toggleSong(song)"
            >
              <template #prepend>
                <v-checkbox-btn
                  v-model="song.checked"
                  color="primary"
                  density="compact"
                  :disabled="!song.checked && selectedCount >= maxSelections"
                  @click.stop
                />
              </template>
              <v-list-item-title
                class="text-body-2 guest-mode-view__song-line"
                :class="{ 'font-weight-medium': song.checked }"
              >
                <span>{{ song.name }}</span>
                <span v-if="song.artist" class="text-medium-emphasis"> · {{ song.artist }}</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <div class="guest-mode-view__submit text-center pt-3">
          <v-btn
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="selectedCount === 0"
            prepend-icon="mdi-send"
            @click="submitVote"
          >
            {{ submitVoteButtonLabel }}
          </v-btn>
        </div>
      </template>

      <p v-else class="text-body-2 text-medium-emphasis text-center mt-6">
        {{ emptyPlaylistMessage }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.guest-mode-view--ballot-fill {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  margin-top: 0;
}

.guest-mode-view__ballot {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.guest-mode-view__ballot-hint,
.guest-mode-view__submit {
  flex-shrink: 0;
}

.guest-mode-view__list-card--fill {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.guest-mode-view--ballot-fill .guest-mode-view__song-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
}

.guest-mode-view__result-card {
  border-radius: 12px;
}

.guest-mode-view__intro {
  padding-top: 8px;
}

.guest-mode-view__intro-actions {
  max-width: 320px;
  margin-inline: auto;
}

.guest-mode-view__list-card {
  border-radius: 12px;
  overflow: hidden;
}

.guest-mode-view__song-list {
  max-height: 14rem;
  overflow-y: auto;
}

.guest-mode-view__list-item {
  cursor: pointer;
}

.guest-mode-view__list-item + .guest-mode-view__list-item {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}

.guest-mode-view__body {
  white-space: pre-wrap;
}

.guest-mode-view__song-line {
  white-space: normal;
  line-height: 1.4;
}
</style>
