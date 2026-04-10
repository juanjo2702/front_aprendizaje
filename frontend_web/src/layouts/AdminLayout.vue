<template>
  <q-layout view="hHh LpR lFf" class="admin-layout">
    <!-- Header -->
    <q-header class="admin-header bg-primary text-white" elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" />
        <q-toolbar-title class="text-weight-bold">
          <q-icon name="admin_panel_settings" size="28px" class="q-mr-sm" />
          Panel de Administración
        </q-toolbar-title>
        <q-space />
        <div class="row items-center q-gutter-sm">
          <q-btn flat round icon="notifications" />
          <q-btn flat round>
            <q-avatar size="36px">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <q-menu>
              <q-list style="min-width: 200px">
                <q-item class="q-py-md">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ auth.user?.name }}</q-item-label>
                    <q-item-label caption>{{ auth.user?.email }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="goToProfile">
                  <q-item-section avatar>
                    <q-icon name="person" />
                  </q-item-section>
                  <q-item-section>Mi perfil</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToDashboard">
                  <q-item-section avatar>
                    <q-icon name="dashboard" />
                  </q-item-section>
                  <q-item-section>Dashboard usuario</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>Cerrar sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral -->
    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="280"
      class="admin-drawer"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <!-- Dashboard -->
          <q-item clickable to="/admin" exact>
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Gestión de usuarios -->
          <q-expansion-item icon="people" label="Usuarios">
            <q-item clickable to="/admin/users">
              <q-item-section avatar>
                <q-icon name="list" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Lista de usuarios</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/users/create">
              <q-item-section avatar>
                <q-icon name="person_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Crear usuario</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/users/roles">
              <q-item-section avatar>
                <q-icon name="admin_panel_settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Roles y permisos</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Gestión de cursos -->
          <q-expansion-item icon="school" label="Cursos">
            <q-item clickable to="/admin/courses">
              <q-item-section avatar>
                <q-icon name="list" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Todos los cursos</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/courses/create">
              <q-item-section avatar>
                <q-icon name="add_circle" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Crear curso</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/categories">
              <q-item-section avatar>
                <q-icon name="category" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Categorías</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Gestión de contenido -->
          <q-expansion-item icon="menu_book" label="Contenido">
            <q-item clickable to="/admin/lessons">
              <q-item-section avatar>
                <q-icon name="video_library" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Lecciones</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/quizzes">
              <q-item-section avatar>
                <q-icon name="quiz" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Quizzes</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/games">
              <q-item-section avatar>
                <q-icon name="casino" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Juegos</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Pagos y finanzas -->
          <q-expansion-item icon="payments" label="Pagos">
            <q-item clickable to="/admin/payments">
              <q-item-section avatar>
                <q-icon name="receipt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Transacciones</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/subscriptions">
              <q-item-section avatar>
                <q-icon name="subscriptions" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Suscripciones</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/reports">
              <q-item-section avatar>
                <q-icon name="analytics" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Reportes</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Sistema -->
          <q-expansion-item icon="settings" label="Sistema">
            <q-item clickable to="/admin/settings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Ajustes generales</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/logs">
              <q-item-section avatar>
                <q-icon name="list_alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Logs del sistema</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable to="/admin/backup">
              <q-item-section avatar>
                <q-icon name="backup" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Backup</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <q-separator class="q-my-md" />

          <!-- Volver a plataforma -->
          <q-item clickable to="/dashboard">
            <q-item-section avatar>
              <q-icon name="arrow_back" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Volver a la plataforma</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Contenido principal -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const drawerOpen = ref(true)

const initials = computed(() => {
  if (!auth.user?.name) return '?'
  return auth.user.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function goToProfile() {
  router.push('/profile')
}

function goToDashboard() {
  router.push('/dashboard')
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<style lang="scss" scoped>
.admin-layout {
  .admin-header {
    height: 64px;
  }
  .admin-drawer {
    background: #f8f9fa;
  }
}
</style>