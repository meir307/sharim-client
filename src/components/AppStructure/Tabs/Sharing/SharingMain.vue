<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { useSharingStore } from '@/stores/SharingStore'
import { buildGuestWordsShareUrl } from '@/utils/shareGuestUrl'

const userStore = useUserStore()
const sharingStore = useSharingStore()

const copySnackbar = ref(false)
const copySnackbarText = ref('')
const copySnackbarColor = ref('success')

const sharingToggleLoading = ref(false)

async function copyInvitationToClipboard() {
  const text = invitationText.value
  try {
    await navigator.clipboard.writeText(text)
    copySnackbarText.value = 'הטקסט הועתק — פתחו וואטסאפ והדביקו בהודעה'
    copySnackbarColor.value = 'success'
    copySnackbar.value = true
  } catch {
    copySnackbarText.value = 'ההעתקה נכשלה. בחרו את הטקסט בשדה והשתמשו בהעתקה מהדפדפן.'
    copySnackbarColor.value = 'error'
    copySnackbar.value = true
  }
}

const shareUrl = computed(() => buildGuestWordsShareUrl(userStore.user?.emitCode))

const emitCodeDisplay = computed(() => {
  const c = String(userStore.user?.emitCode ?? '').trim()
  return c || ''
})

const sharingActive = computed(() => userStore.sharingActive)

const invitationText = computed(() => {
  const url = shareUrl.value
  return [
    'שלום,',
    'במהלך האירוע אפשר לעקוב אחרי מילות השירים בקישור הייעודי:',
    url,
    '',
    'חשוב: הקישור יהיה זמין דקות ספורות לפני תחילת האירוע.',
    'נשמח לראותכם!',
  ].join('\n')
})

async function onToggleSharing() {
  const startSharing = !sharingActive.value
  sharingToggleLoading.value = true
  try {
    await sharingStore.setGuestSharingActive(startSharing)
    const on = userStore.sharingActive
    copySnackbarText.value = on ? 'שיתוף האורחים פעיל' : 'שיתוף האורחים הושבת'
    copySnackbarColor.value = on ? 'success' : 'secondary'
    copySnackbar.value = true
  } catch {
    // errors surfaced via UserStore (alert)
  } finally {
    sharingToggleLoading.value = false
  }
}
</script>

<template>
  <div class="sharing-main">
    <div class="content-wrapper">
      <div class="content-area">
        <v-card class="modern-card sharing-main__content-card" elevation="0">
          <v-card-title class="modern-title sharing-main__card-title">
            <div class="title-container">
              <h2 class="title-text">שיתוף</h2>
              <v-spacer />
            </div>
          </v-card-title>
          <v-card-text class="pa-0">
            <div class="tiles-container sharing-main__panel-wrap">
              <div class="sharing-main__panel-inner sharing-main__panel-inner--invite">
                <div class="sharing-main__invite-block">
                  <p class="sharing-main__emit-line mb-3">
                    קוד השיתוף לאירוע הוא
                    <span dir="ltr" class="sharing-main__emit-code">{{ emitCodeDisplay || '—' }}</span>
                  </p>
                  <p class="text-subtitle-2 text-medium-emphasis mb-2 sharing-main__invite-heading">
                    הזמנה לוואטסאפ
                  </p>
                  <div class="sharing-main__invite-row-wrap">
                    <div class="sharing-main__invite-row">
                      <div class="sharing-main__invite-actions">
                        <v-btn
                          color="primary"
                          variant="tonal"
                          prepend-icon="mdi-content-copy"
                          @click="copyInvitationToClipboard"
                        >
                          העתק טקסט 
                        </v-btn>
                      </div>
                      <div class="sharing-main__invite-fit">
                        <v-textarea
                          :model-value="invitationText"
                          readonly
                          variant="outlined"
                          rows="5"
                          hide-details="auto"
                          class="sharing-main__invite-text"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="sharing-main__activate-wrap">
                    <v-btn
                      :color="sharingActive ? 'error' : 'success'"
                      variant="flat"
                      :prepend-icon="sharingActive ? 'mdi-broadcast-off' : 'mdi-broadcast'"
                      :loading="sharingToggleLoading"
                      @click="onToggleSharing"
                    >
                      {{ sharingActive ? 'עצור שיתוף' : 'הפעל שיתוף' }}
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
    <v-snackbar
      v-model="copySnackbar"
      :color="copySnackbarColor"
      location="bottom"
      :timeout="2800"
      multi-line
    >
      {{ copySnackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.sharing-main {
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -16px;
  padding-inline: 12px;
  padding-top: 16px;
}

@media (min-width: 600px) {
  .sharing-main {
    margin-top: -24px;
    padding-inline: 16px;
    padding-top: 24px;
  }
}

.content-wrapper {
  display: flex;
  position: relative;
  width: 100%;
  min-width: 0;
  gap: 16px;
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  overflow: hidden;
}

.content-area {
  flex: 1;
  min-width: 0;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.sharing-main__content-card {
  min-height: 100%;
}

.sharing-main__card-title {
  display: flex !important;
  align-items: center;
  min-height: 56px;
  box-sizing: border-box;
}

.sharing-main__card-title :deep(.title-container) {
  width: 100%;
  align-items: center;
}

@media (max-width: 960px) {
  .content-wrapper {
    max-height: none;
    min-height: auto;
  }

  .content-area {
    overflow-y: visible;
  }
}

.sharing-main__panel-wrap {
  width: 100%;
  min-width: 0;
}

.sharing-main__panel-inner {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 16px;
}

.sharing-main__panel-inner--invite {
  text-align: right;
}

.sharing-main__invite-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.sharing-main__invite-heading {
  width: 100%;
  text-align: right;
}

.sharing-main__emit-line {
  width: 100%;
  text-align: right;
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.55;
}

.sharing-main__emit-code {
  display: inline-block;
  margin-inline-start: 6px;
  font-size: 1.15em;
  font-weight: 600;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  unicode-bidi: isolate;
}

/* Push button + textarea as a unit to the physical right */
.sharing-main__invite-row-wrap {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  direction: ltr;
}

.sharing-main__activate-wrap {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 16px;
  direction: ltr;
}

/* LTR row: button on physical left of the field, still RTL inside textarea */
.sharing-main__invite-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  direction: ltr;
}

.sharing-main__invite-actions {
  display: flex;
  flex-shrink: 0;
  padding-top: 4px;
}

/* Shrink field to content width (capped by panel); long URLs still wrap */
.sharing-main__invite-fit {
  display: inline-block;
  flex: 0 1 auto;
  min-width: 0;
  width: fit-content;
  max-width: 100%;
  vertical-align: top;
}

.sharing-main__invite-text {
  width: fit-content;
  max-width: 100%;
}

.sharing-main__invite-text :deep(.v-input) {
  width: fit-content !important;
  max-width: 100%;
}

.sharing-main__invite-text :deep(.v-input__control) {
  width: fit-content;
  max-width: 100%;
}

.sharing-main__invite-text :deep(.v-field) {
  width: fit-content;
  max-width: 100%;
}

.sharing-main__invite-text :deep(.v-field__input) {
  width: fit-content !important;
  max-width: 100%;
}

.sharing-main__invite-text :deep(textarea) {
  width: max-content;
  min-width: min(100%, 12rem);
  max-width: 100%;
  box-sizing: border-box;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.5;
  field-sizing: content;
}
</style>
