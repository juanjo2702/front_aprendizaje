<template>
  <q-card class="action-card q-pa-lg">
    <div class="row items-start justify-between no-wrap q-mb-md">
      <div class="action-icon-wrap">
        <q-icon :name="icon" size="24px" color="white" />
      </div>
      <q-badge v-if="badge" color="secondary" outline>{{ badge }}</q-badge>
    </div>
    <div class="text-subtitle1 text-weight-bold q-mb-sm">{{ title }}</div>
    <div class="text-body2 text-grey-4 q-mb-lg">{{ description }}</div>
    <q-btn
      flat
      no-caps
      color="primary"
      :label="actionLabel"
      icon-right="arrow_forward"
      @click="$emit('action')"
    />
  </q-card>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'rocket_launch' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: 'Abrir' },
  badge: { type: String, default: '' },
})

defineEmits(['action'])
</script>

<style scoped>
.action-card {
  height: 100%;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(28, 30, 66, 0.95), rgba(19, 21, 48, 0.95));
  border: 1px solid rgba(118, 122, 180, 0.18);
}

.action-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6c5ce7, #00d2d3);
}
</style>
