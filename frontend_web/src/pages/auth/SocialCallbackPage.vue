<template>
  <q-page class="flex flex-center" style="background: var(--q-dark-page)">
    <div class="text-center">
      <q-spinner-orbit color="primary" size="4em" />
      <div class="text-h6 q-mt-md text-text-primary">Autenticando con proveedor...</div>
      <div class="text-subtitle2 text-text-secondary">
        Por favor espera, redirigiendo al dashboard.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const $q = useQuasar()

onMounted(() => {
  const token = route.query.token
  const userData = route.query.user

  if (token && userData) {
    try {
      const user = JSON.parse(userData)
      // Guardar sesión en Pinia / LocalStorage
      auth.setSession(token, user)

      $q.notify({
        type: 'positive',
        message: '¡Bienvenido ' + user.name + '!',
        position: 'top-right',
      })

      router.push({ name: 'dashboard' })
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Error al procesar datos del usuario.',
        position: 'top-right',
      })
      router.push({ name: 'login' })
    }
  } else {
    $q.notify({
      type: 'negative',
      message: 'No se recibió el token de autenticación.',
      position: 'top-right',
    })
    router.push({ name: 'login' })
  }
})
</script>
