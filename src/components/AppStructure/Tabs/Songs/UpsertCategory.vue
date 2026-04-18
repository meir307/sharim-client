<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="6">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            {{ isUpdateMode ? 'עדכון קטגוריה' : 'הוספת קטגוריה' }}
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </v-card-title>

          <v-card-text>
            <v-text-field
              v-model="form.name"
              label="שם"
              :rules="[requiredRule]"
              required
            />

            <div class="popup-btn-row">
              <v-btn color="primary" :loading="isSaving" @click="saveCategory">
                {{ isUpdateMode ? 'עדכן' : 'הוסף' }}
              </v-btn>
              <v-btn :disabled="isSaving" @click="closeDialog">סגור</v-btn>
              <v-spacer />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useUserStore } from '@/stores/UserStore'

const props = defineProps({
  showDialog: {
    type: Boolean,
    required: true,
  },
  editCategory: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close-dialog', 'saved'])

const userStore = useUserStore()
const isSaving = ref(false)

const form = reactive({
  id: null,
  name: '',
})

const isUpdateMode = computed(() => form.id != null && form.id !== '')

const requiredRule = (value) => (!!value && String(value).trim().length > 0) || 'שדה חובה'

function isDuplicateCategoryName(trimmed) {
  const cats = Array.isArray(userStore.user?.categories) ? userStore.user.categories : []
  return cats.some((c) => {
    if (String(c.name ?? '').trim() !== trimmed) return false
    if (!isUpdateMode.value) return true
    return String(c.id) !== String(form.id)
  })
}

function applyCategoryToForm(category) {
  form.id = category?.id ?? null
  form.name = category?.name ?? ''
}

watch(
  () => [props.showDialog, props.editCategory],
  ([showDialog]) => {
    if (!showDialog) return
    applyCategoryToForm(props.editCategory)
  },
  { immediate: true, deep: true },
)

function closeDialog() {
  emit('close-dialog')
}

async function saveCategory() {
  if (requiredRule(form.name) !== true) {
    alert('יש להזין שם קטגוריה')
    return
  }

  const trimmed = form.name.trim()
  if (isDuplicateCategoryName(trimmed)) {
    alert('קטגוריה זו כבר קיימת')
    return
  }

  isSaving.value = true
  try {
    const saved = await userStore.upsertCategory({
      id: isUpdateMode.value ? form.id : null,
      name: trimmed,
    })
    if (!saved) return
    emit('saved', saved)
    closeDialog()
  } catch {
    // error surfaced in UserStore
  } finally {
    isSaving.value = false
  }
}
</script>
