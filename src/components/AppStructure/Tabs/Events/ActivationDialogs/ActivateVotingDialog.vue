<script setup>
import { computed, ref, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { useUserStore } from '@/stores/UserStore'
import { songRowForTable } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'
import {
  activateVotingFormDefaults,
  applyVotingTextPlaceholders,
  broadcastModeFromSharingParams,
  buildVotingSharingParams,
  parseSharingParams,
  playlistDisplayName,
  guestVoteSessionIdFromSharingParams,
  votingCopyFromSharingParams,
} from '@/utils/eventSharingModel.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Used to resolve `{eventName}` in welcome title preview and defaults. */
  eventName: { type: String, default: 'אירוע' },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const eventStore = useEventStore()

const selectedPlaylistKey = ref(null)
const maxSelections = ref(7)
const guestStepTab = ref('welcome')
const resetGuestVoteSession = ref(false)
const guestVoteSessionId = ref('')

const welcomeTitle = ref('')
const welcomeBody = ref('')
const welcomeContinueButton = ref('')
const voteTitle = ref('')
const voteBody = ref('')
const introQuestion = ref('')
const introContinueButton = ref('')
const introDeclineButton = ref('')
const ballotHint = ref('')
const submitVoteButton = ref('')
const emptyPlaylistMessage = ref('')
const submitVoteFailedMessage = ref('')
const thankYouTitle = ref('')
const thankYouBody = ref('')
const declinedTitle = ref('')
const declinedBody = ref('')
const declinedBackButton = ref('')

const resolvedEventName = computed(
  () => String(props.eventName || '').trim() || 'אירוע',
)

function applyCopyToForm(source) {
  welcomeTitle.value = source.welcomeTitle
  welcomeBody.value = source.welcomeBody
  welcomeContinueButton.value = source.welcomeContinueButton
  voteTitle.value = source.title
  voteBody.value = source.body
  introQuestion.value = source.introQuestion
  introContinueButton.value = source.introContinueButton
  introDeclineButton.value = source.introDeclineButton
  ballotHint.value = source.ballotHint
  submitVoteButton.value = source.submitVoteButton
  emptyPlaylistMessage.value = source.emptyPlaylistMessage
  submitVoteFailedMessage.value = source.submitVoteFailedMessage
  thankYouTitle.value = source.thankYouTitle
  thankYouBody.value = source.thankYouBody
  declinedTitle.value = source.declinedTitle
  declinedBody.value = source.declinedBody
  declinedBackButton.value = source.declinedBackButton
}

function resetTextFieldsFromDefaults() {
  applyCopyToForm(activateVotingFormDefaults(resolvedEventName.value))
}

function loadTextFieldsFromSharingParams(sharingParams) {
  const copy = (key) => votingCopyFromSharingParams(sharingParams, key)
  applyCopyToForm({
    welcomeTitle: copy('welcomeTitle'),
    welcomeBody: copy('welcomeBody'),
    welcomeContinueButton: copy('welcomeContinueButton'),
    title: copy('title'),
    body: copy('body'),
    introQuestion: copy('introQuestion'),
    introContinueButton: copy('introContinueButton'),
    introDeclineButton: copy('introDeclineButton'),
    ballotHint: copy('ballotHint'),
    submitVoteButton: copy('submitVoteButton'),
    emptyPlaylistMessage: copy('emptyPlaylistMessage'),
    submitVoteFailedMessage: copy('submitVoteFailedMessage'),
    thankYouTitle: copy('thankYouTitle'),
    thankYouBody: copy('thankYouBody'),
    declinedTitle: copy('declinedTitle'),
    declinedBody: copy('declinedBody'),
    declinedBackButton: copy('declinedBackButton'),
  })
  const max = Number(sharingParams.maxSelections ?? sharingParams.MaxSelections)
  if (Number.isFinite(max) && max >= 1) {
    maxSelections.value = Math.min(99, Math.floor(max))
  }
  const plName = String(sharingParams.playlistName ?? sharingParams.PlaylistName ?? '').trim()
  if (plName && playlists.value.length) {
    const idx = playlists.value.findIndex((p) => playlistDisplayName(p) === plName)
    if (idx >= 0) {
      selectedPlaylistKey.value = playlistStableKey(playlists.value[idx], idx)
    }
  }
  guestVoteSessionId.value = guestVoteSessionIdFromSharingParams(sharingParams)
}

function initFormOnOpen() {
  resetGuestVoteSession.value = false
  const sp = parseSharingParams(eventStore.selectedEvent?.sharingParams)
  if (sp && broadcastModeFromSharingParams(sp) === 'voting') {
    loadTextFieldsFromSharingParams(sp)
  } else {
    resetTextFieldsFromDefaults()
    guestVoteSessionId.value = ''
  }
}

const submitVotePreviewLabel = computed(() =>
  applyVotingTextPlaceholders(submitVoteButton.value, { count: 2 }),
)

const welcomeTitlePreview = computed(() =>
  applyVotingTextPlaceholders(welcomeTitle.value, {
    eventName: resolvedEventName.value,
  }),
)

const guestStepTabs = [
  { value: 'welcome', title: 'ברוכים הבאים', icon: 'mdi-hand-wave' },
  { value: 'intro', title: 'הזמנה להצבעה', icon: 'mdi-vote-outline' },
  { value: 'ballot', title: 'בחירת שירים', icon: 'mdi-format-list-checks' },
  { value: 'endings', title: 'סיום', icon: 'mdi-flag-checkered' },
]

const playlists = computed(() => {
  const raw = userStore.user?.playLists
  return Array.isArray(raw) ? raw : []
})

function playlistStableKey(playlist, index) {
  const id = playlist?.id ?? playlist?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

const playlistOptions = computed(() =>
  playlists.value.map((pl, index) => ({
    title: playlistDisplayName(pl) || '(ללא שם)',
    value: playlistStableKey(pl, index),
  })),
)

const selectedPlaylist = computed(() => {
  if (selectedPlaylistKey.value == null) return null
  const idx = playlists.value.findIndex(
    (p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value),
  )
  return idx >= 0 ? playlists.value[idx] : null
})

const categories = computed(() =>
  Array.isArray(userStore.user?.categories) ? userStore.user.categories : [],
)

const artists = computed(() =>
  Array.isArray(userStore.user?.artists) ? userStore.user.artists : [],
)

const ballotHintPreview = computed(() =>
  String(ballotHint.value ?? '')
    .trim()
    .replace(/\{max\}/g, String(maxSelections.value || 1)),
)

function firstDefinedString(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    if (!(k in obj)) continue
    const v = obj[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function displaySongName(row) {
  const n = firstDefinedString(row, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  return n || '(ללא שם)'
}

function rawSongsList() {
  return Array.isArray(userStore.songs) ? userStore.songs : []
}

function resolveSongEntry(entry) {
  if (entry == null) return null
  if (typeof entry === 'object' && (entry.id != null || entry.Id != null)) {
    const idStr = String(entry.id ?? entry.Id).trim()
    const fromStore = rawSongsList().find((s) => String(s.id ?? s.Id ?? '').trim() === idStr)
    return fromStore ?? entry
  }
  if (typeof entry === 'number' || (typeof entry === 'string' && /^\d+$/.test(String(entry).trim()))) {
    const idStr = String(entry).trim()
    return rawSongsList().find((s) => String(s.id ?? s.Id ?? '').trim() === idStr) ?? null
  }
  return typeof entry === 'object' ? entry : null
}

const previewSongs = computed(() => {
  const pl = selectedPlaylist.value
  if (!pl || typeof pl !== 'object') return []
  const raw = pl.songs ?? pl.Songs ?? pl.songList ?? pl.items ?? []
  if (!Array.isArray(raw)) return []
  return raw
    .map(resolveSongEntry)
    .filter(Boolean)
    .map((song, i) => {
      const row = songRowForTable(song, categories.value, artists.value)
      const id = song.id ?? song.Id ?? i
      return {
        id,
        name: displaySongName(row),
        artistName: String(row.artistName ?? '').trim() || '—',
      }
    })
})

async function ensureSongsLoaded() {
  if (rawSongsList().length > 0) return
  try {
    await userStore.fetchSongs()
  } catch {
    // errors surfaced in UserStore
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      guestStepTab.value = 'welcome'
      await ensureSongsLoaded()
      initFormOnOpen()
    }
  },
)

watch(
  playlists,
  (list) => {
    if (!list.length) {
      selectedPlaylistKey.value = null
      return
    }
    if (
      selectedPlaylistKey.value == null ||
      list.findIndex((p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value)) < 0
    ) {
      selectedPlaylistKey.value = playlistStableKey(list[0], 0)
    }
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

function votingPlaylistForSharing() {
  return previewSongs.value.map((song) => ({
    id: song.id,
    songName: song.name,
    artist: song.artistName === '—' ? '' : song.artistName,
  }))
}

function onActivate() {
  try {
    const pl = selectedPlaylist.value
    if (!pl) return
    const playlistName = playlistDisplayName(pl)
    const existingSessionId = String(guestVoteSessionId.value ?? '').trim()
    const nextGuestVoteSessionId = resetGuestVoteSession.value
      ? String(Date.now())
      : existingSessionId || playlistName

    const sharingParams = buildVotingSharingParams({
      playlistName,
      guestVoteSessionId: nextGuestVoteSessionId,
      maxSelections: maxSelections.value,
      title: voteTitle.value,
      body: voteBody.value,
      welcomeTitle: welcomeTitle.value,
      welcomeBody: welcomeBody.value,
      welcomeContinueButton: welcomeContinueButton.value,
      introQuestion: introQuestion.value,
      introContinueButton: introContinueButton.value,
      introDeclineButton: introDeclineButton.value,
      ballotHint: ballotHint.value,
      submitVoteButton: submitVoteButton.value,
      emptyPlaylistMessage: emptyPlaylistMessage.value,
      submitVoteFailedMessage: submitVoteFailedMessage.value,
      thankYouTitle: thankYouTitle.value,
      thankYouBody: thankYouBody.value,
      declinedTitle: declinedTitle.value,
      declinedBody: declinedBody.value,
      declinedBackButton: declinedBackButton.value,
      playlist: votingPlaylistForSharing(),
    })
    emit('activate', sharingParams)
    close()
  } catch (err) {
    alert(err?.message ?? String(err))
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="920"
    width="94%"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="activate-voting-dialog">
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-vote-outline" color="info" />
          הפעלת הצבעה — טקסטים לאורח
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          ערכו את הטקסטים לכל שלב שיוצג לאורח. בתצוגה המקדימה מימין תראו כיצד זה ייראה.
        </p>

        <v-tabs
          v-model="guestStepTab"
          color="info"
          density="comfortable"
          class="activate-voting-dialog__step-tabs mb-4"
        >
          <v-tab
            v-for="tab in guestStepTabs"
            :key="tab.value"
            :value="tab.value"
            :prepend-icon="tab.icon"
          >
            {{ tab.title }}
          </v-tab>
        </v-tabs>

        <v-window v-model="guestStepTab">
          <!-- Welcome -->
          <v-window-item value="welcome">
            <v-row class="activate-voting-dialog__step-row" dense>
              <v-col cols="12" md="6" class="activate-voting-dialog__fields">
                <v-text-field
                  v-model="welcomeTitle"
                  label="כותרת (ברוכים הבאים)"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-3"
                />
                <v-textarea
                  v-model="welcomeBody"
                  label="טקסט גוף"
                  density="comfortable"
                  hide-details="auto"
                  rows="3"
                  auto-grow
                  class="mb-2"
                />
                <div class="activate-voting-dialog__vote-again mt-1">
                  <v-checkbox
                    v-model="resetGuestVoteSession"
                    color="warning"
                    hide-details
                    density="comfortable"
                    label="אפשר לאורחים שהצביעו להצביע שוב"
                  />
                  <p class="text-caption text-medium-emphasis ms-8 mt-n2 mb-0">
                    מזהה סבב הצבעה חדש בדפדפן האורח — יש ללחוץ «הפעל» כדי שהשינוי יגיע לאורחים.
                    תוצאות ההצבעה הקודמות נשמרות במערכת.
                  </p>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה</div>
                <v-card variant="tonal" class="activate-voting-dialog__preview-guest pa-6 text-center">
                  <v-icon size="40" color="info" class="mb-3">mdi-hand-wave</v-icon>
                  <div class="text-subtitle-1 font-weight-bold mb-2">{{ welcomeTitlePreview }}</div>
                  <p class="text-body-2 text-medium-emphasis mb-4 guest-preview__body">
                    {{ welcomeBody }}
                  </p>
                  <v-btn color="info" size="small" disabled>
                    {{ welcomeContinueButton }}
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Intro -->
          <v-window-item value="intro">
            <v-row class="activate-voting-dialog__step-row" dense>
              <v-col cols="12" md="6" class="activate-voting-dialog__fields">
                <v-text-field
                  v-model="voteTitle"
                  label="כותרת"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-3"
                />
                <v-textarea
                  v-model="voteBody"
                  label="טקסט גוף"
                  density="comfortable"
                  hide-details="auto"
                  rows="3"
                  auto-grow
                  class="mb-3"
                />
                <v-text-field
                  v-model="introQuestion"
                  label="שאלה לפני הכפתורים"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה</div>
                <v-card variant="tonal" class="activate-voting-dialog__preview-guest pa-6 text-center">
                  <div class="text-subtitle-1 font-weight-medium mb-2">{{ voteTitle }}</div>
                  <p class="text-body-2 text-medium-emphasis mb-3 guest-preview__body">{{ voteBody }}</p>
                  <p class="text-body-2 text-medium-emphasis mb-4">{{ introQuestion }}</p>
                  <div class="d-flex flex-column ga-2 mx-auto" style="max-width: 240px">
                    <v-btn color="info" size="small" disabled block>
                      {{ introContinueButton }}
                    </v-btn>
                    <v-btn variant="outlined" size="small" disabled block>
                      {{ introDeclineButton }}
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Ballot -->
          <v-window-item value="ballot">
            <v-row class="activate-voting-dialog__step-row" dense>
              <v-col cols="12" md="6" class="activate-voting-dialog__fields">
                <div class="activate-voting-dialog__settings activate-voting-dialog__ballot-fields d-flex flex-column ga-3 mb-3">
                  <v-select
                    v-model="selectedPlaylistKey"
                    label="פלייליסט להצבעה"
                    :items="playlistOptions"
                    item-title="title"
                    item-value="value"
                    density="comfortable"
                    hide-details="auto"
                    :disabled="!playlistOptions.length"
                  />
                  <v-text-field
                    v-model.number="maxSelections"
                    label="מקסימום שירים לבחירה"
                    type="number"
                    min="1"
                    max="99"
                    density="comfortable"
                    hide-details="auto"
                  />
                </div>
                <p v-if="!playlistOptions.length" class="text-caption text-warning mb-0">
                  אין פלייליסטים — הוסף בלשונית פלייליסטים.
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה</div>
                <v-card variant="outlined" class="activate-voting-dialog__preview-guest pa-4">
                  <p class="text-body-2 text-medium-emphasis text-center mb-3">
                    {{ ballotHintPreview }}
                  </p>
                  <v-list density="compact" class="py-0 activate-voting-dialog__song-list">
                    <v-list-item
                      v-for="song in previewSongs"
                      :key="song.id"
                      class="activate-voting-dialog__list-item"
                    >
                      <template #prepend>
                        <v-checkbox-btn :model-value="false" color="info" density="compact" disabled />
                      </template>
                      <v-list-item-title class="text-body-2">
                        <span class="font-weight-medium">{{ song.name }}</span>
                        <span
                          v-if="song.artistName && song.artistName !== '—'"
                          class="text-medium-emphasis"
                        >
                          · {{ song.artistName }}
                        </span>
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                  <div class="text-center mt-2">
                    <v-btn color="info" size="small" disabled>{{ submitVotePreviewLabel }}</v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Endings -->
          <v-window-item value="endings">
            <v-row dense>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">אחרי הצבעה מוצלחת</div>
                <v-text-field
                  v-model="thankYouTitle"
                  label="כותרת"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-3"
                />
                <v-textarea
                  v-model="thankYouBody"
                  label="טקסט גוף"
                  density="comfortable"
                  hide-details="auto"
                  rows="2"
                  auto-grow
                  class="mb-4"
                />
                <v-card variant="tonal" color="success" class="pa-4 text-center">
                  <v-icon color="success" class="mb-2">mdi-check-circle-outline</v-icon>
                  <div class="text-subtitle-2 font-weight-bold mb-1">{{ thankYouTitle }}</div>
                  <p class="text-body-2 mb-0">{{ thankYouBody }}</p>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">לא מעוניין/ים</div>
                <v-text-field
                  v-model="declinedTitle"
                  label="כותרת"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-3"
                />
                <v-textarea
                  v-model="declinedBody"
                  label="טקסט גוף"
                  density="comfortable"
                  hide-details="auto"
                  rows="2"
                  auto-grow
                  class="mb-3"
                />
                <v-text-field
                  v-model="declinedBackButton"
                  label="טקסט כפתור חזרה"
                  density="comfortable"
                  hide-details="auto"
                  class="mb-4"
                />
                <v-card variant="tonal" class="pa-4 text-center">
                  <v-icon color="grey" class="mb-2">mdi-hand-wave-outline</v-icon>
                  <div class="text-subtitle-2 font-weight-medium mb-1">{{ declinedTitle }}</div>
                  <p class="text-body-2 text-medium-emphasis mb-2">{{ declinedBody }}</p>
                  <v-btn variant="text" size="small" color="info" disabled>
                    {{ declinedBackButton }}
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>

        <div class="popup-btn-row mt-6">
          <v-btn color="info" :disabled="!selectedPlaylist" @click="onActivate">הפעל</v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.activate-voting-dialog__step-tabs {
  border-bottom: 1px solid #fff;
  padding-bottom: 7px;
}

.activate-voting-dialog__settings {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.25);
}

.activate-voting-dialog__vote-again {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-warning), 0.35);
  background: rgba(var(--v-theme-warning), 0.08);
}

.activate-voting-dialog__step-row {
  align-items: flex-start;
}

.activate-voting-dialog__fields {
  display: flex;
  flex-direction: column;
}

.activate-voting-dialog__preview-guest {
  border-radius: 12px;
  min-height: 12rem;
}

.guest-preview__body {
  white-space: pre-wrap;
}

.activate-voting-dialog__song-list {
  max-height: 14rem;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.activate-voting-dialog__list-item {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  min-height: 2.75rem;
}

.activate-voting-dialog__list-item:last-child {
  border-bottom: none;
}
</style>
