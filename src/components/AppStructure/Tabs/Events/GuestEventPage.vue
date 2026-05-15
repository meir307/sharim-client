<script setup>
import { ref } from 'vue'

const eventName = ref('חתונה — שבת הקרובה')

/**
 * The active mode is determined by the server based on what the performer chose to broadcast.
 * Possible values: 'waiting' | 'voting' | 'lyrics' | 'feedback' | 'closed'
 */
const activeMode = ref('voting')

/* ── Voting state (demo) ── */
const hasVoted = ref(false)
const voteSubmitting = ref(false)
const voteSongs = ref([
  { id: 1, name: 'אור הירח', artistName: 'קיצבי', checked: false },
  { id: 2, name: 'מקום לדאגה', artistName: 'שקט', checked: false },
  { id: 3, name: 'dfvdfv', artistName: '—', checked: false },
  { id: 4, name: 'fgb', artistName: '—', checked: false },
  { id: 5, name: 'fgbfgb', artistName: '—', checked: false },
  { id: 6, name: 'fgbfgbf', artistName: '—', checked: false },
  { id: 7, name: 'xcfvdfvdf', artistName: '—', checked: false },
])
const selectedVoteCount = () => voteSongs.value.filter((s) => s.checked).length

function submitVote() {
  voteSubmitting.value = true
  setTimeout(() => {
    voteSubmitting.value = false
    hasVoted.value = true
  }, 800)
}

/* ── Lyrics state (demo) ── */
const lyricsUrl = ref('')
const lyricsSongTitle = ref('אור הירח')

/* ── Feedback state (demo) ── */
const hasSubmittedFeedback = ref(false)
const feedbackSubmitting = ref(false)
const feedbackQuestions = ref([
  { id: 1, text: 'איך הייתה ההופעה?', type: 'stars', answer: 0 },
  { id: 2, text: 'מה השיר שהכי אהבת?', type: 'text', answer: '' },
])

function setStarRating(question, rating) {
  question.answer = rating
}

function submitFeedback() {
  feedbackSubmitting.value = true
  setTimeout(() => {
    feedbackSubmitting.value = false
    hasSubmittedFeedback.value = true
  }, 800)
}

/* ── Demo mode switcher (remove in production) ── */
const demoModes = [
  { value: 'waiting', label: 'ממתין' },
  { value: 'voting', label: 'הצבעה' },
  { value: 'lyrics', label: 'מילים' },
  { value: 'feedback', label: 'משוב' },
  { value: 'closed', label: 'הסתיים' },
]
</script>

<template>
  <div class="guest-event">
    <div class="guest-event__container">

      <!-- Demo mode switcher — remove in production -->
      <v-card variant="tonal" color="grey" class="guest-event__demo-bar pa-2 mb-4">
        <div class="text-caption text-center mb-1 font-weight-medium">דמו — מצב תצוגה (לא יוצג בפרודקשן)</div>
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

      <!-- Header — always visible -->
      <div class="guest-event__header text-center">
        <v-icon size="36" color="primary" class="mb-2">mdi-music-note-eighth</v-icon>
        <h1 class="text-h5 font-weight-bold mb-1">{{ eventName }}</h1>
      </div>

      <!-- ═══════ WAITING ═══════ -->
      <div v-if="activeMode === 'waiting'" class="guest-event__section text-center mt-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clock-outline</v-icon>
        <h2 class="text-h6 text-medium-emphasis mb-2">האירוע עוד לא התחיל</h2>
        <p class="text-body-2 text-medium-emphasis">השארו בדף זה — התוכן יתעדכן אוטומטית כשהאירוע יתחיל.</p>
        <v-progress-linear indeterminate color="primary" class="mt-6 mx-auto" style="max-width: 200px" />
      </div>

      <!-- ═══════ VOTING ═══════ -->
      <div v-else-if="activeMode === 'voting'" class="guest-event__section mt-4">
        <!-- Already voted -->
        <v-card v-if="hasVoted" variant="tonal" color="success" class="guest-event__result-card text-center pa-8">
          <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
          <h2 class="text-h6 font-weight-bold mb-2">תודה על ההצבעה!</h2>
          <p class="text-body-2">ההצבעה שלך נשמרה. נתראה באירוע!</p>
        </v-card>

        <!-- Vote form -->
        <template v-else>
          <p class="text-body-2 text-medium-emphasis text-center mb-4">
            סמנו את השירים שתרצו לשמוע באירוע
          </p>

          <v-card variant="outlined" class="guest-event__list-card">
            <v-list density="comfortable" class="py-0">
              <v-list-item
                v-for="song in voteSongs"
                :key="song.id"
                class="guest-event__list-item"
                @click="song.checked = !song.checked"
              >
                <template #prepend>
                  <v-checkbox-btn v-model="song.checked" color="primary" density="compact" />
                </template>
                <v-list-item-title class="text-body-1" :class="song.checked ? 'font-weight-medium' : ''">
                  {{ song.name }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ song.artistName }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>

          <div class="text-center mt-4">
            <v-btn
              color="primary"
              size="large"
              :loading="voteSubmitting"
              :disabled="selectedVoteCount() === 0"
              prepend-icon="mdi-send"
              @click="submitVote"
            >
              שלח הצבעה ({{ selectedVoteCount() }} שירים)
            </v-btn>
          </div>
        </template>
      </div>

      <!-- ═══════ LYRICS ═══════ -->
      <div v-else-if="activeMode === 'lyrics'" class="guest-event__section mt-4">
        <div class="text-center mb-4">
          <v-chip color="success" variant="tonal" prepend-icon="mdi-broadcast" size="small">
            שידור חי
          </v-chip>
          <h2 class="text-subtitle-1 font-weight-medium mt-2">{{ lyricsSongTitle }}</h2>
        </div>

        <!-- Lyrics iframe placeholder -->
        <v-card variant="outlined" class="guest-event__lyrics-card">
          <div class="guest-event__lyrics-placeholder text-center pa-12">
            <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-text-box-outline</v-icon>
            <p class="text-body-2 text-medium-emphasis">
              כאן יוצגו מילות השיר — iframe או טקסט<br>
              (בדיוק כמו ב-GuestWordsView)
            </p>
          </div>
        </v-card>
      </div>

      <!-- ═══════ FEEDBACK ═══════ -->
      <div v-else-if="activeMode === 'feedback'" class="guest-event__section mt-4">
        <!-- Already submitted -->
        <v-card v-if="hasSubmittedFeedback" variant="tonal" color="success" class="guest-event__result-card text-center pa-8">
          <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
          <h2 class="text-h6 font-weight-bold mb-2">תודה על המשוב!</h2>
          <p class="text-body-2">התגובה שלך נשמרה. תודה שהשתתפת!</p>
        </v-card>

        <!-- Feedback form -->
        <template v-else>
          <p class="text-body-2 text-medium-emphasis text-center mb-4">
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

              <!-- Stars -->
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

              <!-- Text -->
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
      </div>

      <!-- ═══════ CLOSED ═══════ -->
      <div v-else-if="activeMode === 'closed'" class="guest-event__section text-center mt-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-check-circle-outline</v-icon>
        <h2 class="text-h6 text-medium-emphasis mb-2">האירוע הסתיים</h2>
        <p class="text-body-2 text-medium-emphasis">תודה שהשתתפתם!</p>
      </div>

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
