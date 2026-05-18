import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/UserStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'home' } },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/components/AppStructure/Tabs/Home/HomeTab.vue'),
    },
    {
      path: '/guest/view',
      name: 'guest-words',
      meta: { requiresAuth: false, guestFullscreen: true },
      component: () => import('@/components/AppStructure/Tabs/Home/GuestWordsView.vue'),
    },
    {
      path: '/guest',
      name: 'guest-event-query',
      meta: { requiresAuth: false, guestFullscreen: true },
      component: () => import('@/components/AppStructure/Tabs/Guest/GuestEventPage.vue'),
    },
    {
      path: '/guest/:emitCode',
      name: 'guest-words-by-code',
      meta: { requiresAuth: false, guestFullscreen: true },
      component: () => import('@/components/AppStructure/Tabs/Home/GuestWordsView.vue'),
    },
    {
      path: '/songs',
      name: 'songs',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Songs/SongsMain.vue'),
    },
    {
      path: '/playlists',
      redirect: { name: 'settings' },
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Settings/SettingsTab.vue'),
    },
    {
      path: '/events',
      name: 'events',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Events/EventsTab.vue'),
    },
    {
      path: '/sharing',
      name: 'sharing',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Sharing/SharingMain.vue'),
    },
    {
      path: '/guest/event/:shareCode',
      name: 'guest-event',
      meta: { requiresAuth: false, guestFullscreen: true },
      component: () => import('@/components/AppStructure/Tabs/Guest/GuestEventPage.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.name === 'home' && userStore.user?.isAuthenticated) {
    return { name: 'songs', replace: true }
  }
  if (!to.meta.requiresAuth) return true
  if (userStore.user?.isAuthenticated) return true
  return { name: 'home', replace: true }
})

export default router
