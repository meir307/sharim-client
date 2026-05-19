<script setup>
import { computed, onMounted, ref } from 'vue'
import { hasGuestVoted, markGuestVoted } from '@/utils/guestSessionStorage.js'

const props = defineProps({
  sharingParams: { type: Object, required: true },
  sharingCode: { type: String, default: '' },
})

/** @type {import('vue').Ref<'intro' | 'voting'>} */
const step = ref('intro')
const hasVoted = ref(false)
const declined = ref(false)
const submitting = ref(false)
const voteSongs = ref([])

const title = computed(() => String(props.sharingParams?.title ?? '').trim())
const body = computed(() => String(props.sharingParams?.body ?? '').trim())
const maxSelections = computed(() =>
  Math.max(1, Math.min(99, Number(props.sharingParams?.maxSelections) || 1)),
)
const selectedCount = computed(() => voteSongs.value.filter((s) => s.checked).length)

function initSongs() {
  const pl = Array.isArray(props.sharingParams?.playlist) ? props.sharingParams.playlist : []
  voteSongs.value = pl.map((entry, i) => ({
    id: entry?.id ?? i,
    name: String(entry?.songName ?? entry?.name ?? '').trim() || `שיר ${i + 1}`,
    artist: String(entry?.artist ?? entry?.artistName ?? '').trim(),
    checked: false,
  }))
}

function continueToVoting() {
  step.value = 'voting'
}

function onNotInterested() {
  declined.value = true
}

function backToIntro() {
  declined.value = false
  step.value = 'intro'
}

function toggleSong(song) {
  if (hasVoted.value) return
  if (song.checked) {
    song.checked = false
    return
  }
  if (selectedCount.value >= maxSelections.value) return
  song.checked = true
}

function submitVote() {
  if (selectedCount.value === 0 || hasVoted.value) return
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    hasVoted.value = true
    markGuestVoted(props.sharingCode)
  }, 400)
}

onMounted(() => {
  initSongs()
  if (hasGuestVoted(props.sharingCode)) {
    hasVoted.value = true
    return
  }
  step.value = 'intro'
})
</script>

<template>
  <div class="guest-mode-view guest-mode-view--voting mt-4">
    <v-card
      v-if="hasVoted"
      variant="tonal"
      color="success"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="56" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
      <h2 class="text-h6 font-weight-bold mb-2">תודה על ההצבעה!</h2>
      <p class="text-body-2 mb-0">ההצבעה שלך נשמרה. נתראה באירוע!</p>
    </v-card>

    <v-card
      v-else-if="declined"
      variant="tonal"
      color="grey"
      class="guest-mode-view__result-card text-center pa-8"
    >
      <v-icon size="48" color="grey" class="mb-3">mdi-hand-wave-outline</v-icon>
      <h2 class="text-h6 font-weight-medium mb-2">תודה</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">נשמח לראותכם באירוע בכל זאת.</p>
      <v-btn variant="text" color="primary" @click="backToIntro">
        רוצים להצביע? חזרה
      </v-btn>
    </v-card>

    <div v-else-if="step === 'intro'" class="guest-mode-view__intro text-center">
      <h2 v-if="title" class="text-h6 font-weight-medium mb-3">{{ title }}</h2>
      <p
        v-if="body"
        class="text-body-2 text-medium-emphasis mb-4 guest-mode-view__body"
      >
        {{ body }}
      </p>
      <p class="text-body-2 text-medium-emphasis mb-6">
        האם תרצו להצביע על השירים?
      </p>

      <div class="guest-mode-view__intro-actions d-flex flex-column ga-3">
        <v-btn
          color="primary"
          size="large"
          block
          prepend-icon="mdi-vote-outline"
          @click="continueToVoting"
        >
          המשך להצבעה
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          block
          @click="onNotInterested"
        >
          לא מעוניין/ים
        </v-btn>
      </div>
    </div>

    <template v-else-if="step === 'voting'">
      <template v-if="voteSongs.length">
        <p class="text-body-2 text-medium-emphasis text-center mb-4">
          סמנו עד {{ maxSelections }} שירים
        </p>

        <v-card variant="outlined" class="guest-mode-view__list-card">
          <v-list density="comfortable" class="py-0 guest-mode-view__song-list">
            <v-list-item
              v-for="song in voteSongs"
              :key="song.id"
              class="guest-mode-view__list-item"
              @click="toggleSong(song)"
            >
              <template #prepend>
                <v-checkbox-btn
                  v-model="song.checked"
                  color="primary"
                  density="compact"
                  :disabled="!song.checked && selectedCount >= maxSelections"
                  @click.stop
                />
              </template>
              <v-list-item-title
                class="text-body-2 guest-mode-view__song-line"
                :class="{ 'font-weight-medium': song.checked }"
              >
                <span>{{ song.name }}</span>
                <span v-if="song.artist" class="text-medium-emphasis"> · {{ song.artist }}</span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <div class="text-center mt-4">
          <v-btn
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="selectedCount === 0"
            prepend-icon="mdi-send"
            @click="submitVote"
          >
            שלח הצבעה ({{ selectedCount }} שירים)
          </v-btn>
        </div>
      </template>

      <p v-else class="text-body-2 text-medium-emphasis text-center mt-6">
        אין שירים להצבעה.
      </p>
    </template>
  </div>
</template>

<style scoped>
.guest-mode-view__result-card {
  border-radius: 12px;
}

.guest-mode-view__intro {
  padding-top: 8px;
}

.guest-mode-view__intro-actions {
  max-width: 320px;
  margin-inline: auto;
}

.guest-mode-view__list-card {
  border-radius: 12px;
  overflow: hidden;
}

.guest-mode-view__song-list {
  max-height: 14rem;
  overflow-y: auto;
}

.guest-mode-view__list-item {
  cursor: pointer;
}

.guest-mode-view__list-item + .guest-mode-view__list-item {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}

.guest-mode-view__body {
  white-space: pre-wrap;
}

.guest-mode-view__song-line {
  white-space: normal;
  line-height: 1.4;
}
</style>
