<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import TopStrip from '@/components/AppStructure/TopStrip.vue'

const route = useRoute()
const { mdAndUp } = useDisplay()

/** Guest lyrics: full viewport, no app bar (see route `meta.guestFullscreen`). */
const guestFullscreen = computed(() => Boolean(route.meta?.guestFullscreen))
</script>

<template>
  <v-app dir="rtl" :class="{ 'app--guest-fullscreen': guestFullscreen }">
    <TopStrip v-if="!guestFullscreen" />
    <v-main class="app-main" :class="{ 'app-main--guest-fullscreen': guestFullscreen }">
      <v-container
        class="app-main__container"
        :fluid="guestFullscreen || !mdAndUp"
        :class="{
          'app-main__container--guest': guestFullscreen,
          'px-3 px-sm-4': !guestFullscreen && !mdAndUp,
        }"
      >
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-main__container {
  max-width: 1280px;
}

.app-main--guest-fullscreen {
  min-height: 100vh;
  padding-top: 0 !important;
}

.app-main__container--guest {
  max-width: none !important;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}
</style>
