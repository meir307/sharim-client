<script setup>
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'
import { buildLyricsSharingParams, playlistDisplayName } from '@/utils/eventSharingModel.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'activate'])

const userStore = useUserStore()
const selectedPlaylistKey = ref(null)

const playlists = computed(() => {
  const raw = userStore.user?.playLists
  return Array.isArray(raw) ? raw : []
})

function playlistStableKey(playlist, index) {
  const id = playlist?.id ?? playlist?.Id
  if (id != null && String(id).trim() !== '') return String(id).trim()
  return `i:${index}`
}

const playlistOptions = computed(() =>
  playlists.value.map((pl, index) => ({
    title: playlistDisplayName(pl) || '(ללא שם)',
    value: playlistStableKey(pl, index),
  })),
)

const selectedPlaylist = computed(() => {
  if (selectedPlaylistKey.value == null) return null
  const idx = playlists.value.findIndex(
    (p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value),
  )
  return idx >= 0 ? playlists.value[idx] : null
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    if (playlists.value.length && selectedPlaylistKey.value == null) {
      selectedPlaylistKey.value = playlistStableKey(playlists.value[0], 0)
    }
  },
)

watch(playlists, (list) => {
  if (!list.length) {
    selectedPlaylistKey.value = null
    return
  }
  if (
    selectedPlaylistKey.value == null ||
    list.findIndex((p, i) => playlistStableKey(p, i) === String(selectedPlaylistKey.value)) < 0
  ) {
    selectedPlaylistKey.value = playlistStableKey(list[0], 0)
  }
})

function close() {
  emit('update:modelValue', false)
}

function onActivate() {
  try {
    const pl = selectedPlaylist.value
    if (!pl) {
      throw new Error('יש לבחור פלייליסט')
    }
    const sharingParams = buildLyricsSharingParams(playlistDisplayName(pl), {
      playlist: pl,
      songs: userStore.songs,
    })
    emit('activate', {
      playlist: { ...pl },
      sharingParams,
    })
    close()
  } catch (err) {
    alert(err?.message ?? String(err))
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    width="92%"
    scrollable
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        <span class="d-flex align-center ga-2">
          <v-icon icon="mdi-text-box-outline" color="success" />
          הפעלת מילות שיר
        </span>
        <v-btn icon="mdi-close" variant="text" aria-label="סגור" @click="close" />
      </v-card-title>

      <v-card-text class="pt-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          הקהל יראו את השיר הנוכחי ומילותיו — שידור חי. לאחר ההפעלה ייפתח מסך הצגת השיר לניהול השיר הנוכחי.
        </p>

        <div class="text-center mb-4">
          <v-chip color="success" variant="tonal" prepend-icon="mdi-broadcast" size="small">
            שידור חי
          </v-chip>
        </div>

        <v-select
          v-model="selectedPlaylistKey"
          label="פלייליסט"
          :items="playlistOptions"
          item-title="title"
          item-value="value"
          density="comfortable"
          hide-details="auto"
          :disabled="!playlistOptions.length"
          class="mb-4"
        />
        <p v-if="!playlistOptions.length" class="text-caption text-warning mb-4">
          אין פלייליסטים — הוסף בלשונית פלייליסטים.
        </p>

        <div class="popup-btn-row mt-4">
          <v-btn color="success" :disabled="!selectedPlaylist" @click="onActivate">הפעל</v-btn>
          <v-btn @click="close">ביטול</v-btn>
          <v-spacer />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
