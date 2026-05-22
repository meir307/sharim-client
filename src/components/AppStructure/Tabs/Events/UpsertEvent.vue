<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { toDateInputValue } from '@/utils/dateInputValue.js'

const props = defineProps({
  editEvent: { type: Object, default: null },
})

const emit = defineEmits(['close-dialog', 'saved'])

const nameFieldRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  date: '',
  description: '',
  crowdSize: '',
})

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const requiredRule = (v) => (!!v && String(v).trim().length > 0) || 'שדה חובה'

const crowdSizeRule = (v) => {
  if (v == null || String(v).trim() === '') return true
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return 'יש להזין מספר שלם חיובי'
  }
  return true
}

function applyEventToForm(event) {
  if (!event || typeof event !== 'object') {
    form.id = null
    form.name = ''
    form.date = ''
    form.description = ''
    form.crowdSize = ''
    return
  }
  form.id = event.id ?? null
  form.name = event.name ?? ''
  form.date = toDateInputValue(event.date ?? event.Date)
  form.description = event.description ?? event.playlistName ?? ''
  const rawCrowd = event.crowdSize ?? event.CrowdSize
  form.crowdSize =
    rawCrowd != null && String(rawCrowd).trim() !== '' ? String(rawCrowd) : ''
}

watch(
  () => props.editEvent,
  async () => {
    applyEventToForm(props.editEvent)
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
  const crowdRaw = String(form.crowdSize ?? '').trim()
  let crowdSize = null
  if (crowdRaw !== '') {
    const n = Number(crowdRaw)
    if (Number.isFinite(n) && n >= 0) crowdSize = Math.floor(n)
  }
  return {
    id: form.id,
    name: String(form.name).trim(),
    date: form.date || '',
    description: String(form.description).trim(),
    crowdSize,
  }
}

function save() {
  if (requiredRule(form.name) !== true) {
    alert('יש להזין שם אירוע')
    return
  }
  if (crowdSizeRule(form.crowdSize) !== true) {
    alert('משתתפים בארוע לא תקין')
    return
  }
  emit('saved', buildPayload())
}
</script>

<template>
  <v-card class="upsert-event">
    <v-card-title class="popup-title d-flex align-center justify-space-between">
      {{ isUpdateMode ? 'עריכת אירוע' : 'אירוע חדש' }}
      <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="closeDialog" />
    </v-card-title>

    <v-card-text class="pt-2">
      <div class="text-subtitle-2 text-medium-emphasis mb-2">פרטי אירוע</div>
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            ref="nameFieldRef"
            v-model="form.name"
            label="שם האירוע"
            density="comfortable"
            hide-details="auto"
            :rules="[requiredRule]"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.date"
            label="תאריך"
            type="date"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.crowdSize"
            label="משתתפים בארוע"
            type="number"
            min="0"
            step="1"
            density="comfortable"
            hide-details="auto"
            :rules="[crowdSizeRule]"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.description"
            label="תיאור"
            density="comfortable"
            hide-details="auto"
            rows="2"
            auto-grow
          />
        </v-col>
      </v-row>

      <div class="popup-btn-row mt-4">
        <v-btn color="primary" @click="save">
          {{ isUpdateMode ? 'עדכן' : 'צור אירוע' }}
        </v-btn>
        <v-btn @click="closeDialog">סגור</v-btn>
        <v-spacer />
      </div>
    </v-card-text>
  </v-card>
</template>
