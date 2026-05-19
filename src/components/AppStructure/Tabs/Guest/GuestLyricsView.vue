<script setup>
import { computed } from 'vue'

const props = defineProps({
  sharingParams: { type: Object, required: true },
})

const playlistName = computed(() => String(props.sharingParams?.playlistName ?? '').trim())
</script>

<template>
  <div class="guest-mode-view guest-mode-view--lyrics mt-4">
    <div class="text-center mb-4">
      <v-chip color="success" variant="tonal" prepend-icon="mdi-broadcast" size="small">
        שידור חי
      </v-chip>
      <h2 v-if="playlistName" class="text-subtitle-1 font-weight-medium mt-2">
        {{ playlistName }}
      </h2>
    </div>
    <v-card variant="outlined" class="guest-mode-view__lyrics-card">
      <div class="guest-mode-view__lyrics-placeholder text-center pa-12">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-text-box-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis mb-0">כאן יוצגו מילות השיר</p>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.guest-mode-view__lyrics-card {
  border-radius: 12px;
  min-height: 300px;
}

.guest-mode-view__lyrics-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>
