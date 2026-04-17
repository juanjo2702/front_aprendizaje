<template>
  <q-card class="health-card q-pa-lg">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-subtitle1 text-weight-bold">{{ title }}</div>
        <div class="text-caption text-grey-5">{{ subtitle }}</div>
      </div>
      <q-badge color="primary" outline>{{ items.length }}</q-badge>
    </div>

    <div v-if="items.length" class="column q-gutter-sm">
      <div v-for="item in items" :key="item.id || item.title" class="health-item q-pa-md">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col">
            <div class="text-body1 text-weight-medium">{{ item.title }}</div>
            <div class="text-caption text-grey-5">{{ item.caption }}</div>
          </div>
          <q-btn
            v-if="item.actionLabel"
            flat
            no-caps
            color="secondary"
            :label="item.actionLabel"
            @click="$emit('action', item)"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-body2 text-grey-5">
      No hay pendientes en esta sección.
    </div>
  </q-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array, default: () => [] },
})

defineEmits(['action'])
</script>

<style scoped>
.health-card {
  height: 100%;
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(28, 30, 66, 0.95), rgba(19, 21, 48, 0.95));
  border: 1px solid rgba(118, 122, 180, 0.18);
}

.health-item {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(118, 122, 180, 0.12);
}
</style>
