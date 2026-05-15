<script setup>
const questions = defineModel({
  type: Array,
  default: () => [],
})

defineProps({
  emptyText: {
    type: String,
    default: 'אין שאלות משוב. הוסף שאלה מהכפתור למעלה.',
  },
})

const questionTypes = [
  { title: 'דירוג כוכבים (1-5)', value: 'stars' },
  { title: 'טקסט חופשי', value: 'text' },
]

function nextQuestionId() {
  const ids = (questions.value || [])
    .map((q) => Number(q?.id))
    .filter((id) => Number.isFinite(id))
  return ids.length ? Math.max(...ids) + 1 : 1
}

function addQuestion() {
  const list = Array.isArray(questions.value) ? [...questions.value] : []
  list.push({ id: nextQuestionId(), text: '', type: 'stars' })
  questions.value = list
}

function removeQuestion(index) {
  const list = Array.isArray(questions.value) ? [...questions.value] : []
  list.splice(index, 1)
  questions.value = list
}

defineExpose({ addQuestion })
</script>

<template>
  <div class="feedback-questions">
    <div v-if="!questions?.length" class="text-body-2 text-medium-emphasis pa-4 text-center">
      {{ emptyText }}
    </div>

    <v-card
      v-for="(q, index) in questions"
      :key="q.id ?? index"
      variant="outlined"
      class="feedback-questions__card mb-3 pa-3"
    >
      <div class="feedback-questions__row">
        <span class="text-body-2 text-medium-emphasis feedback-questions__num">{{ index + 1 }}.</span>
        <v-text-field
          v-model="q.text"
          label="טקסט השאלה"
          density="compact"
          hide-details
          variant="underlined"
          class="feedback-questions__input"
        />
        <v-select
          v-model="q.type"
          :items="questionTypes"
          item-title="title"
          item-value="value"
          density="compact"
          hide-details
          variant="underlined"
          class="feedback-questions__type"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          density="comfortable"
          color="error"
          aria-label="הסר שאלה"
          @click="removeQuestion(index)"
        />
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.feedback-questions__card {
  border-radius: 8px;
}

.feedback-questions__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-questions__num {
  flex-shrink: 0;
  min-width: 20px;
  text-align: center;
}

.feedback-questions__input {
  flex: 1;
  min-width: 0;
}

.feedback-questions__type {
  flex: 0 0 auto;
  width: 180px;
  min-width: 140px;
}
</style>
