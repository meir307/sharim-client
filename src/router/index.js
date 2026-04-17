import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/UserStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'home' } },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/components/AppStructure/Tabs/HomeTab.vue'),
    },
    {
      path: '/songs',
      name: 'songs',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Songs/SongsMain.vue'),
    },
    {
      path: '/events',
      name: 'events',
      meta: { requiresAuth: true },
      component: () => import('@/components/AppStructure/Tabs/Events/EventsMain.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true
  const userStore = useUserStore()
  if (userStore.user?.isAuthenticated) return true
  return { name: 'home', replace: true }
})

export default router
