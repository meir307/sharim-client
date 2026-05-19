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

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const previewTitle = computed(() => String(form.title ?? '').trim())
const previewBody = computed(() => String(form.body ?? '').trim())

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
      <span class="d-flex align-center ga-2">
        <v-icon icon="mdi-web" color="primary" />
        {{ isUpdateMode ? 'עריכת דף נחיתה' : 'דף נחיתה חדש' }}
      </span>
      <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="closeDialog" />
    </v-card-title>

    <v-card-text class="pt-2">
      <p class="text-body-2 text-medium-emphasis mb-4">
        הגדר תבנית לשימוש בהפעלת אירוע — האורח יראו מסך סטטי עם הכותרת והטקסט שתבחר.
      </p>

      <v-row class="upsert-landing-page__layout" dense>
        <v-col cols="12" md="8" class="upsert-landing-page__fields">
          <v-text-field
            ref="nameFieldRef"
            v-model="form.name"
            label="שם התבנית (לזיהוי שלך)"
            density="comfortable"
            hide-details="auto"
            :rules="[requiredRule]"
            class="mb-3"
          />

          <v-text-field
            v-model="form.title"
            label="כותרת (לאורח)"
            density="comfortable"
            hide-details="auto"
            :rules="[requiredRule]"
            class="mb-3"
          />

          <v-textarea
            v-model="form.body"
            label="טקסט גוף (לאורח)"
            density="comfortable"
            hide-details="auto"
            rows="3"
            auto-grow
            class="mb-3"
          />

          <v-select
            v-model="form.icon"
            :items="LANDING_PAGE_ICON_OPTIONS"
            item-title="title"
            item-value="value"
            label="אייקון"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />

          <v-checkbox
            v-model="form.showSpinner"
            label="הצג פס התקדמות (ממתין)"
            density="comfortable"
            hide-details
            color="primary"
            class="mb-2"
          />
        </v-col>

        <v-col cols="12" md="4" class="upsert-landing-page__preview-col">
          <div class="text-caption text-medium-emphasis mb-2">תצוגה מקדימה לאורח</div>
          <div class="upsert-landing-page__phone" aria-hidden="true">
            <div class="upsert-landing-page__phone-notch" />
            <div class="upsert-landing-page__phone-screen">
              <div class="upsert-landing-page__preview-inner text-center">
                <v-icon
                  :icon="form.icon || 'mdi-clock-outline'"
                  size="32"
                  color="primary"
                  class="mb-1"
                />
                <div class="text-subtitle-1 font-weight-medium mb-2">
                  {{ previewTitle || 'כותרת' }}
                </div>
                <p class="text-body-2 text-medium-emphasis mb-0 upsert-landing-page__body">
                  {{ previewBody || '—' }}
                </p>
                <v-progress-linear
                  v-if="form.showSpinner"
                  indeterminate
                  color="primary"
                  class="mt-4 mx-auto"
                  style="max-width: 120px"
                />
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

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
.upsert-landing-page__layout {
  align-items: flex-start;
}

.upsert-landing-page__fields {
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-inline-end: 16px;
}

@media (max-width: 959px) {
  .upsert-landing-page__fields {
    border-inline-end: none;
    padding-inline-end: 0;
    margin-bottom: 16px;
  }
}

.upsert-landing-page__body {
  white-space: pre-wrap;
  line-height: 1.5;
}

.upsert-landing-page__preview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-start;
  max-width: 240px;
  padding-inline-start: 8px;
}

@media (min-width: 960px) {
  .upsert-landing-page__preview-col {
    margin-inline-start: auto;
  }
}

@media (max-width: 959px) {
  .upsert-landing-page__preview-col {
    padding-inline-start: 0;
  }
}

.upsert-landing-page__phone {
  position: relative;
  width: 100%;
  max-width: 200px;
  aspect-ratio: 9 / 16;
  margin-inline: auto;
  padding: 8px;
  border-radius: 26px;
  background: #1c1c1e;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.22),
    inset 0 0 0 2px rgba(255, 255, 255, 0.08);
}

.upsert-landing-page__phone-notch {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 5px;
  border-radius: 999px;
  background: #0d0d0f;
  z-index: 1;
}

.upsert-landing-page__phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 12px 12px;
  box-sizing: border-box;
}

.upsert-landing-page__preview-inner {
  width: 100%;
  max-width: 100%;
}
</style>
