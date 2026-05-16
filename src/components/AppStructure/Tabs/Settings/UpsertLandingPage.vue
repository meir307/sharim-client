<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { LANDING_PAGE_ICON_OPTIONS, createEmptyLandingPage } from './landingPageModel.js'

const props = defineProps({
  editLandingPage: { type: Object, default: null },
})

const emit = defineEmits(['close-dialog', 'saved'])

const nameFieldRef = ref(null)
const isSaving = ref(false)

const form = reactive(createEmptyLandingPage())

const iconOptions = LANDING_PAGE_ICON_OPTIONS

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

function applyLandingPageToForm(page) {
  const base = createEmptyLandingPage()
  if (!page || typeof page !== 'object') {
    Object.assign(form, createEmptyLandingPage(null))
    return
  }
  Object.assign(form, {
    ...base,
    ...page,
    id: page.id ?? null,
    name: page.name ?? '',
    title: page.title ?? '',
    body: page.body ?? '',
    icon: page.icon ?? base.icon,
    showSpinner: Boolean(page.showSpinner),
  })
}

watch(
  () => props.editLandingPage,
  async () => {
    applyLandingPageToForm(props.editLandingPage)
    await nextTick()
    const el = nameFieldRef.value
    if (typeof el?.focus === 'function') {
      el.focus()
    } else if (el?.$el) {
      el.$el.querySelector?.('input')?.focus()
    }
  },
  { immediate: true, deep: true },
)

function closeDialog() {
  emit('close-dialog')
}

function buildPayload() {
  return {
    id: form.id,
    name: String(form.name).trim(),
    title: String(form.title).trim(),
    body: String(form.body).trim(),
    icon: form.icon || 'mdi-clock-outline',
    showSpinner: Boolean(form.showSpinner),
  }
}

async function saveLandingPage() {
  if (requiredRule(form.name) !== true) {
    alert('יש להזין שם תבנית')
    return
  }
  if (requiredRule(form.title) !== true) {
    alert('יש להזין כותרת לאורח')
    return
  }

  isSaving.value = true
  try {
    emit('saved', buildPayload())
    closeDialog()
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <v-card class="upsert-landing-page">
    <v-card-title class="popup-title d-flex align-center justify-space-between">
      {{ isUpdateMode ? 'עריכת דף נחיתה' : 'דף נחיתה חדש' }}
      <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="closeDialog" />
    </v-card-title>

    <v-card-text class="pt-2">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            ref="nameFieldRef"
            v-model="form.name"
            label="שם התבנית (לזיהוי שלך)"
            density="comfortable"
            hide-details="auto"
            :rules="[requiredRule]"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.icon"
            :items="iconOptions"
            item-title="title"
            item-value="value"
            label="אייקון"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.title"
            label="כותרת (מה שהאורח רואה)"
            density="comfortable"
            hide-details="auto"
            :rules="[requiredRule]"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.body"
            label="טקסט גוף"
            density="comfortable"
            hide-details="auto"
            rows="3"
            auto-grow
          />
        </v-col>
        <v-col cols="12">
          <v-checkbox
            v-model="form.showSpinner"
            label="הצג פס התקדמות (ממתין)"
            density="comfortable"
            hide-details
            color="primary"
          />
        </v-col>
      </v-row>

      <div class="upsert-landing-page__preview mt-4 pa-4">
        <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה</div>
        <div class="upsert-landing-page__preview-inner text-center">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">{{ form.icon || 'mdi-web' }}</v-icon>
          <div class="text-h6 font-weight-medium mb-1">{{ form.title || 'כותרת' }}</div>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ form.body || 'טקסט גוף' }}</p>
          <v-progress-linear
            v-if="form.showSpinner"
            indeterminate
            color="primary"
            class="mt-4 mx-auto"
            style="max-width: 160px"
          />
        </div>
      </div>

      <div class="popup-btn-row mt-4">
        <v-btn color="primary" :loading="isSaving" @click="saveLandingPage">
          {{ isUpdateMode ? 'עדכן' : 'הוסף' }}
        </v-btn>
        <v-btn :disabled="isSaving" @click="closeDialog">סגור</v-btn>
        <v-spacer />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.upsert-landing-page__preview {
  border-radius: 8px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.upsert-landing-page__preview-inner {
  max-width: 360px;
  margin-inline: auto;
}
</style>
