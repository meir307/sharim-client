<script setup>
import { ref } from 'vue'

defineProps({
  showDialog: { type: Boolean, required: true },
  editEvent: { type: Object, default: null },
})

const emit = defineEmits(['close-dialog', 'saved'])

const eventName = ref('')
const eventDate = ref('')

const requiredRule = (v) => (!!v && String(v).trim().length > 0) || 'שדה חובה'

function closeDialog() {
  emit('close-dialog')
}

function save() {
  emit('saved')
}
</script>

<template>
  <v-container class="upsert-event pa-2">
    <v-row justify="center">
      <v-col cols="12">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            {{ editEvent ? 'עריכת אירוע' : 'אירוע חדש' }}
            <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
          </v-card-title>

          <v-card-text class="pt-2">
            <!-- Basic info -->
            <div class="text-subtitle-2 text-medium-emphasis mb-2">פרטי אירוע</div>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="eventName"
                  label="שם האירוע"
                  density="comfortable"
                  hide-details="auto"
                  :rules="[requiredRule]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="eventDate"
                  label="תאריך"
                  type="date"
                  density="comfortable"
                  hide-details="auto"
                />
              </v-col>
            </v-row>

            <!-- Actions -->
            <div class="popup-btn-row mt-4">
              <v-btn color="primary" @click="save">
                {{ editEvent ? 'עדכן' : 'צור אירוע' }}
              </v-btn>
              <v-btn @click="closeDialog">סגור</v-btn>
              <v-spacer />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
