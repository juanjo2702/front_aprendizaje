<template>
  <q-card class="metric-card q-pa-lg">
    <div class="row items-start justify-between no-wrap q-mb-md">
      <div>
        <div class="text-caption text-grey-5 q-mb-xs">{{ label }}</div>
        <div class="text-h4 text-weight-bold" :style="{ color: valueColor }">{{ value }}</div>
      </div>
      <q-icon :name="icon" size="28px" :color="iconColor" />
    </div>
    <div class="text-body2 text-grey-4">{{ hint }}</div>
  </q-card>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  icon: { type: String, default: 'insights' },
  iconColor: { type: String, default: 'primary' },
  valueColor: { type: String, default: '#f6f7fb' },
})
</script>

<style scoped>
.metric-card {
  height: 100%;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(28, 30, 66, 0.95), rgba(19, 21, 48, 0.95));
  border: 1px solid rgba(108, 92, 231, 0.2);
  box-shadow: 0 20px 50px rgba(8, 10, 26, 0.28);
}
</style>
