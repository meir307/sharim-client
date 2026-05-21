<script setup>
import { computed } from 'vue'
import GoogleDocLinkPane from '@/components/AppStructure/Tabs/Songs/GoogleDocLinkPane.vue'
import { eventNameFromSharingParams } from '@/utils/eventSharingModel.js'

const props = defineProps({
  sharingParams: { type: Object, required: true },
})

const eventName = computed(
  () => eventNameFromSharingParams(props.sharingParams) || 'אירוע',
)

const playlistName = computed(() => String(props.sharingParams?.playlistName ?? '').trim())

const activeLink = computed(() =>
  String(props.sharingParams?.activeLink ?? props.sharingParams?.ActiveLink ?? '').trim(),
)

const hasActiveLink = computed(() => activeLink.value.length > 0)

const paneTitle = computed(() => playlistName.value || 'מילות שיר')
</script>

<template>
  <div class="guest-lyrics-layout">
    <header class="guest-lyrics-layout__bar">
      <h2 class="guest-lyrics-layout__event-name font-weight-bold">
        {{ eventName }}
      </h2>
      <v-chip
        color="success"
        variant="tonal"
        prepend-icon="mdi-broadcast"
        class="guest-lyrics-layout__chip flex-shrink-0"
      >
        שידור חי
      </v-chip>
    </header>

    <div class="guest-lyrics-layout__content">
      <GoogleDocLinkPane v-if="hasActiveLink" :link-url="activeLink" :title="paneTitle" />
      <div v-else class="guest-lyrics-layout__waiting text-center">
        <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-text-box-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis mb-0">ממתין לשיר מהמנחה…</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guest-lyrics-layout {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  margin: 0;
  padding: 0;
}

.guest-lyrics-layout__bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  direction: rtl;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.guest-lyrics-layout__event-name {
  margin: 0;
  padding: 0;
  padding-right: 10px;
  min-width: 0;
  font-size: 1.5rem;
  line-height: 1.35;
  color: #fff;
  text-align: right;
  flex: 1 1 auto;
}

.guest-lyrics-layout__bar :deep(.v-chip) {
  height: auto;
  min-height: 0;
  font-size: 1.125rem;
  padding-inline: 14px;
}

.guest-lyrics-layout__bar :deep(.v-chip__prepend .v-icon) {
  font-size: 24px;
}

.guest-lyrics-layout__chip {
  margin: 0;
}

.guest-lyrics-layout__content {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
}

.guest-lyrics-layout__waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: min(60dvh, 400px);
  margin: 0;
  padding: 0;
}
</style>
