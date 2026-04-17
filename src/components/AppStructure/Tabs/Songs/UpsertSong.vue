<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            {{ isUpdateMode ? 'עדכון שיר' : 'הוספת שיר' }}
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </v-card-title>

          <v-card-text >
            <v-text-field
              v-model="form.name"
              label="שם"
              :rules="[requiredRule]"
              required
            />

            <v-row dense class="mt-0">
              <v-col cols="4">
                <v-text-field
                  v-model="form.category"
                  label="קטגוריה"
                  density="compact"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="form.artist"
                  label="אמן"
                  density="compact"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="form.language"
                  label="שפה"
                  density="compact"
                  hide-details="auto"
                />
              </v-col>
            </v-row>

            <v-text-field
              class="mt-4"
              v-model="form.url"
              label="URL"
              :rules="[requiredRule]"
              required
            />

            <v-textarea
              v-model="cordsText"
              label="cords (JSON)"
              :rows="4"
              auto-grow
              :error-messages="cordsError ? [cordsError] : []"
              placeholder='{"x": 1, "y": 2}'
            />

            <div class="popup-btn-row">
              <v-btn color="primary" :loading="isSaving" @click="saveSong">
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
  editSong: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close-dialog', 'saved'])

const userStore = useUserStore()
const isSaving = ref(false)
const cordsText = ref('{}')
const cordsError = ref('')

const form = reactive({
  id: null,
  name: '',
  category: '',
  artist: '',
  language: '',
  url: '',
})

const isUpdateMode = computed(() => Boolean(form.id))

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

function applySongToForm(song) {
  form.id = song?.id ?? null
  form.name = song?.name ?? ''
  form.category = song?.category ?? ''
  form.artist = song?.artist ?? ''
  form.language = song?.language ?? ''
  form.url = song?.url ?? ''
  cordsText.value = typeof song?.cords === 'string' ? song.cords : JSON.stringify(song?.cords ?? {}, null, 2)
  cordsError.value = ''
}

watch(
  () => [props.showDialog, props.editSong],
  ([showDialog]) => {
    if (!showDialog) return
    applySongToForm(props.editSong)
  },
  { immediate: true, deep: true },
)

function parseCordsJson() {
  try {
    cordsError.value = ''
    return JSON.parse(cordsText.value || '{}')
  } catch {
    cordsError.value = 'JSON לא תקין בשדה cords'
    return null
  }
}

function closeDialog() {
  emit('close-dialog')
}

async function saveSong() {
  const isValid =
    requiredRule(form.name) === true &&
    requiredRule(form.url) === true

  if (!isValid) {
    alert('יש למלא את כל השדות הנדרשים')
    return;
  }//test dfd

  const parsedCords = parseCordsJson()
  if (!parsedCords) return

  const payload = {
    name: form.name.trim(),
    category: form.category.trim(),
    artist: form.artist.trim(),
    language: form.language.trim(),
    url: form.url.trim(),
    cords: parsedCords,
  }

  if (isUpdateMode.value) {
    payload.id = form.id
  }

  try {
    isSaving.value = true
    const response = await userStore.upsertSong(payload)
    const savedSong = response?.data?.song ?? { ...payload }
    emit('saved', savedSong)
    closeDialog()
  } catch (error) {
    console.error('Failed to save song:', error)
  } finally {
    isSaving.value = false
  }
}
</script>
