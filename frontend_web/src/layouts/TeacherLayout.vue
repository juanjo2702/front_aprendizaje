<template>
  <q-layout view="lHh Lpr lFf" class="teacher-layout">
    <q-header class="teacher-header" bordered>
      <q-toolbar class="q-px-lg q-py-sm">
        <q-btn flat dense round icon="menu" class="lt-md q-mr-sm" @click="drawerOpen = !drawerOpen" />

        <div class="row items-center cursor-pointer" @click="router.push({ name: 'teacher-dashboard' })">
          <q-icon name="auto_stories" size="28px" color="primary" class="q-mr-sm" />
          <div>
            <div class="text-h6 text-weight-bold text-gradient">LMS Creator</div>
            <div class="text-caption text-grey-5">Workspace docente</div>
          </div>
        </div>

        <q-space />

        <div class="row items-center q-gutter-sm gt-sm">
          <q-btn
            flat
            no-caps
            color="grey-3"
            icon="travel_explore"
            label="Marketplace"
            :to="{ name: 'teacher-marketplace' }"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            icon="add_circle"
            label="Nuevo curso"
            :to="{ name: 'teacher-courses' }"
          />
        </div>

        <q-btn round flat class="q-ml-md">
          <q-avatar size="36px" color="primary" text-color="white">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
            <span v-else>{{ initials }}</span>
          </q-avatar>
          <q-menu class="glass-card">
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
              <q-item clickable v-close-popup :to="{ name: 'teacher-dashboard' }">
                <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
                <q-item-section>Dashboard docente</q-item-section>
              </q-item>
              <q-item clickable v-close-popup :to="{ name: 'public-catalog' }">
                <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                <q-item-section>Vista pública</q-item-section>
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

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="290"
      :behavior="$q.screen.gt.sm ? 'desktop' : 'mobile'"
      :overlay="!$q.screen.gt.sm"
      class="teacher-drawer"
    >
      <div class="drawer-shell">
        <q-card flat class="drawer-profile q-pa-md q-mb-md">
          <div class="row items-center q-gutter-md">
            <q-avatar size="54px" color="primary" text-color="white">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{ auth.user?.name }}</div>
              <div class="text-caption text-grey-5">Panel docente activo</div>
            </div>
          </div>
        </q-card>

        <q-list class="drawer-nav">
          <q-item-label header class="text-grey-5 q-px-sm">Navegación</q-item-label>
          <q-item
            v-for="item in navItems"
            :key="item.name"
            clickable
            :active="route.name === item.name"
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

        <q-separator dark class="q-my-md" />

        <q-list>
          <q-item-label header class="text-grey-5 q-px-sm">Acciones</q-item-label>
          <q-item clickable class="drawer-link" @click="router.push({ name: 'teacher-marketplace' })">
            <q-item-section avatar><q-icon name="travel_explore" /></q-item-section>
            <q-item-section>
              <q-item-label>Ver marketplace</q-item-label>
              <q-item-label caption>Explora cursos sin salir del workspace docente.</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable class="drawer-link" @click="router.push({ name: 'teacher-courses' })">
            <q-item-section avatar><q-icon name="add_task" /></q-item-section>
            <q-item-section>
              <q-item-label>Crear o editar curso</q-item-label>
              <q-item-label caption>Gestiona estructura, lecciones y preview.</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container class="teacher-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const $q = useQuasar()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const drawerOpen = ref($q.screen.gt.sm)

const navItems = [
  {
    name: 'teacher-marketplace',
    label: 'Marketplace',
    caption: 'Explora el catálogo sin salir del panel.',
    icon: 'travel_explore',
  },
  {
    name: 'teacher-dashboard',
    label: 'Dashboard',
    caption: 'Resumen operativo y próximos pasos.',
    icon: 'dashboard_customize',
  },
  {
    name: 'teacher-courses',
    label: 'Cursos',
    caption: 'CRUD, estructura y vista previa.',
    icon: 'school',
  },
  {
    name: 'teacher-gamification',
    label: 'Gamificación',
    caption: 'XP, monedas, intentos y umbrales.',
    icon: 'emoji_events',
  },
  {
    name: 'teacher-students',
    label: 'Mis alumnos',
    caption: 'Seguimiento, alertas y drill-down.',
    icon: 'groups',
  },
  {
    name: 'teacher-gradebook',
    label: 'Libreta',
    caption: 'Intentos, notas y bloqueos por actividad.',
    icon: 'fact_check',
  },
  {
    name: 'teacher-activities',
    label: 'Actividades',
    caption: 'Lecciones interactivas y configuración.',
    icon: 'extension',
  },
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
.teacher-layout {
  background:
    radial-gradient(circle at top right, rgba(108, 92, 231, 0.12), transparent 32%),
    radial-gradient(circle at bottom left, rgba(0, 210, 211, 0.08), transparent 28%),
    #0f1023;
}

.teacher-header {
  background: rgba(12, 13, 29, 0.92) !important;
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(118, 122, 180, 0.16) !important;
}

.teacher-drawer {
  background: linear-gradient(180deg, rgba(18, 19, 43, 0.98), rgba(13, 14, 33, 0.98));
  border-right: 1px solid rgba(118, 122, 180, 0.14) !important;
}

.drawer-shell {
  padding: 20px 16px;
}

.drawer-profile {
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(29, 31, 66, 0.95), rgba(21, 23, 52, 0.95));
  border: 1px solid rgba(108, 92, 231, 0.22);
}

.drawer-link {
  border-radius: 16px;
  margin-bottom: 6px;
  color: #eaeaf5;
}

.drawer-link-active {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.22), rgba(0, 210, 211, 0.12));
  border: 1px solid rgba(108, 92, 231, 0.3);
}

.teacher-page-container {
  background: transparent;
}
</style>
