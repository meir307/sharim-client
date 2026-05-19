<script setup>
import { computed } from 'vue'

const props = defineProps({
  sharingParams: { type: Object, required: true },
})

const title = computed(() => String(props.sharingParams?.title ?? '').trim() || 'כותרת')
const body = computed(() => String(props.sharingParams?.body ?? '').trim())
const icon = computed(
  () => String(props.sharingParams?.icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline',
)
const showSpinner = computed(() => Boolean(props.sharingParams?.showSpinner))
</script>

<template>
  <div class="guest-mode-view guest-mode-view--landing text-center mt-8">
    <v-icon size="64" color="primary" class="mb-4">{{ icon }}</v-icon>
    <h2 class="text-h6 font-weight-medium mb-2">{{ title }}</h2>
    <p v-if="body" class="text-body-2 text-medium-emphasis guest-mode-view__body">{{ body }}</p>
    <v-progress-linear
      v-if="showSpinner"
      indeterminate
      color="primary"
      class="mt-6 mx-auto"
      style="max-width: 200px"
    />
  </div>
</template>

<style scoped>
.guest-mode-view__body {
  white-space: pre-wrap;
}
</style>
