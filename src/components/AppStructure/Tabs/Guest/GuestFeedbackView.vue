<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useGuestStore } from '@/stores/guestStore'
import {
  clearGuestSubmittedFeedbackForSharingParams,
  hasGuestSubmittedFeedbackForSharingParams,
  markGuestSubmittedFeedbackForSharingParams,
} from '@/utils/guestSessionStorage.js'
import { feedbackSessionFromSharingParams } from '@/utils/eventSharingModel.js'

const guestStore = useGuestStore()

const props = defineProps({
  sharingParams: { type: Object, required: true },
  sharingCode: { type: String, default: '' },
})

/** @type {import('vue').Ref<'intro' | 'feedback'>} */
const step = ref('intro')
const hasSubmitted = ref(false)
const declined = ref(false)
const submitting = ref(false)
const questions = ref([])

const title = computed(() => String(props.sharingParams?.title ?? '').trim())
const body = computed(() => String(props.sharingParams?.body ?? '').trim())

const feedbackSession = computed(() => feedbackSessionFromSharingParams(props.sharingParams))

function initQuestions() {
  const qs = Array.isArray(props.sharingParams?.questions) ? props.sharingParams.questions : []
  questions.value = qs.map((q, i) => ({
    id: q?.id ?? i,
    text: String(q?.text ?? '').trim(),
    type: q?.type === 'text' ? 'text' : 'stars',
    answer: q?.type === 'text' ? '' : 0,
  }))
}

function continueToFeedback() {
  step.value = 'feedback'
}

function onNotInterested() {
  declined.value = true
}

function backToIntro() {
  declined.value = false
  step.value = 'intro'
}

function setStarRating(question, rating) {
  question.answer = rating
}

async function submitFeedback() {
  if (hasSubmitted.value || submitting.value) return
  submitting.value = true
  try {
    await guestStore.guestFeedback(questions.value)
    hasSubmitted.value = true
    markGuestSubmittedFeedbackForSharingParams(props.sharingParams)
  } catch (err) {
    const resData = err?.response?.data ?? {}
    const message = String(
      resData.message ??
        resData.errorMessage ??
        err?.message ??
        'שליחת המשוב נכשלה',
    ).trim()
    alert(message)
  } finally {
    submitting.value = false
  }
}

/** TEST ONLY — remove before production */
function clearFeedbackSessionForTesting() {
  clearGuestSubmittedFeedbackForSharingParams(props.sharingParams)
  hasSubmitted.value = false
  step.value = 'intro'
  initQuestions()
}

function applyFeedbackSessionState() {
  initQuestions()
  declined.value = false
  if (hasGuestSubmittedFeedbackForSharingParams(props.sharingParams)) {
    hasSubmitted.value = true
  } else {
    hasSubmitted.value = false
    step.value = 'intro'
  }
}

watch(
  () => [
    feedbackSession.value.eventId,
    feedbackSession.value.title,
    props.sharingParams?.questions,
  ],
  applyFeedbackSessionState,
  { immediate: true, deep: false },
)

/** Pause live broadcast poll while guest is answering questions (not intro / thank-you). */
function syncBroadcastPollPause() {
  const pause = step.value === 'feedback' && !hasSubmitted.value
  if (pause) {
    guestStore.pauseBroadcastPolling()
  } else {
    guestStore.resumeBroadcastPolling()
  }
}

watch([step, hasSubmitted], syncBroadcastPollPause, { immediate: true })

onUnmounted(() => {
  guestStore.resumeBroadcastPolling()
})
</script>

<template>
  <div class="guest-mode-view guest-mode-view--feedback mt-4">
    <v-card
      v-if="hasSubmitted"
      variant="tonal"
      color="success"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
      <h2 class="text-h6 font-weight-bold mb-2">תודה על המשוב!</h2>
      <p class="text-body-2 mb-4">התגובה שלך נשמרה. תודה שהשתתפת!</p>
      <!-- TEST ONLY — delete before production -->
      <v-btn
        variant="outlined"
        color="warning"
        size="small"
        @click="clearFeedbackSessionForTesting"
      >
        [בדיקה] נקה זיכרון משוב
      </v-btn>
    </v-card>

    <v-card
      v-else-if="declined"
      variant="tonal"
      color="grey"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="48" color="grey" class="mb-3">mdi-hand-wave-outline</v-icon>
      <h2 class="text-h6 font-weight-medium mb-2">תודה</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">נשמח לראותכם באירוע בכל זאת.</p>
      <v-btn variant="text" color="primary" @click="backToIntro">
        רוצים למלא משוב? חזרה
      </v-btn>
    </v-card>

    <div v-else-if="step === 'intro'" class="guest-mode-view__intro text-center">
      <h2 v-if="title" class="text-h6 font-weight-medium mb-3">{{ title }}</h2>
      <p v-if="body" class="text-body-2 text-medium-emphasis mb-4 guest-mode-view__body">
        {{ body }}
      </p>
      <p v-else-if="!title" class="text-body-2 text-medium-emphasis mb-4">
        נשמח לשמוע מה חשבתם
      </p>
      <p class="text-body-2 text-medium-emphasis mb-6">האם תרצו למלא משוב קצר?</p>

      <div class="guest-mode-view__intro-actions d-flex flex-column ga-3">
        <v-btn
          color="primary"
          size="large"
          block
          prepend-icon="mdi-comment-text-outline"
          @click="continueToFeedback"
        >
          המשך למשוב
        </v-btn>
        <v-btn variant="outlined" size="large" block @click="onNotInterested">
          לא מעוניין/ים
        </v-btn>
      </div>
    </div>

    <template v-else-if="step === 'feedback'">
      <template v-if="questions.length">
        <v-card
          v-for="(q, index) in questions"
          :key="q.id"
          variant="outlined"
          class="guest-mode-view__question-card pa-4 mb-4"
        >
          <div class="text-subtitle-2 font-weight-medium mb-3">
            {{ index + 1 }}. {{ q.text }}
          </div>
          <div v-if="q.type === 'stars'" class="guest-mode-view__stars-wrap">
            <div class="guest-mode-view__stars-input">
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
            <div class="guest-mode-view__stars-labels text-caption text-medium-emphasis">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
          <v-textarea
            v-else
            v-model="q.answer"
            placeholder="הקלידו כאן..."
            variant="outlined"
            density="comfortable"
            rows="3"
            hide-details
            auto-grow
          />
        </v-card>

        <div class="text-center mt-2">
          <v-btn
            color="primary"
            size="large"
            :loading="submitting"
            prepend-icon="mdi-send"
            @click="submitFeedback"
          >
            שלח משוב
          </v-btn>
        </div>
      </template>

      <p v-else class="text-body-2 text-medium-emphasis text-center mt-6">אין שאלות משוב.</p>
    </template>
  </div>
</template>

<style scoped>
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

.guest-mode-view__question-card {
  border-radius: 12px;
}

.guest-mode-view__body {
  white-space: pre-wrap;
}

.guest-mode-view__stars-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.guest-mode-view__stars-input {
  display: flex;
  justify-content: center;
  gap: 2px;
  direction: rtl;
}

.guest-mode-view__stars-labels {
  display: flex;
  justify-content: space-between;
  width: min(17.5rem, 100%);
  direction: rtl;
  padding-inline: 0.15rem;
  margin-top: -0.35rem;
}
</style>
