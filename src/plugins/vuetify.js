import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { he } from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  locale: {
    locale: 'he',
    fallback: 'en',
    messages: { he },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})
