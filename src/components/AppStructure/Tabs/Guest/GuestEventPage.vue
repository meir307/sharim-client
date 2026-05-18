<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { EVENT_BROADCAST_MODES, DEFAULT_BROADCAST_MODE } from '../Events/eventBroadcastModes.js'
import { broadcastModeFromSharingParams } from '@/utils/eventSharingModel.js'
import { useEventStore } from '@/stores/eventStore'

const route = useRoute()
const eventStore = useEventStore()

const showDemoBar = import.meta.env.DEV

const loading = ref(true)
const loadError = ref('')
const eventName = ref('')

const activeMode = ref(DEFAULT_BROADCAST_MODE)

const landingTitle = ref('המופע יתחיל בקרוב')
const landingBody = ref('השארו בדף זה — התוכן יתעדכן אוטומטית.')
const landingIcon = ref('mdi-clock-outline')
const landingShowSpinner = ref(true)

const voteTitle = ref('בחרו את השירים האהובים עליכם')
const maxSelections = ref(3)
const hasVoted = ref(false)
const voteSubmitting = ref(false)
const voteSongs = ref([])

const lyricsSongTitle = ref('')

const feedbackTitle = ref('')
const hasSubmittedFeedback = ref(false)
const feedbackSubmitting = ref(false)
const feedbackQuestions = ref([])

const selectedVoteCount = computed(() => voteSongs.value.filter((s) => s.checked).length)

function resolveSharingCode() {
  const fromQuery = route.query.ev ?? route.query.sharingCode ?? route.query.shareCode
  const q = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery
  if (q != null && String(q).trim() !== '') return String(q).trim()
  const p = route.params.shareCode
  if (p != null && String(p).trim() !== '') return String(p).trim()
  return ''
}

function voteStorageKey(code) {
  return `sharim.guestVoted.${code}`
}

function applySharingParams(sp) {
  if (!sp || typeof sp !== 'object') {
    activeMode.value = DEFAULT_BROADCAST_MODE
    return
  }

  activeMode.value = broadcastModeFromSharingParams(sp)

  if (activeMode.value === 'landing') {
    const title = String(sp.title ?? '').trim()
    const body = String(sp.body ?? '').trim()
    if (title) landingTitle.value = title
    if (body) landingBody.value = body
    landingIcon.value =
      String(sp.icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline'
    landingShowSpinner.value = Boolean(sp.showSpinner)
  }

  if (activeMode.value === 'voting') {
    const title = String(sp.title ?? '').trim()
    if (title) voteTitle.value = title
    maxSelections.value = Math.max(1, Math.min(99, Number(sp.maxSelections) || 3))
    const pl = Array.isArray(sp.playlist) ? sp.playlist : []
    voteSongs.value = pl.map((entry, i) => ({
      id: entry?.id ?? i,
      name:
        String(entry?.songName ?? entry?.name ?? '').trim() || `שיר ${i + 1}`,
      artistName:
        String(entry?.artist ?? entry?.artistName ?? '').trim() || '—',
      checked: false,
    }))
    const code = resolveSharingCode()
    if (code && typeof window !== 'undefined') {
      hasVoted.value = window.localStorage.getItem(voteStorageKey(code)) === '1'
    }
  }

  if (activeMode.value === 'lyrics') {
    const name = String(sp.playlistName ?? '').trim()
    if (name) lyricsSongTitle.value = name
  }

  if (activeMode.value === 'feedback') {
    feedbackTitle.value = String(sp.title ?? '').trim()
    const qs = Array.isArray(sp.questions) ? sp.questions : []
    feedbackQuestions.value = qs.map((q, i) => ({
      id: q?.id ?? i,
      text: String(q?.text ?? '').trim(),
      type: q?.type === 'text' ? 'text' : 'stars',
      answer: q?.type === 'text' ? '' : 0,
    }))
  }
}

async function loadGuestEvent() {
  const code = resolveSharingCode()
  if (!code) {
    loadError.value = 'חסר קוד שיתוף בקישור'
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const event = await eventStore.fetchGuestEventBySharingCode(code)
    eventName.value = String(event?.name ?? '').trim() || 'אירוע'
    applySharingParams(event?.sharingParams)
  } catch (err) {
    loadError.value = String(err?.message ?? 'לא ניתן לטעון את האירוע')
  } finally {
    loading.value = false
  }
}

function toggleSongChecked(song) {
  if (hasVoted.value) return
  if (song.checked) {
    song.checked = false
    return
  }
  if (selectedVoteCount.value >= maxSelections.value) return
  song.checked = true
}

function submitVote() {
  if (selectedVoteCount.value === 0) return
  voteSubmitting.value = true
  const code = resolveSharingCode()
  setTimeout(() => {
    voteSubmitting.value = false
    hasVoted.value = true
    if (code && typeof window !== 'undefined') {
      window.localStorage.setItem(voteStorageKey(code), '1')
    }
  }, 400)
}

function setStarRating(question, rating) {
  question.answer = rating
}

function submitFeedback() {
  feedbackSubmitting.value = true
  setTimeout(() => {
    feedbackSubmitting.value = false
    hasSubmittedFeedback.value = true
  }, 400)
}

const demoModes = EVENT_BROADCAST_MODES.map((m) => ({ value: m.value, label: m.label }))

onMounted(() => {
  loadGuestEvent()
})

watch(
  () => [route.query.ev, route.params.shareCode],
  () => {
    loadGuestEvent()
  },
)
</script>

<template>
  <div class="guest-event">
    <div class="guest-event__container">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <v-alert v-else-if="loadError" type="warning" variant="tonal" class="mb-4 text-start">
        {{ loadError }}
      </v-alert>

      <template v-else>
        <v-card
          v-if="showDemoBar"
          variant="tonal"
          color="grey"
          class="guest-event__demo-bar pa-2 mb-4"
        >
          <div class="text-caption text-center mb-1 font-weight-medium">
            דמו — מצב תצוגה (פיתוח בלבד)
          </div>
          <div class="d-flex justify-center flex-wrap ga-1">
            <v-btn
              v-for="m in demoModes"
              :key="m.value"
              :variant="activeMode === m.value ? 'flat' : 'outlined'"
              :color="activeMode === m.value ? 'primary' : undefined"
              size="x-small"
              @click="activeMode = m.value"
            >
              {{ m.label }}
            </v-btn>
          </div>
        </v-card>

        <div class="guest-event__header text-center">
          <v-icon size="36" color="primary" class="mb-2">mdi-music-note-eighth</v-icon>
          <h1 class="text-h5 font-weight-bold mb-1">{{ eventName }}</h1>
        </div>

        <div v-if="activeMode === 'landing'" class="guest-event__section text-center mt-8">
          <v-icon size="64" color="primary" class="mb-4">{{ landingIcon }}</v-icon>
          <h2 class="text-h6 font-weight-medium mb-2">{{ landingTitle }}</h2>
          <p class="text-body-2 text-medium-emphasis guest-event__landing-body">{{ landingBody }}</p>
          <v-progress-linear
            v-if="landingShowSpinner"
            indeterminate
            color="primary"
            class="mt-6 mx-auto"
            style="max-width: 200px"
          />
        </div>

        <div v-else-if="activeMode === 'voting'" class="guest-event__section mt-4">
          <v-card
            v-if="hasVoted"
            variant="tonal"
            color="success"
            class="guest-event__result-card text-center pa-8"
          >
            <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
            <h2 class="text-h6 font-weight-bold mb-2">תודה על ההצבעה!</h2>
            <p class="text-body-2">ההצבעה שלך נשמרה. נתראה באירוע!</p>
          </v-card>

          <template v-else-if="voteSongs.length">
            <p class="text-body-1 font-weight-medium text-center mb-2">{{ voteTitle }}</p>
            <p class="text-body-2 text-medium-emphasis text-center mb-4">
              סמנו עד {{ maxSelections }} שירים
            </p>

            <v-card variant="outlined" class="guest-event__list-card">
              <v-list density="comfortable" class="py-0">
                <v-list-item
                  v-for="song in voteSongs"
                  :key="song.id"
                  class="guest-event__list-item"
                  @click="toggleSongChecked(song)"
                >
                  <template #prepend>
                    <v-checkbox-btn
                      v-model="song.checked"
                      color="primary"
                      density="compact"
                      :disabled="
                        !song.checked && selectedVoteCount >= maxSelections
                      "
                      @click.stop
                    />
                  </template>
                  <v-list-item-title
                    class="text-body-2 guest-event__song-line"
                    :class="song.checked ? 'font-weight-medium' : ''"
                  >
                    <span>{{ song.name }}</span>
                    <span
                      v-if="song.artistName && song.artistName !== '—'"
                      class="text-medium-emphasis"
                    >
                      · {{ song.artistName }}
                    </span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>

            <div class="text-center mt-4">
              <v-btn
                color="primary"
                size="large"
                :loading="voteSubmitting"
                :disabled="selectedVoteCount === 0"
                prepend-icon="mdi-send"
                @click="submitVote"
              >
                שלח הצבעה ({{ selectedVoteCount }} שירים)
              </v-btn>
            </div>
          </template>

          <p v-else class="text-body-2 text-medium-emphasis text-center mt-6">
            אין שירים להצבעה כרגע.
          </p>
        </div>

        <div v-else-if="activeMode === 'lyrics'" class="guest-event__section mt-4">
          <div class="text-center mb-4">
            <v-chip color="success" variant="tonal" prepend-icon="mdi-broadcast" size="small">
              שידור חי
            </v-chip>
            <h2 v-if="lyricsSongTitle" class="text-subtitle-1 font-weight-medium mt-2">
              {{ lyricsSongTitle }}
            </h2>
          </div>
          <v-card variant="outlined" class="guest-event__lyrics-card">
            <div class="guest-event__lyrics-placeholder text-center pa-12">
              <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-text-box-outline</v-icon>
              <p class="text-body-2 text-medium-emphasis">
                כאן יוצגו מילות השיר
              </p>
            </div>
          </v-card>
        </div>

        <div v-else-if="activeMode === 'feedback'" class="guest-event__section mt-4">
          <v-card
            v-if="hasSubmittedFeedback"
            variant="tonal"
            color="success"
            class="guest-event__result-card text-center pa-8"
          >
            <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
            <h2 class="text-h6 font-weight-bold mb-2">תודה על המשוב!</h2>
            <p class="text-body-2">התגובה שלך נשמרה. תודה שהשתתפת!</p>
          </v-card>

          <template v-else-if="feedbackQuestions.length">
            <p v-if="feedbackTitle" class="text-body-1 font-weight-medium text-center mb-4">
              {{ feedbackTitle }}
            </p>
            <p v-else class="text-body-2 text-medium-emphasis text-center mb-4">
              נשמח לשמוע מה חשבתם
            </p>

            <div class="guest-event__questions">
              <v-card
                v-for="(q, index) in feedbackQuestions"
                :key="q.id"
                variant="outlined"
                class="guest-event__question-card pa-4 mb-4"
              >
                <div class="text-subtitle-2 font-weight-medium mb-3">
                  {{ index + 1 }}. {{ q.text }}
                </div>
                <div v-if="q.type === 'stars'" class="guest-event__stars-input">
                  <v-btn
                    v-for="star in 5"
                    :key="star"
                    :icon="star <= q.answer ? 'mdi-star' : 'mdi-star-outline'"
                    :color="star <= q.answer ? 'amber' : 'grey-lighten-1'"
                    variant="text"
                    size="large"
                    @click="setStarRating(q, star)"
                  />
                </div>
                <v-textarea
                  v-if="q.type === 'text'"
                  v-model="q.answer"
                  placeholder="הקלידו כאן..."
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  hide-details
                  auto-grow
                />
              </v-card>
            </div>

            <div class="text-center mt-2">
              <v-btn
                color="primary"
                size="large"
                :loading="feedbackSubmitting"
                prepend-icon="mdi-send"
                @click="submitFeedback"
              >
                שלח משוב
              </v-btn>
            </div>
          </template>

          <p v-else class="text-body-2 text-medium-emphasis text-center mt-6">
            אין שאלות משוב כרגע.
          </p>
        </div>

        <p v-else class="text-body-2 text-medium-emphasis text-center mt-8">
          ממתינים לתוכן מהמארח…
        </p>
      </template>
    </div>
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

.guest-event__demo-bar {
  border-radius: 8px;
}

.guest-event__header {
  padding-top: 8px;
}

.guest-event__landing-body {
  white-space: pre-wrap;
}

.guest-event__result-card {
  border-radius: 12px;
}

.guest-event__list-card {
  border-radius: 12px;
  overflow: hidden;
}

.guest-event__list-item {
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.guest-event__list-item + .guest-event__list-item {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}

.guest-event__song-line {
  white-space: normal;
  line-height: 1.4;
}

.guest-event__lyrics-card {
  border-radius: 12px;
  min-height: 300px;
}

.guest-event__lyrics-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.guest-event__question-card {
  border-radius: 12px;
}

.guest-event__stars-input {
  display: flex;
  justify-content: center;
  gap: 4px;
  direction: ltr;
}
</style>
