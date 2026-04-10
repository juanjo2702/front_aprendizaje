<template>
  <q-page class="q-pa-lg">
    <div class="column items-center justify-center full-height text-center">
      <q-icon
        name="construction"
        size="100px"
        color="warning"
        class="q-mb-lg"
      />
      <div class="text-h4 text-weight-bold q-mb-md">En desarrollo</div>
      <div class="text-h6 text-grey-7 q-mb-lg">
        {{ pageTitle }} está actualmente en desarrollo.
      </div>
      <div class="text-body1 q-mb-xl max-width-600">
        Esta funcionalidad estará disponible pronto. Mientras tanto, puedes explorar otras secciones del panel de administración.
      </div>
      <q-btn
        color="primary"
        icon="arrow_back"
        label="Volver al dashboard"
        :to="{ name: 'admin-dashboard' }"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => {
  const routeName = route.name || ''
  if (routeName.includes('users')) return 'Gestión de usuarios'
  if (routeName.includes('courses')) return 'Gestión de cursos'
  if (routeName.includes('categories')) return 'Gestión de categorías'
  if (routeName.includes('lessons')) return 'Gestión de lecciones'
  if (routeName.includes('quizzes')) return 'Gestión de quizzes'
  if (routeName.includes('games')) return 'Gestión de juegos'
  if (routeName.includes('payments')) return 'Gestión de pagos'
  if (routeName.includes('subscriptions')) return 'Gestión de suscripciones'
  if (routeName.includes('reports')) return 'Reportes'
  if (routeName.includes('settings')) return 'Configuración'
  if (routeName.includes('logs')) return 'Logs del sistema'
  if (routeName.includes('backup')) return 'Backup'
  return 'Esta página'
})
</script>

<style lang="scss" scoped>
.full-height {
  min-height: 70vh;
}
.max-width-600 {
  max-width: 600px;
}
</style>