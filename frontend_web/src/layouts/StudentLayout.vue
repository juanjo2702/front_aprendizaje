<template>
  <q-layout view="lHh Lpr lFf" class="student-shell">
    <q-header class="student-header" bordered>
      <q-toolbar class="toolbar-shell">
        <q-btn flat round dense icon="menu" class="lt-lg" @click="drawerOpen = !drawerOpen" />

        <div class="brand-block cursor-pointer" @click="router.push({ name: 'student-dashboard' })">
          <q-icon name="auto_stories" size="30px" color="secondary" />
          <div>
            <div class="brand-title">Learning Hub</div>
            <div class="brand-subtitle">Workspace estudiante</div>
          </div>
        </div>

        <q-space />

        <div class="toolbar-metrics gt-sm">
          <q-chip outline color="secondary">Nivel {{ gamificationSummary.level }}</q-chip>
          <q-chip outline color="warning" text-color="warning">Monedas {{ gamificationSummary.coins }}</q-chip>
          <q-chip outline color="positive">Racha {{ gamificationSummary.streak }}</q-chip>
          <q-chip flat color="dark">{{ gamificationSummary.levelTitle }}</q-chip>
        </div>

        <q-avatar size="42px" class="q-ml-md">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
          <span v-else>{{ initials }}</span>
        </q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      :width="296"
      bordered
      class="student-drawer"
    >
      <div class="drawer-head">
        <q-avatar size="64px" class="drawer-avatar">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
          <span v-else>{{ initials }}</span>
        </q-avatar>
        <div>
          <div class="text-h6 text-weight-bold">{{ auth.user?.name || 'Estudiante' }}</div>
          <div class="text-caption text-grey-5">Ruta activa de aprendizaje</div>
        </div>
      </div>

      <q-list class="drawer-list">
        <q-item v-for="item in navItems" :key="item.name" clickable :to="{ name: item.name }" active-class="nav-active">
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
            <q-item-label caption>{{ item.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="drawer-footer">
        <q-btn class="full-width" flat no-caps color="grey-4" icon="logout" label="Cerrar sesion" @click="logout" />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useStudentStore } from 'src/stores/student'

const router = useRouter()
const auth = useAuthStore()
const studentStore = useStudentStore()
const { gamificationSummary } = storeToRefs(studentStore)

const drawerOpen = ref(true)

const navItems = [
  { name: 'student-dashboard', icon: 'dashboard_customize', label: 'Dashboard', caption: 'Lobby de aprendizaje y progreso.' },
  { name: 'student-marketplace', icon: 'storefront', label: 'Marketplace', caption: 'Catalogo, filtros y compra.' },
  { name: 'student-shop', icon: 'redeem', label: 'Coin Shop', caption: 'Descuentos, premium y cosméticos.' },
  { name: 'student-my-learning', icon: 'school', label: 'Mi aprendizaje', caption: 'Tus cursos inscritos y avance.' },
  { name: 'student-inventory', icon: 'workspace_premium', label: 'Inventario', caption: 'Medallas, perfil y logros.' },
  { name: 'student-certificates-vault', icon: 'verified', label: 'Certificados', caption: 'Boveda y validacion.' },
]

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

onMounted(() => {
  studentStore.primeWorkspace()
})

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.student-shell {
  background:
    radial-gradient(circle at top left, rgba(32, 213, 236, 0.08), transparent 32%),
    linear-gradient(180deg, #0b0e21 0%, #0a0c1b 100%);
}

.student-header {
  background: rgba(11, 14, 33, 0.9);
  backdrop-filter: blur(18px);
}

.toolbar-shell {
  min-height: 76px;
  padding-inline: 18px;
}

.brand-block {
  display: flex;
  gap: 12px;
  align-items: center;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.brand-subtitle {
  color: #8d95bf;
  font-size: 0.8rem;
}

.toolbar-metrics {
  display: flex;
  gap: 10px;
}

.student-drawer {
  background: linear-gradient(180deg, rgba(18, 21, 45, 0.98), rgba(10, 11, 26, 0.99));
}

.drawer-head {
  padding: 22px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.drawer-avatar {
  background: rgba(255, 255, 255, 0.07);
}

.drawer-list {
  padding: 10px 14px;
}

.drawer-list :deep(.q-item) {
  border-radius: 18px;
  margin-bottom: 6px;
}

.drawer-list :deep(.q-item__label--caption) {
  color: #8d95bf;
}

.drawer-list :deep(.nav-active) {
  background: rgba(32, 213, 236, 0.12);
  color: #f2f5ff;
}

.drawer-footer {
  padding: 18px;
  margin-top: auto;
}
</style>
