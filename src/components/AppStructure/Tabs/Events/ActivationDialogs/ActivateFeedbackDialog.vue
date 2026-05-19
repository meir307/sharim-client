<script setup>
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { buildFeedbackSharingParams } from '@/utils/eventSharingModel.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const DEFAULT_FEEDBACK_TITLE = 'ספרו לנו איך היה'
const DEFAULT_FEEDBACK_BODY =
  'המשוב שלכם עוזר לנו להמשיך ולהשתפר. מענה על השאלות לוקח פחות מדקה — ונשמח מאוד לשמוע את דעתכם.'

const feedbackTitle = ref(DEFAULT_FEEDBACK_TITLE)
const feedbackBody = ref(DEFAULT_FEEDBACK_BODY)
const questionRows = ref([])

const previewQuestions = computed(() => {
  const raw = userStore.user?.feedbackQuestions
  return Array.isArray(raw) ? raw : []
})

const selectedCount = computed(() => questionRows.value.filter((r) => r.checked).length)

function questionStableKey(q, index) {
  const id = q?.id ?? q?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

function syncQuestionRows() {
  questionRows.value = previewQuestions.value.map((q, index) => ({
    key: questionStableKey(q, index),
    id: q?.id ?? q?.Id ?? index,
    text: String(q?.text ?? q?.Text ?? '').trim(),
    type: q?.type === 'text' ? 'text' : 'stars',
    checked: true,
    source: q,
  }))
}

function toggleQuestion(row) {
  row.checked = !row.checked
}

watch(previewQuestions, syncQuestionRows, { immediate: true })

watch(
  () => props.modelValue,
  (open) => {
    if (open) syncQuestionRows()
  },
)

function close() {
  emit('update:modelValue', false)
}

function onActivate() {
  try {
    const selected = questionRows.value.filter((r) => r.checked).map((r) => ({ ...r.source }))
    const sharingParams = buildFeedbackSharingParams({
      title: String(feedbackTitle.value ?? '').replace(/\s*\n+\s*/g, ' ').trim(),
      body: feedbackBody.value,
      questions: selected,
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
    max-width="880"
    width="94%"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="activate-feedback-dialog">
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-comment-question-outline" color="warning" />
          הפעלת שאלות משוב
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <v-row class="activate-feedback-dialog__intro-row" dense align="center">
          <v-col cols="12" md="6" class="activate-feedback-dialog__intro-fields">
            <p class="text-body-2 text-medium-emphasis mb-0">
              הקהל ימלאו את שאלות המשוב שהוגדרו בלשונית הגדרות.
            </p>
          </v-col>
          <v-col cols="12" md="6" class="activate-feedback-dialog__intro-preview">
            <p class="text-caption text-medium-emphasis mb-0">
              שאלות לאירוע · סמנו את הרלוונטיות ({{ selectedCount }} נבחרו)
            </p>
          </v-col>
        </v-row>

        <v-row class="activate-feedback-dialog__layout" dense>
          <v-col cols="12" md="6" class="activate-feedback-dialog__fields">
            <v-text-field
              v-model="feedbackTitle"
              label="כותרת למשוב"
              density="comfortable"
              hide-details="auto"
              class="mb-3 activate-feedback-dialog__title-field"
              @keydown.enter.prevent
            />
            <v-textarea
              v-model="feedbackBody"
              label="טקסט גוף (לאורח)"
              density="comfortable"
              hide-details="auto"
              rows="3"
              auto-grow
            />
            <p v-if="!previewQuestions.length" class="text-caption text-warning mt-4 mb-0">
              אין שאלות משוב — הוסף בלשונית הגדרות.
            </p>
          </v-col>

          <v-col cols="12" md="6" class="activate-feedback-dialog__preview-col">
            <v-card variant="outlined" class="activate-feedback-dialog__preview-card">
              <v-list
                v-if="questionRows.length"
                density="comfortable"
                class="py-0 activate-feedback-dialog__questions-list"
              >
                <v-list-item
                  v-for="(row, index) in questionRows"
                  :key="row.key"
                  class="activate-feedback-dialog__list-item"
                  :class="{ 'activate-feedback-dialog__list-item--off': !row.checked }"
                  @click="toggleQuestion(row)"
                >
                  <template #prepend>
                    <v-checkbox-btn
                      v-model="row.checked"
                      color="warning"
                      density="compact"
                      @click.stop
                    />
                  </template>
                  <v-list-item-title class="text-body-2 activate-feedback-dialog__question-line">
                    <span :class="{ 'font-weight-medium': row.checked }">
                      {{ index + 1 }}. {{ row.text }}
                    </span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="row.type === 'text'" class="mt-1">
                    <span class="text-caption text-medium-emphasis">שאלה פתוחה</span>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis pa-4 text-center mb-0">
                אין שאלות משוב להצגה.
              </p>
            </v-card>
          </v-col>
        </v-row>

        <div class="popup-btn-row mt-4">
          <v-btn
            color="warning"
            :disabled="!previewQuestions.length || selectedCount === 0"
            @click="onActivate"
          >
            הפעל
          </v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.activate-feedback-dialog__intro-row {
  margin-bottom: 1rem;
}

.activate-feedback-dialog__intro-preview {
  text-align: start;
}

@media (min-width: 960px) {
  .activate-feedback-dialog__intro-fields,
  .activate-feedback-dialog__intro-preview {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
  }
}

.activate-feedback-dialog__layout {
  align-items: flex-start;
}

.activate-feedback-dialog__fields,
.activate-feedback-dialog__preview-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
  align-self: stretch;
}

.activate-feedback-dialog__fields > * {
  flex: 0 0 auto;
}

.activate-feedback-dialog__title-field :deep(.v-field) {
  min-height: calc(var(--v-input-control-height, 56px) + 3px);
}

.activate-feedback-dialog__preview-card {
  flex: 1 1 auto;
  width: 100%;
  min-height: 12rem;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.activate-feedback-dialog__questions-list {
  flex: 1 1 auto;
  max-height: min(22rem, 50vh);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.activate-feedback-dialog__list-item {
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.activate-feedback-dialog__list-item:last-child {
  border-bottom: none;
}

.activate-feedback-dialog__list-item--off {
  opacity: 0.55;
}

.activate-feedback-dialog__question-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
</style>
