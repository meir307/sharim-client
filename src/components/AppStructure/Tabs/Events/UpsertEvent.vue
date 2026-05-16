<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'

const props = defineProps({
  editEvent: { type: Object, default: null },
})

const emit = defineEmits(['close-dialog', 'saved'])

const nameFieldRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  date: '',
  playlistName: '',
})

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const requiredRule = (v) => (!!v && String(v).trim().length > 0) || 'שדה חובה'

function applyEventToForm(event) {
  if (!event || typeof event !== 'object') {
    form.id = null
    form.name = ''
    form.date = ''
    form.playlistName = ''
    return
  }
  form.id = event.id ?? null
  form.name = event.name ?? ''
  form.date = event.date ?? ''
  form.playlistName = event.playlistName ?? ''
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
  return {
    id: form.id,
    name: String(form.name).trim(),
    date: form.date || '',
    playlistName: String(form.playlistName).trim(),
  }
}

function save() {
  if (requiredRule(form.name) !== true) {
    alert('יש להזין שם אירוע')
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
            v-model="form.playlistName"
            label="פלייליסט"
            density="comfortable"
            hide-details="auto"
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
