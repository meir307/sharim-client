<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="6">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            {{ isUpdateMode ? 'עדכון אמן' : 'הוספת אמן' }}
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="form.name"
              label="שם"
              :rules="[requiredRule]"
              required
            />

            <div class="popup-btn-row">
              <v-btn color="primary" :loading="isSaving" @click="saveArtist">
                {{ isUpdateMode ? 'עדכן' : 'הוסף' }}
              </v-btn>
              <v-btn :disabled="isSaving" @click="closeDialog">סגור</v-btn>
              <v-spacer />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'

const props = defineProps({
  showDialog: {
    type: Boolean,
    required: true,
  },
  editArtist: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close-dialog', 'saved'])

const userStore = useUserStore()
const isSaving = ref(false)

const form = reactive({
  id: null,
  name: '',
})

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

function applyArtistToForm(artist) {
  form.id = artist?.id ?? null
  form.name = artist?.name ?? ''
}

watch(
  () => [props.showDialog, props.editArtist],
  ([showDialog]) => {
    if (!showDialog) return
    applyArtistToForm(props.editArtist)
  },
  { immediate: true, deep: true },
)

function closeDialog() {
  emit('close-dialog')
}

async function saveArtist() {
  if (requiredRule(form.name) !== true) {
    alert('יש להזין שם אמן')
    return
  }

  isSaving.value = true
  try {
    const saved = await userStore.upsertArtist({
      id: isUpdateMode.value ? form.id : null,
      name: form.name.trim(),
    })
    if (!saved) return
    emit('saved', saved)
    closeDialog()
  } catch {
    // error surfaced in UserStore
  } finally {
    isSaving.value = false
  }
}
</script>
