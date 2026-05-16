<script setup>
const demoFeedbackResults = [
  {
    id: 1,
    question: 'איך הייתה ההופעה?',
    type: 'stars',
    avgRating: 4.3,
    totalResponses: 23,
    distribution: [1, 2, 3, 8, 9],
  },
  {
    id: 2,
    question: 'מה השיר שהכי אהבת?',
    type: 'text',
    totalResponses: 18,
    responses: [
      'אור הירח בהחלט!',
      'מקום לדאגה — מושלם',
      'הכל היה מעולה',
      'השירים של קיצבי',
    ],
  },
]

function starsArray(count) {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(count))
}
</script>

<template>
  <div class="tiles-container tab-panel-wrap">
    <div class="tab-panel-inner">
      <div class="d-flex align-center justify-space-between mb-3">
        <span class="text-body-2 text-medium-emphasis">תוצאות משוב</span>
        <v-btn variant="text" size="small" prepend-icon="mdi-refresh" color="primary">רענן</v-btn>
      </div>
      <div v-if="!demoFeedbackResults.length" class="text-body-2 text-medium-emphasis text-center pa-6">
        עדיין אין תגובות משוב.
      </div>
      <div v-else class="event-detail-feedback__list">
        <v-card
          v-for="fb in demoFeedbackResults"
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
                    :model-value="fb.totalResponses ? (fb.distribution[star - 1] / fb.totalResponses) * 100 : 0"
                    color="amber"
                    bg-color="grey-lighten-3"
                    height="8"
                    rounded
                    class="event-detail-feedback__star-bar"
                  />
                  <span class="text-caption tabular-nums event-detail-feedback__star-count">{{ fb.distribution[star - 1] }}</span>
                </div>
              </div>
            </div>
          </template>

          <template v-if="fb.type === 'text'">
            <v-list density="compact" class="py-0 bg-transparent">
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
          </template>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
