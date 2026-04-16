<template>
  <q-layout view="lHh Lpr lFf" class="teacher-layout">
    <q-header class="main-header glass" bordered>
      <q-toolbar class="q-px-lg">
        <div class="row items-center cursor-pointer q-mr-lg" @click="$router.push('/teacher/dashboard')">
          <q-icon name="auto_stories" size="26px" color="primary" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold text-gradient">LMS Creator</span>
        </div>

        <q-space />

        <div class="row items-center q-gutter-sm gt-sm">
          <q-btn flat no-caps label="Panel" to="/teacher/dashboard" />
          <q-btn flat no-caps label="Cursos" to="/teacher/courses" />
          <q-btn flat no-caps label="Gamificación" to="/teacher/gamification" />
          <q-btn flat no-caps label="Actividades" to="/teacher/activities" />
        </div>

        <q-btn round flat class="q-ml-md">
          <q-avatar size="34px" color="primary" text-color="white">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
            <span v-else>{{ initials }}</span>
          </q-avatar>
          <q-menu class="glass-card">
            <q-list style="min-width: 220px">
              <q-item clickable v-close-popup to="/teacher/dashboard">
                <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
                <q-item-section>Panel instructor</q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/teacher/courses">
                <q-item-section avatar><q-icon name="school" /></q-item-section>
                <q-item-section>Gestor de cursos</q-item-section>
              </q-item>
              <q-separator dark />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                <q-item-section class="text-negative">Cerrar sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.main-header {
  background: rgba(15, 15, 35, 0.9) !important;
  backdrop-filter: blur(16px);
}
</style>

