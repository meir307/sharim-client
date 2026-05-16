<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import EventDetailControl from './EventDetailControl.vue'
import EventDetailVoting from './EventDetailVoting.vue'
import EventDetailFeedback from './EventDetailFeedback.vue'

/** Match `.content-wrapper` @media (max-width: 960px) — sidebar hidden, drawer + menu btn */
const NAV_DRAWER_BREAKPOINT = 960

const NAV_ITEMS = [
  { id: 'control', title: 'שליטה ושיתוף', icon: 'mdi-broadcast', component: EventDetailControl },
  { id: 'voting', title: 'תוצאות הצבעה', icon: 'mdi-vote-outline', component: EventDetailVoting },
  { id: 'feedback', title: 'תוצאות משוב', icon: 'mdi-comment-text-outline', component: EventDetailFeedback },
]

const props = defineProps({
  event: { type: Object, default: null },
})

const emit = defineEmits(['back', 'edit-event'])

const display = useDisplay()
const navDrawerOpen = ref(false)
const activeSection = ref('control')

const showNavInDrawer = computed(() => NAV_DRAWER_BREAKPOINT > (display.width?.value ?? 0))

watch(activeSection, () => {
  if (showNavInDrawer.value) {
    navDrawerOpen.value = false
  }
})

const pageTitle = computed(() => {
  const item = NAV_ITEMS.find((n) => n.id === activeSection.value)
  return item?.title ?? 'אירוע'
})

const activeNavItem = computed(() =>
  NAV_ITEMS.find((n) => n.id === activeSection.value) ?? NAV_ITEMS[0],
)

const ev = computed(() => props.event)

function openNavDrawer() {
  navDrawerOpen.value = true
}

function selectSection(id) {
  activeSection.value = id
}

function onBack() {
  emit('back')
}

function onEdit() {
  if (ev.value && typeof ev.value === 'object') {
    emit('edit-event', { ...ev.value })
  }
}
</script>

<template>
  <div class="event-detail">
    <v-navigation-drawer
      v-if="showNavInDrawer"
      v-model="navDrawerOpen"
      temporary
      location="start"
      width="260"
      class="tab-nav-drawer"
    >
      <v-card class="navigation-card tab-nav-drawer-card" elevation="0" variant="flat">
        <v-list class="tab-nav-list py-2" density="comfortable" nav>
          <v-list-item
            v-for="item in NAV_ITEMS"
            :key="item.id"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            :active="activeSection === item.id"
            color="primary"
            class="text-none"
            @click="selectSection(item.id)"
          />
        </v-list>
      </v-card>
    </v-navigation-drawer>

    <div class="event-detail__toolbar">
      <h2 class="event-detail__event-name text-h6 font-weight-bold mb-0">{{ ev?.name }}</h2>
      <v-spacer />
      <v-btn
        color="success"
        variant="flat"
        density="comfortable"
        rounded="lg"
        prepend-icon="mdi-arrow-left"
        class="event-detail__back text-none"
        @click="onBack"
      >
        חזרה לרשימה
      </v-btn>
    </div>

    <div class="content-wrapper content-wrapper--in-detail">
      <!-- RTL (dir=rtl): aside first in row → physical right -->
      <aside class="tab-nav-menu d-none d-md-block">
        <v-card class="navigation-card" elevation="0" variant="flat">
          <v-list class="tab-nav-list py-2" density="comfortable" nav>
            <v-list-item
              v-for="item in NAV_ITEMS"
              :key="item.id"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
              :active="activeSection === item.id"
              color="primary"
              class="text-none"
              @click="selectSection(item.id)"
            />
          </v-list>
        </v-card>
      </aside>

      <div class="content-area">
        <v-card class="modern-card tab-content-card" elevation="0">
          <v-card-title class="modern-title tab-card-title">
            <div class="title-container">
              <v-btn
                v-if="showNavInDrawer"
                class="tab-nav-open"
                icon="mdi-menu"
                variant="text"
                density="comfortable"
                aria-label="תפריט ניווט"
                @click="openNavDrawer"
              />
              <h2 class="title-text">{{ pageTitle }}</h2>
              <v-spacer />
              <div v-if="activeSection === 'control'" class="tab-header-actions">
                <v-btn
                  color="primary"
                  class="add-btn"
                  prepend-icon="mdi-pencil"
                  @click="onEdit"
                >
                  עריכה
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-card-text class="pa-0">
            <component
              :is="activeNavItem.component"
              v-bind="activeSection === 'control' ? { event: ev } : {}"
            />
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-detail {
  width: 100%;
  min-width: 0;
  overflow: visible;
}

.event-detail__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  padding: 4px 4px 8px;
  overflow: visible;
}

.event-detail__event-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-detail__back {
  flex-shrink: 0;
  height: 35px;
}

.event-detail__back :deep(.v-btn__overlay),
.event-detail__back :deep(.v-btn__underlay) {
  border-radius: inherit;
}
</style>
