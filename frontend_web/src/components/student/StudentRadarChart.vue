<template>
  <q-card flat bordered class="student-chart-card">
    <q-card-section class="row items-center justify-between q-pb-sm">
      <div>
        <div class="text-subtitle1 text-weight-bold">Radar de habilidades</div>
        <div class="text-caption text-grey-5">
          Se actualiza con tu actividad y tus cursos activos.
        </div>
      </div>
      <q-badge outline color="secondary">Analitica personal</q-badge>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div v-if="!skills.length" class="text-center q-py-xl text-grey-5">
        Aun no hay suficiente actividad para construir el radar.
      </div>
      <VueApexCharts
        v-else
        type="radar"
        height="330"
        :options="chartOptions"
        :series="chartSeries"
      />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

const props = defineProps({
  skills: {
    type: Array,
    default: () => [],
  },
})

const chartSeries = computed(() => [
  {
    name: 'Competencia',
    data: props.skills.map((item) => Number(item.value || 0)),
  },
])

const chartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    foreColor: '#d8dcff',
    background: 'transparent',
  },
  xaxis: {
    categories: props.skills.map((item) => item.label),
    labels: {
      style: {
        colors: '#d8dcff',
        fontSize: '12px',
        fontFamily: 'inherit',
      },
    },
  },
  yaxis: {
    max: 100,
    tickAmount: 5,
    labels: {
      style: {
        colors: '#8b91b7',
      },
    },
  },
  stroke: {
    width: 2.5,
    colors: ['#20d5ec'],
  },
  fill: {
    opacity: 0.24,
    colors: ['#5e6bff'],
  },
  markers: {
    size: 4,
    colors: ['#ffffff'],
    strokeColors: '#20d5ec',
    strokeWidth: 2,
  },
  plotOptions: {
    radar: {
      polygons: {
        strokeColors: 'rgba(255,255,255,0.08)',
        connectorColors: 'rgba(255,255,255,0.08)',
        fill: {
          colors: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'],
        },
      },
    },
  },
  tooltip: {
    theme: 'dark',
  },
  legend: {
    show: false,
  },
}))
</script>

<style scoped>
.student-chart-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
