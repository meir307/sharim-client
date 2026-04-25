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
      name: 'playlists',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Playlists/PlaylistsTab.vue'),
    },
    {
      path: '/sharing',
      name: 'sharing',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Sharing/SharingMain.vue'),
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
