<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { buildFeedbackSharingParams } from '@/utils/eventSharingModel.js'

defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const feedbackTitle = ref('נשמח לשמוע אתכם')

const previewQuestions = computed(() => {
  const raw = userStore.user?.feedbackQuestions
  return Array.isArray(raw) ? raw : []
})

function close() {
  emit('update:modelValue', false)
}

function onActivate() {
  try {
    const sharingParams = buildFeedbackSharingParams({
      title: feedbackTitle.value,
      questions: previewQuestions.value.map((q) => ({ ...q })),
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
    max-width="640"
    width="92%"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-comment-question-outline" color="warning" />
          הפעלת שאלות משוב
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          הקהל ימלאו את שאלות המשוב שהוגדרו בלשונית הגדרות.
        </p>

        <v-text-field
          v-model="feedbackTitle"
          label="כותרת למשוב"
          density="comfortable"
          hide-details="auto"
          class="mb-4"
        />

        <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה — שאלות</div>
        <p v-if="!previewQuestions.length" class="text-caption text-warning mb-4">
          אין שאלות משוב — הוסף בלשונית הגדרות.
        </p>
        <v-card
          v-for="(q, index) in previewQuestions"
          :key="q.id ?? index"
          variant="outlined"
          class="activate-feedback-dialog__card mb-3 pa-3"
        >
          <div class="text-body-2 text-medium-emphasis mb-2">{{ index + 1 }}. {{ q.text }}</div>
          <v-rating
            v-if="q.type === 'stars'"
            :model-value="0"
            density="compact"
            color="warning"
            readonly
            disabled
          />
          <v-text-field
            v-else
            label="תשובה"
            density="compact"
            hide-details
            variant="underlined"
            readonly
            disabled
          />
        </v-card>

        <div class="popup-btn-row mt-4">
          <v-btn color="warning" :disabled="!previewQuestions.length" @click="onActivate">הפעל</v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.activate-feedback-dialog__card:last-of-type {
  margin-bottom: 0 !important;
}
</style>
