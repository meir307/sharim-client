<script setup>
import { useDisplay } from 'vuetify'
import TopStrip from '@/components/AppStructure/TopStrip.vue'

const { mdAndUp } = useDisplay()
</script>

<template>
  <v-app dir="rtl">
    <TopStrip />
    <v-main>
      <v-container
        class="app-main__container"
        :fluid="!mdAndUp"
        :class="{ 'px-3 px-sm-4': !mdAndUp }"
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
</style>
