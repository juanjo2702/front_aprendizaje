<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="mini-profile-dialog" data-cy="mini-profile-dialog">
      <q-card-section class="row items-start justify-between">
        <div>
          <div class="text-overline text-secondary">Mini perfil público</div>
          <div class="text-caption text-grey-5">Vista rápida del progreso social del estudiante.</div>
        </div>
        <q-btn flat round dense icon="close" @click="emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section v-if="loading" class="column q-gutter-md">
        <q-skeleton dark type="circle" size="96px" />
        <q-skeleton dark type="text" width="70%" />
        <q-skeleton dark type="rect" height="120px" />
      </q-card-section>

      <q-card-section v-else-if="profile" class="column q-gutter-lg">
        <UserProfileCard :profile="profile" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStudentStore } from 'src/stores/student'
import UserProfileCard from 'src/components/shared/UserProfileCard.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const studentStore = useStudentStore()
const loading = ref(false)
const profile = ref(null)

watch(
  () => [props.modelValue, props.userId],
  async ([open, userId]) => {
    if (!open || !userId) return
    loading.value = true
    try {
      profile.value = await studentStore.loadMiniProfile(userId)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.mini-profile-dialog {
  width: min(560px, 92vw);
  background: #101326;
  border-radius: 28px;
}

</style>
