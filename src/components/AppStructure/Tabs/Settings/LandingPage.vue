<script setup>
import { landingPageDisplayName } from './landingPageModel.js'

const pages = defineModel({
  type: Array,
  default: () => [],
})

defineProps({
  emptyText: {
    type: String,
    default: 'אין דפי נחיתה. לחץ על "הוסף דף נחיתה" למעלה.',
  },
})

const emit = defineEmits(['edit-landing-page'])

function onEdit(page) {
  emit('edit-landing-page', page && typeof page === 'object' ? { ...page } : null)
}

function onDelete(page, index) {
  const name = landingPageDisplayName(page)
  if (!window.confirm(`למחוק את "${name}"?`)) return
  const list = Array.isArray(pages.value) ? [...pages.value] : []
  list.splice(index, 1)
  pages.value = list
}
</script>

<template>
  <div class="landing-page-list">
    <div v-if="!pages?.length" class="no-data">
      {{ emptyText }}
    </div>

    <v-card v-else variant="outlined" class="landing-page-list__card">
      <v-list density="comfortable" class="py-0">
        <v-list-item
          v-for="(page, index) in pages"
          :key="page.id ?? index"
          class="landing-page-list__item"
          rounded="lg"
        >
          <template #prepend>
            <v-avatar variant="tonal" color="primary" size="40">
              <v-icon :icon="page.icon || 'mdi-web'" />
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ landingPageDisplayName(page) }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-medium-emphasis">
            {{ page.title || '—' }}
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="page.body" class="text-caption landing-page-list__body-preview">
            {{ page.body }}
          </v-list-item-subtitle>

          <template #append>
            <div class="landing-page-list__actions">
              <v-chip
                v-if="page.showSpinner"
                size="x-small"
                variant="tonal"
                color="primary"
                class="me-1"
              >
                ממתין
              </v-chip>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                density="comfortable"
                color="primary"
                aria-label="ערוך דף נחיתה"
                @click="onEdit(page)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                density="comfortable"
                color="error"
                aria-label="מחק דף נחיתה"
                @click="onDelete(page, index)"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<style scoped>
.landing-page-list {
  width: 100%;
  min-width: 0;
}

.landing-page-list__card {
  border-radius: 8px;
}

.landing-page-list__item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.landing-page-list__item:last-child {
  border-bottom: none;
}

.landing-page-list__body-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.landing-page-list__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>
