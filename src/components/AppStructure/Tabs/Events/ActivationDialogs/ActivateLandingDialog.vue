<script setup>
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import {
  LANDING_PAGE_ICON_OPTIONS,
  landingPageDisplayName,
} from '@/components/AppStructure/Tabs/Settings/landingPageModel.js'
import { buildLandingSharingParams } from '@/utils/eventSharingModel.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const selectedPageKey = ref(null)

const landingPages = computed(() => {
  const raw = userStore.user?.landingPages
  return Array.isArray(raw) ? raw : []
})

function pageStableKey(page, index) {
  const id = page?.id ?? page?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

const pageOptions = computed(() =>
  landingPages.value.map((page, index) => ({
    title: landingPageDisplayName(page),
    value: pageStableKey(page, index),
  })),
)

const selectedPage = computed(() => {
  if (selectedPageKey.value == null) return null
  const idx = landingPages.value.findIndex(
    (p, i) => pageStableKey(p, i) === String(selectedPageKey.value),
  )
  return idx >= 0 ? landingPages.value[idx] : null
})

const selectedIconLabel = computed(() => {
  const icon = selectedPage.value?.icon
  if (!icon) return '—'
  const opt = LANDING_PAGE_ICON_OPTIONS.find((o) => o.value === icon)
  return opt?.title ?? String(icon)
})

const editTitle = ref('')
const editBody = ref('')

watch(selectedPage, (page) => {
  if (!page) {
    editTitle.value = ''
    editBody.value = ''
    return
  }
  editTitle.value = String(page.title ?? page.Title ?? '').trim()
  editBody.value = String(page.body ?? page.Body ?? '').trim()
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (landingPages.value.length && selectedPageKey.value == null) {
      selectedPageKey.value = pageStableKey(landingPages.value[0], 0)
    }
  },
)

watch(landingPages, (list) => {
  if (!list.length) {
    selectedPageKey.value = null
    return
  }
  if (
    selectedPageKey.value == null ||
    list.findIndex((p, i) => pageStableKey(p, i) === String(selectedPageKey.value)) < 0
  ) {
    selectedPageKey.value = pageStableKey(list[0], 0)
  }
})

function close() {
  emit('update:modelValue', false)
}

function onActivate() {
  try {
    const sharingParams = buildLandingSharingParams(selectedPage.value, {
      title: editTitle.value,
      body: editBody.value,
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
    <v-card class="activate-landing-dialog">
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-web" color="primary" />
          הפעלת דף נחיתה
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <v-row class="activate-landing-dialog__intro-row" dense align="center">
          <v-col cols="12" md="8" class="activate-landing-dialog__intro-fields">
            <p class="text-body-2 text-medium-emphasis mb-0">
              הקהל יראו מסך סטטי על פי בחירתך.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="activate-landing-dialog__intro-preview">
            <p class="text-caption text-medium-emphasis mb-0">תצוגה מקדימה לאורח</p>
          </v-col>
        </v-row>

        <v-row class="activate-landing-dialog__layout" dense>
          <v-col cols="12" md="8" class="activate-landing-dialog__fields">
            <v-select
              v-model="selectedPageKey"
              label="דף נחיתה"
              :items="pageOptions"
              item-title="title"
              item-value="value"
              density="comfortable"
              hide-details="auto"
              :disabled="!pageOptions.length"
              class="mb-4"
            />
            <p v-if="!pageOptions.length" class="text-caption text-warning mb-4">
              אין דפי נחיתה — הוסף בלשונית הגדרות.
            </p>

            <template v-if="selectedPage">
              <v-text-field
                v-model="editTitle"
                label="כותרת (לאורח)"
                density="comfortable"
                hide-details="auto"
                class="mb-3"
              />

              <v-textarea
                v-model="editBody"
                label="טקסט גוף (לאורח)"
                density="comfortable"
                hide-details="auto"
                rows="3"
                auto-grow
                class="mb-3"
              />

              <div class="activate-landing-dialog__field-row activate-landing-dialog__field-row--icon">
                <span class="activate-landing-dialog__label text-caption text-medium-emphasis"
                  >אייקון</span
                >
                <span class="d-flex align-center ga-2">
                  <v-icon :icon="selectedPage.icon || 'mdi-clock-outline'" color="primary" size="28" />
                  <span class="text-body-2">{{ selectedIconLabel }}</span>
                </span>
              </div>

              <div
                v-if="selectedPage.showSpinner"
                class="text-caption text-medium-emphasis mt-2 d-flex align-center ga-1"
              >
                <v-icon icon="mdi-progress-clock" size="16" />
                פס התקדמות מוצג לאורח
              </div>
            </template>
          </v-col>

          <v-col cols="12" md="4" class="activate-landing-dialog__preview-col">
            <div class="activate-landing-dialog__phone" aria-hidden="true">
              <div class="activate-landing-dialog__phone-notch" />
              <div
                class="activate-landing-dialog__phone-screen"
                :class="{ 'activate-landing-dialog__phone-screen--empty': !selectedPage }"
              >
                <template v-if="selectedPage">
                <div class="activate-landing-dialog__preview-inner text-center">
                  <v-icon
                    :icon="selectedPage.icon || 'mdi-clock-outline'"
                    size="32"
                    color="primary"
                    class="mb-1"
                  />
                  <div class="text-subtitle-1 font-weight-medium mb-2">
                    {{ editTitle || 'כותרת' }}
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-0 activate-landing-dialog__body">
                    {{ editBody || '—' }}
                  </p>
                  <v-progress-linear
                    v-if="selectedPage.showSpinner"
                    indeterminate
                    color="primary"
                    class="mt-4 mx-auto"
                    style="max-width: 120px"
                  />
                </div>
                </template>
                <p v-else class="text-caption text-medium-emphasis text-center mb-0 px-2">
                  בחר דף נחיתה
                </p>
              </div>
            </div>
          </v-col>
        </v-row>

        <div class="popup-btn-row mt-4">
          <v-btn color="primary" :disabled="!selectedPage" @click="onActivate">הפעל</v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.activate-landing-dialog__intro-row {
  margin-bottom: 1rem;
}

@media (min-width: 960px) {
  .activate-landing-dialog__intro-fields,
  .activate-landing-dialog__intro-preview {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
  }
}

.activate-landing-dialog__layout {
  align-items: flex-start;
}

.activate-landing-dialog__fields {
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-self: stretch;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-inline-end: 16px;
}

.activate-landing-dialog__fields > * {
  flex: 0 0 auto;
}

@media (max-width: 959px) {
  .activate-landing-dialog__fields {
    border-inline-end: none;
    padding-inline-end: 0;
    margin-bottom: 16px;
  }
}

.activate-landing-dialog__field-row {
  margin-bottom: 14px;
}

.activate-landing-dialog__field-row--icon {
  margin-bottom: 0;
}

.activate-landing-dialog__label {
  display: block;
  margin-bottom: 4px;
}

.activate-landing-dialog__body {
  white-space: pre-wrap;
  line-height: 1.5;
}

.activate-landing-dialog__preview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-start;
  min-height: 0;
  max-width: 240px;
  padding-inline-start: 8px;
}

@media (min-width: 960px) {
  .activate-landing-dialog__intro-preview {
    max-width: 240px;
    margin-inline-start: auto;
  }
}

.activate-landing-dialog__preview-col > * {
  flex: 0 0 auto;
}

@media (max-width: 959px) {
  .activate-landing-dialog__preview-col {
    padding-inline-start: 0;
  }
}

.activate-landing-dialog__phone {
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

.activate-landing-dialog__phone-notch {
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

.activate-landing-dialog__phone-screen {
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

.activate-landing-dialog__phone-screen--empty {
  align-items: center;
}

.activate-landing-dialog__preview-inner {
  width: 100%;
  max-width: 100%;
}
</style>
