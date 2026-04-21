<template>
  <q-layout view="lHh Lpr lFf" class="admin-layout">
    <q-header class="admin-header" bordered>
      <q-toolbar class="q-px-lg q-py-sm">
        <q-btn flat dense round icon="menu" class="lt-md q-mr-sm" @click="drawerOpen = !drawerOpen" />

        <div class="row items-center cursor-pointer" @click="router.push({ name: 'admin-dashboard' })">
          <q-icon name="admin_panel_settings" size="28px" color="primary" class="q-mr-sm" />
          <div>
            <div class="text-h6 text-weight-bold text-gradient">LMS Overseer</div>
            <div class="text-caption text-grey-5">Supervisión global</div>
          </div>
        </div>

        <q-space />

        <div class="row items-center q-gutter-sm gt-sm">
          <q-btn
            flat
            no-caps
            color="grey-3"
            icon="verified"
            label="Revisión"
            :to="{ name: 'admin-courses' }"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="paid"
            label="Finanzas"
            :to="{ name: 'admin-finances' }"
          />
        </div>

        <q-btn round flat class="q-ml-md">
          <q-avatar size="36px" color="primary" text-color="white">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
            <span v-else>{{ initials }}</span>
          </q-avatar>
          <q-menu class="admin-menu-card">
            <q-list style="min-width: 240px">
              <q-item class="q-py-md">
                <q-item-section avatar>
                  <q-avatar size="42px" color="primary" text-color="white">
                    <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
                    <span v-else>{{ initials }}</span>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ auth.user?.name }}</q-item-label>
                  <q-item-label caption>{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator dark />
              <q-item v-close-popup clickable :to="{ name: 'admin-dashboard' }">
                <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
                <q-item-section>Dashboard admin</q-item-section>
              </q-item>
              <q-item v-close-popup clickable :to="{ name: 'teacher-dashboard' }">
                <q-item-section avatar><q-icon name="switch_account" /></q-item-section>
                <q-item-section>Ir a docente</q-item-section>
              </q-item>
              <q-separator dark />
              <q-item v-close-popup clickable @click="logout">
                <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                <q-item-section class="text-negative">Cerrar sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="300"
      :behavior="$q.screen.gt.sm ? 'desktop' : 'mobile'"
      :overlay="!$q.screen.gt.sm"
      class="admin-drawer"
    >
      <div class="drawer-shell">
        <q-card flat class="drawer-profile q-pa-md q-mb-md">
          <div class="row items-center q-gutter-md">
            <q-avatar size="56px" color="primary" text-color="white">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{ auth.user?.name }}</div>
              <div class="text-caption text-grey-5">Administrador del ecosistema</div>
            </div>
          </div>
        </q-card>

        <q-list class="drawer-nav">
          <q-item-label header class="text-grey-5 q-px-sm">Control central</q-item-label>
          <q-item
            v-for="item in navItems"
            :key="item.name"
            clickable
            :active="activeRouteNames.includes(String(route.name || '')) && activeRouteNames.includes(item.name)"
            active-class="drawer-link-active"
            class="drawer-link"
            @click="goTo(item)"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
              <q-item-label caption>{{ item.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container class="admin-page-container">
      <div class="admin-page-shell">
        <section class="admin-crumb-bar q-px-lg q-py-md">
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-lg-auto row items-center q-gutter-sm">
              <AppBackButton v-if="showBackButton" :fallback-route="{ name: 'admin-dashboard' }" />
              <q-breadcrumbs class="text-grey-5">
                <q-breadcrumbs-el
                  v-for="(crumb, index) in adminBreadcrumbs"
                  :key="`${crumb.label}-${index}`"
                  :label="crumb.label"
                  :to="crumb.to"
                />
              </q-breadcrumbs>
            </div>
            <div class="col-12 col-lg-auto text-subtitle1 text-weight-bold text-grey-2">
              {{ currentAdminTitle }}
            </div>
          </div>
        </section>

        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import AppBackButton from 'src/components/shared/AppBackButton.vue'

const $q = useQuasar()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const drawerOpen = ref($q.screen.gt.sm)

const navItems = [
  {
    name: 'admin-dashboard',
    label: 'Dashboard',
    caption: 'BI, colas de revisión y salud del sistema.',
    icon: 'space_dashboard',
  },
  {
    name: 'admin-users',
    label: 'Usuarios',
    caption: 'Roles, actividad y gobierno de accesos.',
    icon: 'groups',
  },
  {
    name: 'admin-courses',
    label: 'Cursos',
    caption: 'Curación, revisión y aprobación.',
    icon: 'fact_check',
  },
  {
    name: 'admin-finances',
    label: 'Finanzas',
    caption: 'QR, transacciones, retiros y comisiones.',
    icon: 'account_balance_wallet',
  },
  {
    name: 'admin-gamification',
    label: 'Gamificación',
    caption: 'Badges, niveles y tienda global.',
    icon: 'sports_esports',
  },
  {
    name: 'admin-reports',
    label: 'Reportes',
    caption: 'Cuellos pedagógicos y auditoría de XP.',
    icon: 'insights',
  },
]

const activeRouteNames = computed(() => {
  const currentName = String(route.name || '')

  if (currentName.startsWith('admin-course-')) return ['admin-courses', currentName]
  if (currentName.startsWith('admin-user')) return ['admin-users', currentName]
  if (currentName.startsWith('admin-finance') || currentName === 'admin-finances') return ['admin-finances', currentName]
  if (currentName.startsWith('admin-gamification')) return ['admin-gamification', currentName]
  if (currentName.startsWith('admin-report') || currentName === 'admin-reports') return ['admin-reports', currentName]

  return [currentName]
})

const currentAdminTitle = computed(() => {
  const title = route.meta?.adminTitle
  return typeof title === 'function' ? title(route) : (title || 'Panel administrativo')
})

const adminBreadcrumbs = computed(() => {
  const crumbs = route.meta?.adminCrumbs
  const resolved = typeof crumbs === 'function' ? crumbs(route) : (crumbs || [])

  return resolved.length ? resolved : [{ label: 'Inicio', to: { name: 'admin-dashboard' } }]
})

const showBackButton = computed(() => route.name !== 'admin-dashboard')

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function goTo(item) {
  drawerOpen.value = $q.screen.gt.sm
    ? true
    : false
  router.push({ name: item.name })
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}

watch(
  () => $q.screen.gt.sm,
  (isDesktop) => {
    drawerOpen.value = isDesktop
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.admin-layout {
  background:
    radial-gradient(circle at top right, rgba(0, 196, 180, 0.14), transparent 30%),
    radial-gradient(circle at bottom left, rgba(39, 112, 255, 0.1), transparent 26%),
    #0b1320;
}

.admin-header {
  background: rgba(8, 15, 29, 0.94) !important;
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(93, 122, 255, 0.16) !important;
}

.admin-drawer {
  background: linear-gradient(180deg, rgba(10, 20, 39, 0.98), rgba(8, 14, 28, 0.98));
  border-right: 1px solid rgba(93, 122, 255, 0.14) !important;
}

.drawer-shell {
  padding: 20px 16px;
}

.drawer-profile,
.admin-menu-card {
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(20, 31, 58, 0.96), rgba(14, 22, 44, 0.96));
  border: 1px solid rgba(0, 196, 180, 0.18);
}

.drawer-link {
  border-radius: 16px;
  margin-bottom: 6px;
  color: #e9eefc;
}

.drawer-link-active {
  background: linear-gradient(135deg, rgba(0, 196, 180, 0.16), rgba(39, 112, 255, 0.16));
  border: 1px solid rgba(93, 122, 255, 0.24);
}

.admin-page-container {
  background: transparent;
}

.admin-page-shell {
  min-height: 100%;
}

.admin-crumb-bar {
  position: sticky;
  top: 64px;
  z-index: 10;
  background: rgba(8, 15, 29, 0.84);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(93, 122, 255, 0.12);
}

@media (max-width: 768px) {
  .drawer-shell {
    padding: 16px 12px;
  }

  .admin-crumb-bar {
    top: 68px;
  }
}
</style>
