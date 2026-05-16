import { defineStore } from 'pinia'
import { ref } from 'vue'

export const DEFAULT_LANDING_PAGES = [
  {
    id: 1,
    name: 'לפני המופע',
    title: 'המופע יתחיל בקרוב',
    body: 'השארו בדף זה — התוכן יתעדכן אוטומטית.',
    icon: 'mdi-clock-outline',
    showSpinner: true,
  },
  {
    id: 2,
    name: 'סיום / תודה',
    title: 'תודה שהייתם איתנו!',
    body: 'האירוע הסתיים. נתראה בשמחות!',
    icon: 'mdi-heart-outline',
    showSpinner: false,
  },
]

export const useSettingsContentStore = defineStore('settingsContent', () => {
  const landingPages = ref(DEFAULT_LANDING_PAGES.map((p) => ({ ...p })))

  function setLandingPages(pages) {
    landingPages.value = Array.isArray(pages) ? pages.map((p) => ({ ...p })) : []
  }

  function findLandingPage(id) {
    if (id == null) return null
    return landingPages.value.find((p) => String(p.id) === String(id)) ?? null
  }

  return {
    landingPages,
    setLandingPages,
    findLandingPage,
  }
})
