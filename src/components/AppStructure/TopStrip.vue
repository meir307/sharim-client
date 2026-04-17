<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import Login from '@/components/Authentication/Login.vue'
import Register from '@/components/Authentication/Register.vue'
import { useUserStore } from '@/stores/UserStore'

const { mdAndUp } = useDisplay()
const drawer = ref(false)
const loginOpen = ref(false)
const registrationOpen = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isAuthenticated = computed(() => Boolean(userStore.user?.isAuthenticated))
const userFullName = computed(() => userStore.user?.fullName ?? '')

function openLogin() {
  loginOpen.value = true
  drawer.value = false
}

function openRegistration() {
  registrationOpen.value = true
  drawer.value = false
}

function openRegisterFromLogin() {
  loginOpen.value = false
  registrationOpen.value = true
}

function openLoginFromRegister() {
  registrationOpen.value = false
  loginOpen.value = true
}

function onForgotPassword() {
  loginOpen.value = false
  alert('איפוס סיסמה יתווסף בהמשך.')
}

function logout() {
  userStore.logout()
  drawer.value = false
  router.push({ name: 'home' })
}

watch(
  () => route.fullPath,
  () => {
    drawer.value = false
  },
)
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="start" temporary width="280">
    <v-list class="pt-4" nav density="comfortable">
      <v-list-item
        :to="{ name: 'home' }"
        prepend-icon="mdi-home-outline"
        title="בית"
        rounded="lg"
      />
      <template v-if="isAuthenticated">
        <v-list-item
          :to="{ name: 'songs' }"
          prepend-icon="mdi-music-note"
          title="שירים"
          rounded="lg"
        />
        <v-list-item
          :to="{ name: 'events' }"
          prepend-icon="mdi-calendar-star"
          title="אירועים"
          rounded="lg"
        />
      </template>

      <v-divider class="my-3" />

      <template v-if="!isAuthenticated">
        <v-list-item
          prepend-icon="mdi-login"
          title="התחברות"
          rounded="lg"
          @click="openLogin"
        />
        <v-list-item
          prepend-icon="mdi-account-plus-outline"
          title="הרשמה"
          rounded="lg"
          @click="openRegistration"
        />
      </template>
      <v-list-item
        v-else
        prepend-icon="mdi-logout"
        title="התנתק"
        rounded="lg"
        @click="logout"
      />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar color="primary" density="comfortable" elevation="1" class="top-strip position-relative">
    <v-app-bar-nav-icon
      v-if="!mdAndUp"
      aria-label="פתיחת תפריט ניווט"
      @click="drawer = true"
    />

    <v-app-bar-title v-if="mdAndUp" class="top-strip__title">Sharim</v-app-bar-title>

    <v-tabs
      v-if="mdAndUp"
      bg-color="transparent"
      class="top-strip__tabs"
      :class="{ 'top-strip__tabs--guest': !isAuthenticated }"
      color="white"
      height="48"
      slider-color="white"
    >
      <v-tab :to="{ name: 'home' }" text="בית" value="home" />
      <v-tab
        v-if="isAuthenticated"
        :to="{ name: 'songs' }"
        text="שירים"
        value="songs"
      />
      <v-tab
        v-if="isAuthenticated"
        :to="{ name: 'events' }"
        text="אירועים"
        value="events"
      />
    </v-tabs>

    <v-spacer />

    <!-- User section — layout / variants aligned with Memunim TopStrip -->
    <div class="top-strip__user d-flex align-center flex-shrink-0">
      <div v-if="!isAuthenticated" class="d-flex align-center">
        <span class="top-strip__greeting text-white mr-4">שלום אורח</span>
        <v-btn variant="text" color="white" class="mr-2 top-strip__auth-btn" @click="openLogin">
          התחברות
        </v-btn>
        <v-btn variant="outlined" color="white" class="top-strip__auth-btn" @click="openRegistration">
          הרשמה
        </v-btn>
      </div>

      <div v-else class="d-flex align-center">
        <v-avatar size="32" class="top-strip__user-avatar mr-2">
          <v-icon icon="mdi-account" size="small" />
        </v-avatar>
        <span class="top-strip__greeting text-white mr-4">שלום {{ userFullName }}</span>
        <v-btn variant="text" color="white" class="mr-2 top-strip__auth-btn" @click="logout">
          התנתק
        </v-btn>
      </div>
    </div>
  </v-app-bar>

  <v-dialog v-model="loginOpen" max-width="1000" width="90%" persistent>
    <Login
      @btn-close="loginOpen = false"
      @forgot-password="onForgotPassword"
      @open-register="openRegisterFromLogin"
    />
  </v-dialog>

  <v-dialog v-model="registrationOpen" max-width="1000" width="90%" persistent>
    <Register @btn-close="registrationOpen = false" @open-login="openLoginFromRegister" />
  </v-dialog>
</template>

<style scoped>
.top-strip__tabs {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: min(100% - 16rem, 22rem);
}

.top-strip__tabs--guest {
  max-width: min(100% - 16rem, 8rem);
}

/* User strip — Memunim TopStrip–style spacing and controls */
.top-strip__user {
  margin-inline-end: 4px;
}

.top-strip__greeting {
  font-size: 0.9375rem;
  line-height: 1.25;
  white-space: nowrap;
}

.top-strip__auth-btn {
  text-transform: none;
  letter-spacing: normal;
}

.top-strip__user-avatar {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  flex-shrink: 0;
}

.top-strip__user-avatar :deep(.v-icon) {
  color: white;
}
</style>
