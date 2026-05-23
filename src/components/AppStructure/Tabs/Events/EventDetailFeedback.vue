<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useEventStore } from '@/stores/eventStore'

const props = defineProps({
  event: { type: Object, default: null },
  selectedSessionId: { type: Number, default: null },
})

const emit = defineEmits([
  'update:selectedSessionId',
  'update:feedbackSessionItems',
  'update:totalParticipate',
  'update:loading',
])

const eventStore = useEventStore()

const loading = ref(false)
/** @type {import('vue').Ref<Array<{ id: number, title: string, totalParticipate: number, questions: Array<Record<string, unknown>> }>>} */
const feedbackSessions = ref([])
/** @type {import('vue').Ref<Array<{ id: number, question: string, type: string, totalResponses: number, avgRating: number, distribution: number[], responses: string[] }>>} */
const questionResults = ref([])
const totalParticipate = ref(0)

/** Options for parent header v-select (avoid `title` key — conflicts with Vuetify 4 select attrs). */
const sessionSelectItems = computed(() =>
  feedbackSessions.value.map((s) => ({
    sessionTitle: String(s.title ?? '').trim() || `סבב #${s.id}`,
    value: Number(s.id),
  })),
)

const visibleQuestions = computed(() =>
  questionResults.value.filter((q) => q.totalResponses > 0),
)

const hasResults = computed(() => visibleQuestions.value.length > 0)

const eventId = computed(() => {
  const id = props.event?.id ?? props.event?.Id
  if (id == null || String(id).trim() === '') return null
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : null
})

const activeSession = computed(() => {
  const id = props.selectedSessionId
  if (id != null) {
    const found = feedbackSessions.value.find((s) => s.id === id)
    if (found) return found
  }
  return feedbackSessions.value[0] ?? null
})

function starsArray(count) {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(count))
}

function syncSessionItemsToParent() {
  emit('update:feedbackSessionItems', [...sessionSelectItems.value])
}

function ensureSelectedSession() {
  const sessions = feedbackSessions.value
  if (!sessions.length) {
    if (props.selectedSessionId != null) emit('update:selectedSessionId', null)
    return
  }
  const currentValid =
    props.selectedSessionId != null &&
    sessions.some((s) => s.id === props.selectedSessionId)
  if (!currentValid) {
    emit('update:selectedSessionId', sessions[0].id)
  }
}

function applySessionToView(session) {
  if (!session) {
    questionResults.value = []
    totalParticipate.value = 0
    emit('update:totalParticipate', 0)
    return
  }
  totalParticipate.value = session.totalParticipate
  emit('update:totalParticipate', totalParticipate.value)
  questionResults.value = session.questions.map((q) => ({ ...q }))
}

watch(loading, (v) => emit('update:loading', v), { immediate: true })

watch(sessionSelectItems, syncSessionItemsToParent, { immediate: true })

watch(
  () => [props.selectedSessionId, feedbackSessions.value],
  () => {
    applySessionToView(activeSession.value)
  },
  { immediate: true, deep: true },
)

async function loadFeedbackResults() {
  if (eventId.value == null) return
  loading.value = true
  try {
    const sessions = await eventStore.fetchFeedbackResults(eventId.value)
    feedbackSessions.value = sessions
    ensureSelectedSession()
    syncSessionItemsToParent()
    applySessionToView(activeSession.value)
  } catch (err) {
    feedbackSessions.value = []
    emit('update:selectedSessionId', null)
    syncSessionItemsToParent()
    applySessionToView(null)
    const message = String(err?.message ?? 'טעינת תוצאות המשוב נכשלה').trim()
    if (message) alert(message)
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadFeedbackResults()
}

defineExpose({ refresh })

onMounted(() => {
  loadFeedbackResults()
})
</script>

<template>
  <div class="tiles-container tab-panel-wrap tab-panel-wrap--fill event-detail-feedback">
    <div class="tab-panel-inner tab-panel-inner--fill event-detail-feedback__inner">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3 flex-shrink-0" />

      <div
        v-else-if="!feedbackSessions.length || !hasResults"
        class="event-detail-feedback__empty text-body-2 text-medium-emphasis text-center pa-6"
      >
        עדיין אין תגובות משוב.
      </div>

      <div v-else class="event-detail-feedback__list-scroll">
        <div class="event-detail-feedback__list" role="list">
          <v-card
            v-for="fb in visibleQuestions"
            :key="fb.id"
            variant="tonal"
            class="event-detail-feedback__item pa-4 mb-3"
          >
            <div class="text-subtitle-2 font-weight-medium mb-2">{{ fb.question }}</div>
            <div class="text-caption text-medium-emphasis mb-2">{{ fb.totalResponses }} תגובות</div>

            <template v-if="fb.type === 'stars'">
              <div class="event-detail-feedback__stars-result">
                <div class="event-detail-feedback__stars-avg">
                  <span class="text-h5 font-weight-bold">{{ fb.avgRating.toFixed(1) }}</span>
                  <div class="event-detail-feedback__stars-icons">
                    <v-icon
                      v-for="(filled, i) in starsArray(fb.avgRating)"
                      :key="i"
                      size="18"
                      :color="filled ? 'amber' : 'grey-lighten-2'"
                    >
                      {{ filled ? 'mdi-star' : 'mdi-star-outline' }}
                    </v-icon>
                  </div>
                </div>
                <div class="event-detail-feedback__stars-bars">
                  <div v-for="star in 5" :key="star" class="event-detail-feedback__star-bar-row">
                    <span class="text-caption tabular-nums">{{ star }}</span>
                    <v-progress-linear
                      :model-value="
                        fb.totalResponses ? (fb.distribution[star - 1] / fb.totalResponses) * 100 : 0
                      "
                      color="amber"
                      bg-color="grey-lighten-3"
                      height="8"
                      rounded
                      class="event-detail-feedback__star-bar"
                    />
                    <span class="text-caption tabular-nums event-detail-feedback__star-count">
                      {{ fb.distribution[star - 1] }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="fb.type === 'text'">
              <v-list v-if="fb.responses.length" density="compact" class="py-0 bg-transparent">
                <v-list-item
                  v-for="(resp, ri) in fb.responses"
                  :key="ri"
                  class="px-0"
                >
                  <v-list-item-title class="text-body-2 text-wrap">
                    <v-icon size="14" color="grey" class="me-1">mdi-format-quote-open</v-icon>
                    {{ resp }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis mb-0">אין תשובות טקסט עדיין.</p>
            </template>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Parent `.tab-panel-wrap--fill` already adds padding; avoid double inset from `.tiles-container`. */
.event-detail-feedback.tiles-container {
  padding: 0;
  gap: 0;
}

.event-detail-feedback {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.event-detail-feedback__inner {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 0;
  box-sizing: border-box;
}

.event-detail-feedback__empty {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-detail-feedback__list-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
  padding-bottom: 6px;
}

.event-detail-feedback__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.event-detail-feedback__item:last-child {
  margin-bottom: 0 !important;
}

.event-detail-feedback__stars-result {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.event-detail-feedback__stars-avg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
}

.event-detail-feedback__stars-icons {
  display: flex;
  gap: 2px;
}

.event-detail-feedback__stars-bars {
  flex: 1;
  min-width: 140px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-detail-feedback__star-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-detail-feedback__star-bar {
  flex: 1;
}

.event-detail-feedback__star-count {
  min-width: 20px;
  text-align: end;
}
</style>
