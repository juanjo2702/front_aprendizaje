<template>
  <q-layout view="lHh LpR lFf" class="main-layout">
    <!-- ─── Header ──────────────────────────────────────────── -->
    <q-header class="main-header glass" bordered>
      <q-toolbar class="q-px-lg" style="height: 64px">
        <q-btn flat dense round icon="menu" class="lt-md" @click="toggleDrawer" />

        <!-- Logo -->
        <div class="row items-center cursor-pointer q-mr-lg" @click="$router.push('/')">
          <q-icon name="school" size="28px" color="primary" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold text-gradient">Plataforma</span>
        </div>

        <!-- Search Bar (desktop) -->
        <q-input
          v-model="searchQuery"
          dense
          outlined
          placeholder="Buscar cursos..."
          class="header-search gt-sm"
          @keyup.enter="doSearch"
        >
          <template #prepend>
            <q-icon name="search" color="grey-6" />
          </template>
        </q-input>

        <q-space />

        <!-- Nav links (desktop) -->
        <div class="row items-center q-gutter-md gt-sm">
          <q-btn flat no-caps label="Explorar" icon="explore" to="/catalog" />
          <q-btn
            v-if="auth.isInstructor"
            flat
            no-caps
            label="Panel docente"
            icon="school"
            to="/teacher/courses"
          />
          <q-btn
            v-if="auth.isAdmin"
            flat
            no-caps
            label="Admin"
            icon="admin_panel_settings"
            to="/admin"
          />
        </div>

        <!-- User Section -->
        <div class="q-ml-md">
          <template v-if="auth.isAuthenticated">
            <q-btn round flat>
              <q-avatar size="36px" color="primary" text-color="white">
                <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
                <span v-else>{{ initials }}</span>
              </q-avatar>
              <q-menu class="glass-card" style="min-width: 200px">
                <q-list>
                  <q-item class="q-py-md">
                    <q-item-section>
                      <q-item-label class="text-weight-bold">{{ auth.user?.name }}</q-item-label>
                      <q-item-label caption>{{ auth.user?.email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator dark />
                  <q-item v-close-popup clickable to="/dashboard">
                    <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
                    <q-item-section>Dashboard</q-item-section>
                  </q-item>
                  <q-item v-if="auth.isInstructor" v-close-popup clickable to="/teacher/courses">
                    <q-item-section avatar><q-icon name="school" /></q-item-section>
                    <q-item-section>Panel docente</q-item-section>
                  </q-item>
                  <q-item v-if="auth.isAdmin" v-close-popup clickable to="/admin">
                    <q-item-section avatar>
                      <q-icon name="admin_panel_settings" />
                    </q-item-section>
                    <q-item-section>Panel admin</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="handleLogout">
                    <q-item-section avatar
                      ><q-icon name="logout" color="negative"
                    /></q-item-section>
                    <q-item-section class="text-negative">Cerrar sesión</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </template>
          <template v-else>
            <q-btn flat no-caps label="Iniciar sesión" to="/login" class="q-mr-sm gt-xs" />
            <q-btn
              unelevated
              no-caps
              label="Registrarse"
              color="primary"
              to="/register"
              class="gt-xs"
            />
            <q-btn flat round icon="person" to="/login" class="lt-sm" />
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ─── Sidebar (mobile) ────────────────────────────────── -->
    <q-drawer v-model="drawerOpen" bordered :width="280" :breakpoint="1024" class="lt-md">
      <q-list class="q-pt-md">
        <q-item-label header class="text-gradient text-weight-bold q-pb-md"> Menú </q-item-label>
        <q-item v-ripple clickable to="/" exact>
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Inicio</q-item-section>
        </q-item>
        <q-item v-ripple clickable to="/catalog">
          <q-item-section avatar><q-icon name="explore" /></q-item-section>
          <q-item-section>Explorar cursos</q-item-section>
        </q-item>
        <template v-if="auth.isAuthenticated">
          <q-separator dark class="q-my-sm" />
          <q-item v-ripple clickable to="/dashboard">
            <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
            <q-item-section>Mi Dashboard</q-item-section>
          </q-item>
          <q-item v-if="auth.isInstructor" v-ripple clickable to="/teacher/courses">
            <q-item-section avatar><q-icon name="school" /></q-item-section>
            <q-item-section>Panel docente</q-item-section>
          </q-item>
          <q-item v-if="auth.isAdmin" v-ripple clickable to="/admin">
            <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
            <q-item-section>Panel admin</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <!-- ─── Content ─────────────────────────────────────────── -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const drawerOpen = ref(false)
const searchQuery = ref('')

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/catalog', query: { search: searchQuery.value } })
  }
}

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>

<style lang="scss" scoped>
.main-header {
  background: rgba(15, 15, 35, 0.85) !important;
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(45, 45, 94, 0.4) !important;
}

.header-search {
  width: 340px;

  :deep(.q-field__control) {
    background: rgba(26, 26, 62, 0.6);
    border: 1px solid rgba(45, 45, 94, 0.5);

    &:hover,
    &:focus-within {
      border-color: rgba(108, 92, 231, 0.5);
    }
  }

  :deep(.q-field__native) {
    color: #eaeaf5;
  }
}
</style>
