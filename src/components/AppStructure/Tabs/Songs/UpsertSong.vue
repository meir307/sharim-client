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
              ref="nameFieldRef"
              v-model="form.name"
              label="שם"
              :rules="[requiredRule]"
              required
            />

            <v-row dense class="mt-0 align-start">
              <v-col cols="6" class="min-width-0">
                <div class="select-with-button">
                  <v-select
                    v-model="form.category"
                    :items="categorySelectItems"
                    label="קטגוריה"
                    density="compact"
                    hide-details="auto"
                    item-title="title"
                    item-value="value"
                    class="select-field"
                    no-data-text="לא הוגדרו קטגוריות"
                  />
                  <v-btn
                    icon="mdi-plus-circle-outline"
                    variant="flat"
                    size="small"
                    class="select-button"
                    color="success"
                    aria-label="הוסף קטגוריה חדשה"
                    @click="openCategoryDialog"
                  />
                </div>
              </v-col>
              <v-col cols="6" class="min-width-0">
                <div class="select-with-button">
                  <v-select
                    v-model="form.artist"
                    :items="artistSelectItems"
                    label="אמן"
                    density="compact"
                    hide-details="auto"
                    item-title="title"
                    item-value="value"
                    class="select-field"
                    no-data-text="לא הוגדרו אמנים"
                  />
                  <v-btn
                    icon="mdi-plus-circle-outline"
                    variant="flat"
                    size="small"
                    class="select-button"
                    color="success"
                    aria-label="הוסף אמן חדש"
                    @click="openArtistDialog"
                  />
                </div>
              </v-col>
            </v-row>

            <v-text-field
              class="mt-4"
              v-model="form.url"
              label="קישור לשיר"
              :rules="[requiredRule]"
              required
            />

            <v-textarea
              v-model="form.cordsText"
              label="אקורדים"
              :rows="4"
              :max-rows="6"
              auto-grow
              :error-messages="cordsError ? [cordsError] : []"
            />

            <v-file-input
              class="mt-2"
              v-model="cordsFile"
              label="טעינת אקורדים מקובץ"
              accept=".txt,.json,.jpg,.jpeg,.pdf,text/plain,application/json,image/jpeg,application/pdf"
              prepend-icon="mdi-file-upload-outline"
              density="compact"
              hide-details="auto"
              clearable
              @update:model-value="onCordsFileModelUpdate"
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

  <v-dialog v-model="showAddCategoryDialog" max-width="640" width="90%" persistent>
    <UpsertCategory
      :show-dialog="showAddCategoryDialog"
      :edit-category="null"
      @close-dialog="closeCategoryDialog"
    />
  </v-dialog>

  <v-dialog v-model="showAddArtistDialog" max-width="640" width="90%" persistent>
    <UpsertArtist
      :show-dialog="showAddArtistDialog"
      :edit-artist="null"
      @close-dialog="closeArtistDialog"
    />
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, toRaw, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import UpsertCategory from './UpsertCategory.vue'
import UpsertArtist from './UpsertArtist.vue'

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
const nameFieldRef = ref(null)
const cordsError = ref('')
const cordsFile = ref(null)
/** Server-side attachment when editing; kept unless replaced or cleared. */
const persistedCordsFile = ref(null)
const cordsFileCleared = ref(false)
const hadTransientCordsFilePick = ref(false)
const skipCordsFileModelSync = ref(false)

const form = reactive({
  id: null,
  name: '',
  category: '',
  artist: '',
  language: '',
  url: '',
  /** Text for `cords.cordsText` in the API payload */
  cordsText: '',
})

const isUpdateMode = computed(() => Boolean(form.id))

const showAddCategoryDialog = ref(false)
const previousCategoryCount = ref(0)

const categoryOptions = computed(() => {
  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  return cats
    .filter((c) => c?.name != null && String(c.name).trim() !== '')
    .map((c) => ({ title: String(c.name).trim(), value: String(c.name).trim() }))
    .sort((a, b) => a.title.localeCompare(b.title, 'he'))
})

/** Include current song category in items when it is not yet in the user list (Memunim-style resilience). */
const categorySelectItems = computed(() => {
  const base = categoryOptions.value
  const cur = String(form.category ?? '').trim()
  if (!cur) return base
  if (base.some((i) => i.value === cur)) return base
  return [...base, { title: cur, value: cur }].sort((a, b) => a.title.localeCompare(b.title, 'he'))
})

function openCategoryDialog() {
  previousCategoryCount.value = Array.isArray(userStore.user?.categories)
    ? userStore.user.categories.length
    : 0
  showAddCategoryDialog.value = true
}

function pickNewestCategoryById() {
  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  if (!cats.length) return null
  return cats.reduce((max, c) => (Number(c?.id) > Number(max?.id) ? c : max), cats[0])
}

function closeCategoryDialog() {
  showAddCategoryDialog.value = false
  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  if (cats.length > previousCategoryCount.value) {
    const newest = pickNewestCategoryById()
    if (newest?.name) {
      form.category = String(newest.name).trim()
    }
  }
  previousCategoryCount.value = cats.length
}

const showAddArtistDialog = ref(false)
const previousArtistCount = ref(0)

const artistOptions = computed(() => {
  const list = Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
  return list
    .filter((a) => a?.name != null && String(a.name).trim() !== '')
    .map((a) => ({ title: String(a.name).trim(), value: String(a.name).trim() }))
    .sort((a, b) => a.title.localeCompare(b.title, 'he'))
})

const artistSelectItems = computed(() => {
  const base = artistOptions.value
  const cur = String(form.artist ?? '').trim()
  if (!cur) return base
  if (base.some((i) => i.value === cur)) return base
  return [...base, { title: cur, value: cur }].sort((a, b) => a.title.localeCompare(b.title, 'he'))
})

function openArtistDialog() {
  previousArtistCount.value = Array.isArray(userStore.user?.artists) ? userStore.user.artists.length : 0
  showAddArtistDialog.value = true
}

function pickNewestArtistById() {
  const list = Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
  if (!list.length) return null
  return list.reduce((max, a) => (Number(a?.id) > Number(max?.id) ? a : max), list[0])
}

function closeArtistDialog() {
  showAddArtistDialog.value = false
  const list = Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
  if (list.length > previousArtistCount.value) {
    const newest = pickNewestArtistById()
    if (newest?.name) {
      form.artist = String(newest.name).trim()
    }
  }
  previousArtistCount.value = list.length
}

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

/** String for the textarea from stored `cords` (new shape, legacy object, or string). */
function cordsTextFromSong(cords) {
  if (cords == null || cords === '') return ''
  if (typeof cords === 'string') return cords
  if (typeof cords === 'object' && cords !== null && 'cordsText' in cords) {
    return String(cords.cordsText ?? '')
  }
  try {
    return JSON.stringify(cords)
  } catch {
    return ''
  }
}

function persistedFileFromSongCords(cords) {
  if (cords && typeof cords === 'object' && 'cordsFile' in cords) {
    return cords.cordsFile ?? null
  }
  return null
}

function firstPickedFile(val) {
  if (val == null) return null
  const f = Array.isArray(val) ? val[0] : val
  return f instanceof File ? f : null
}

function onCordsFileModelUpdate(val) {
  if (skipCordsFileModelSync.value) return
  if (firstPickedFile(val)) {
    cordsFileCleared.value = false
    hadTransientCordsFilePick.value = true
    return
  }
  if (hadTransientCordsFilePick.value) {
    hadTransientCordsFilePick.value = false
    return
  }
  if (persistedCordsFile.value) {
    cordsFileCleared.value = true
  }
}

function displayLabelForListField(stored, list) {
  if (stored == null || stored === '') return ''
  const s = String(stored).trim()
  if (!Array.isArray(list) || list.length === 0) return s
  if (/^\d+$/.test(s)) {
    const row = list.find((x) => String(x?.id) === s)
    return row?.name != null ? String(row.name).trim() : s
  }
  return s
}

/** Resolve a select value (name or id string) to the list row's `id` for the API. */
function idFromListSelection(stored, list) {
  if (stored == null || stored === '') return null
  const s = String(stored).trim()
  if (!Array.isArray(list) || list.length === 0) return null
  if (/^\d+$/.test(s)) {
    const row = list.find((x) => String(x?.id) === s)
    return row != null ? row.id : Number(s)
  }
  const row = list.find((x) => String(x?.name ?? '').trim() === s)
  return row?.id ?? null
}

/** First non-empty string among alternate API field names (e.g. C# `Name`). */
function firstDefinedString(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    if (!(k in obj)) continue
    const v = obj[k]
    if (v != null && String(v).trim() !== '') {
      return String(v).trim()
    }
  }
  return ''
}

function applySongToForm(song) {
  const raw = song && typeof song === 'object' ? toRaw(song) : song
  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  const arts = Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
  form.id = raw?.id ?? null
  form.name = firstDefinedString(raw, ['name', 'Name', 'title', 'Title', 'songName', 'SongName'])
  form.category = displayLabelForListField(raw?.category, cats)
  form.artist = displayLabelForListField(raw?.artist, arts)
  form.language = raw?.language ?? ''
  form.url = firstDefinedString(raw, ['url', 'Url', 'link', 'Link'])
  const cords = raw?.cords
  form.cordsText = cordsTextFromSong(cords)
  persistedCordsFile.value = persistedFileFromSongCords(cords)
  cordsFileCleared.value = false
  hadTransientCordsFilePick.value = false
  cordsError.value = ''
  skipCordsFileModelSync.value = true
  cordsFile.value = null
  nextTick(() => {
    skipCordsFileModelSync.value = false
  })
}

watch(
  [() => props.showDialog, () => props.editSong],
  async ([open]) => {
    if (!open) return
    await nextTick()
    applySongToForm(props.editSong)
    await nextTick()
    const el = nameFieldRef.value
    if (typeof el?.focus === 'function') {
      el.focus()
    } else if (el?.$el) {
      el.$el.querySelector?.('input')?.focus()
    }
  },
  { flush: 'post', immediate: true },
)

function closeDialog() {
  emit('close-dialog')
}

async function saveSong() {
  const nameKeys = ['name', 'Name', 'title', 'Title', 'songName', 'SongName']
  const urlKeys = ['url', 'Url', 'link', 'Link']
  const fallbackSong =
    props.editSong && typeof props.editSong === 'object' ? toRaw(props.editSong) : props.editSong

  const nameTrim =
    String(form.name ?? '').trim() || firstDefinedString(fallbackSong, nameKeys)
  const urlTrim =
    String(form.url ?? '').trim() || firstDefinedString(fallbackSong, urlKeys)

  const isValid =
    requiredRule(nameTrim) === true &&
    requiredRule(urlTrim) === true

  if (!isValid) {
    alert('יש למלא את כל השדות הנדרשים')
    return
  }

  cordsError.value = ''
  const picked = firstPickedFile(cordsFile.value)
  let cordsFilePayload = null
  if (picked) {
    cordsFilePayload = null
  } else if (cordsFileCleared.value) {
    cordsFilePayload = null
  } else if (isUpdateMode.value) {
    cordsFilePayload = persistedCordsFile.value
  }

  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  const arts = Array.isArray(userStore.user?.artists) ? userStore.user.artists : []
  const categoryId =
    idFromListSelection(form.category, cats) ?? idFromListSelection(fallbackSong?.category, cats)
  const artistId =
    idFromListSelection(form.artist, arts) ?? idFromListSelection(fallbackSong?.artist, arts)

  const payload = {
    name: nameTrim,
    category: categoryId,
    artist: artistId,
    language: String(form.language ?? '').trim(),
    url: urlTrim,
    cords: {
      cordsText: String(form.cordsText ?? ''),
      cordsFile: cordsFilePayload,
    },
  }

  if (isUpdateMode.value) {
    payload.id = form.id
  }

  if (picked) {
    payload.__cordsFileUpload = picked
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
