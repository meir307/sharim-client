<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/UserStore'
import { useSharingStore } from '@/stores/SharingStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const sharingStore = useSharingStore()

const sharingCode = ref('')
const formError = ref('')
const submitting = ref(false)

function sanitizeDigits(value) {
  return String(value ?? '').replace(/\D+/g, '')
}

function onSharingCodeInput(value) {
  sharingCode.value = sanitizeDigits(value)
}

const greetingLine = computed(() => {
  const name = String(userStore.user?.fullName ?? '').trim()
  if (userStore.user?.isAuthenticated && name) {
    return `שלום, ${name}`
  }
  return 'שלום אורח'
})

async function submitSharingCode() {
  const code = sharingCode.value.trim()
  if (!code) return
  sharingStore.clearGuestLyricsSession()
  formError.value = ''
  submitting.value = true
  try {
    await sharingStore.submitGuestSharingCode(code)
    await router.push({ name: 'guest-words' })
  } catch (err) {
    formError.value = String(err?.message ?? 'אירעה שגיאה')
  } finally {
    submitting.value = false
  }
}

function queryEmitCode() {
  const raw = route.query.emitCode
  const v = Array.isArray(raw) ? raw[0] : raw
  return String(v ?? '').trim()
}

onMounted(async () => {
  const fromQuery = queryEmitCode()
  if (!fromQuery) return
  sharingCode.value = fromQuery
  await nextTick()
  await submitSharingCode()
})
</script>

<template>
  <div class="home-tab">
    <div class="home-tab__inner">
      <h1 class="text-h5 mb-2">{{ greetingLine }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-6">
        כדי לצפות במילות השירים במהלך האירוע, הזינו את קוד השיתוף שקיבלתם מהמארגן. לידיעתכם, הקישור יהיה זמין דקות ספורות לפני תחילת האירוע.
      </p>

      <v-card variant="outlined" class="home-tab__card w-100">
        <v-card-text>
          <v-alert v-if="formError" type="info" variant="tonal" class="mb-4 text-start home-tab__error" border="start" closable @click:close="formError = ''">
            <div class="text-body-1 font-weight-medium">{{ formError }}</div>
            <div class="text-body-2 mt-2 text-medium-emphasis">בדקו את הקוד ונסו שוב.</div>
          </v-alert>

          <v-text-field
            v-model="sharingCode"
            label="קוד שיתוף"
            hint="הדביקו או הקלידו את הקוד שקיבלתם"
            persistent-hint
            variant="outlined"
            density="comfortable"
            dir="ltr"
            hide-details="auto"
            autocomplete="off"
            inputmode="numeric"
            pattern="[0-9]*"
            :disabled="submitting"
            class="home-tab__code-field"
            @update:model-value="onSharingCodeInput"
            @keyup.enter="submitSharingCode"
          />
          <v-btn
            color="primary"
            block
            class="mt-4"
            :disabled="!sharingCode.trim() || submitting"
            :loading="submitting"
            @click="submitSharingCode"
          >
            המשך לצפייה במילים
          </v-btn>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.home-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: min(72vh, 560px);
  box-sizing: border-box;
  padding-block: 24px;
  padding-inline: 16px;
}

.home-tab__inner {
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.home-tab__card {
  border-radius: 12px;
  margin-inline: auto;
}

.home-tab__code-field :deep(input) {
  text-align: start;
}
</style>
