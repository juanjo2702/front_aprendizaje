<template>
  <q-page class="user-profile-page q-pa-xl" style="max-width: 1200px; margin: 0 auto" data-cy="user-profile-page">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h4 class="q-my-none text-weight-bold">{{ profileHeading }}</h4>
        <p class="text-grey-5 q-mt-sm q-mb-none">{{ profileIntro }}</p>
      </div>
    </div>

    <div class="row q-gutter-xl">
      <!-- Left Column: Personal Info -->
      <div class="col-12 col-lg-8">
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md">{{ personalInfoHeading }}</h3>

          <div class="row q-gutter-md q-mb-md">
            <div class="col-6">
              <q-input v-model="user.name" data-cy="profile-name-input" label="Nombre completo" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="user.email" label="Correo electrónico" outlined dense readonly />
            </div>
          </div>

        <div class="row q-gutter-md q-mb-md">
          <div class="col-6">
              <q-input v-model="user.headline" data-cy="profile-headline-input" :label="headlineLabel" outlined dense />
          </div>
          <div class="col-6">
              <q-input v-model="user.location" data-cy="profile-location-input" label="Ubicación" outlined dense />
          </div>
        </div>

          <div class="q-mb-md">
            <q-input v-model="user.bio" data-cy="profile-bio-input" :label="bioLabel" type="textarea" outlined dense rows="3" />
          </div>

          <div class="q-mb-md">
            <q-input v-model="user.mini_bio" data-cy="profile-mini-bio-input" :label="miniBioLabel" type="textarea" outlined dense rows="2" />
          </div>

          <div class="row justify-end">
            <q-btn color="primary" data-cy="profile-save-btn" label="Guardar cambios" :loading="saving" @click="saveProfile" />
          </div>
        </q-card>

        <!-- Security -->
        <q-card class="glass-card q-pa-lg">
          <h3 class="q-mb-md">Seguridad</h3>
          <div class="q-gutter-y-md">
            <q-btn
              flat
              no-caps
              label="Cambiar contraseña"
              icon="mdi-lock"
              color="primary"
              @click="changePassword"
            />
          </div>
        </q-card>
      </div>

      <!-- Right Column: Stats & Avatar -->
      <div class="col-12 col-lg-4">
        <!-- Avatar -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md text-center">{{ avatarSectionHeading }}</h3>
          <div class="text-center">
            <AvatarFrame
              :src="user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'"
              :name="user.name"
              :size="108"
              :frame-class="user.equipped_avatar_frame?.frame_class"
              :frame-svg="user.equipped_avatar_frame?.frame_svg"
            />
            <div v-if="equippedProfileTitles.length" class="profile-title-row q-mt-md">
              <q-badge
                v-for="title in equippedProfileTitles"
                :key="title.user_item_id || title.label"
                color="dark"
                text-color="warning"
              >
                {{ title.label }}
              </q-badge>
            </div>
            <br>
            <q-file
              v-model="avatarFile"
              data-cy="profile-avatar-file"
              class="q-mt-md"
              dense
              outlined
              accept=".jpg,.jpeg,.png,.webp,image/*"
              label="Elegir nueva foto"
            />
            <q-btn
              flat
              no-caps
              label="Cambiar foto"
              color="primary"
              class="q-mt-sm"
              :loading="avatarSaving"
              :disable="!avatarCandidate"
              @click="uploadAvatar"
            />
          </div>
        </q-card>

        <!-- Stats -->
        <q-card v-if="!isTeacherWorkspace" class="glass-card q-pa-lg">
          <h3 class="q-mb-md">Estadísticas</h3>
          <div class="q-gutter-y-md">
            <div class="row items-center justify-between">
              <span style="color: #8b8ba7">Puntos totales</span>
              <span class="text-h6">{{ stats.total_points || 0 }}</span>
            </div>
            <div class="row items-center justify-between">
              <span style="color: #8b8ba7">Cursos completados</span>
              <span class="text-h6">{{ stats.completed_courses || 0 }}</span>
            </div>
            <div class="row items-center justify-between">
              <span style="color: #8b8ba7">Badges obtenidos</span>
              <span class="text-h6">{{ stats.total_badges || 0 }}</span>
            </div>
            <div class="row items-center justify-between">
              <span style="color: #8b8ba7">Certificados</span>
              <span class="text-h6">{{ stats.total_certificates || 0 }}</span>
            </div>
          </div>
        </q-card>

        <q-card v-else class="glass-card q-pa-lg">
          <h3 class="q-mb-md">Resumen del perfil</h3>
          <div class="q-gutter-y-md">
            <div
              v-for="item in summaryItems"
              :key="item.label"
              class="row items-start justify-between summary-row"
            >
              <span class="summary-label">{{ item.label }}</span>
              <span class="summary-value">{{ item.value }}</span>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="passwordDialog">
      <q-card class="glass-card q-pa-lg password-card" data-cy="change-password-dialog">
        <div class="row items-center justify-between q-mb-md">
          <h3 class="q-my-none">Cambiar contraseña</h3>
          <q-btn flat round dense icon="close" @click="passwordDialog = false" />
        </div>

        <div class="column q-gutter-md">
          <q-input
            v-model="passwordForm.current_password"
            data-cy="current-password-input"
            label="Contraseña actual"
            type="password"
            outlined
            dense
          />
          <q-input
            v-model="passwordForm.password"
            data-cy="new-password-input"
            label="Nueva contraseña"
            type="password"
            outlined
            dense
            hint="Mínimo 8 caracteres."
          />
          <q-input
            v-model="passwordForm.password_confirmation"
            data-cy="confirm-password-input"
            label="Confirmar nueva contraseña"
            type="password"
            outlined
            dense
          />
          <q-btn
            color="primary"
            no-caps
            data-cy="submit-password-change-btn"
            label="Guardar contraseña"
            :loading="passwordSaving"
            @click="submitPasswordChange"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'
import AvatarFrame from 'src/components/shared/AvatarFrame.vue'

const auth = useAuthStore()
const $q = useQuasar()
const route = useRoute()
const user = ref({
  name: '',
  email: '',
  headline: '',
  location: '',
  bio: '',
  mini_bio: '',
  avatar: '',
  equipped_avatar_frame: null,
  equipped_profile_title: null,
})
const stats = ref({})
const saving = ref(false)
const avatarFile = ref(null)
const avatarSaving = ref(false)
const passwordDialog = ref(false)
const passwordSaving = ref(false)
const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const isTeacherWorkspace = computed(() => route.name === 'teacher-profile')

const profileHeading = computed(() => (
  isTeacherWorkspace.value ? 'Perfil docente' : 'Configuración de la cuenta'
))

const profileIntro = computed(() => (
  isTeacherWorkspace.value
    ? 'Administra tu presentación profesional, foto, biografía y seguridad de acceso al panel docente.'
    : 'Administra tu información personal, presencia pública y preferencias de seguridad.'
))

const personalInfoHeading = computed(() => (
  isTeacherWorkspace.value ? 'Información profesional' : 'Información personal'
))

const headlineLabel = computed(() => (
  isTeacherWorkspace.value ? 'Especialidad o rol docente' : 'Título público'
))

const bioLabel = computed(() => (
  isTeacherWorkspace.value ? 'Biografía docente' : 'Biografía'
))

const miniBioLabel = computed(() => (
  isTeacherWorkspace.value ? 'Resumen para perfil docente' : 'Mini-bio pública'
))

const avatarSectionHeading = computed(() => (
  isTeacherWorkspace.value ? 'Foto del docente' : 'Foto de perfil'
))

const summaryItems = computed(() => {
  if (!isTeacherWorkspace.value) {
    return []
  }

  return [
    {
      label: 'Rol actual',
      value: auth.user?.role === 'admin' ? 'Administrador con vista docente' : 'Instructor',
    },
    {
      label: 'Correo de acceso',
      value: user.value.email || 'Sin correo registrado',
    },
    {
      label: 'Presentación pública',
      value: user.value.headline || 'Añade una especialidad para mostrarte mejor en el catálogo.',
    },
  ]
})

const avatarCandidate = computed(() => {
  if (Array.isArray(avatarFile.value)) {
    return avatarFile.value[0] || null
  }

  return avatarFile.value || null
})

const equippedProfileTitles = computed(() => {
  if (Array.isArray(user.value.equipped_profile_titles) && user.value.equipped_profile_titles.length) {
    return user.value.equipped_profile_titles.slice(0, 3)
  }

  return user.value.equipped_profile_title ? [user.value.equipped_profile_title] : []
})

async function loadProfile() {
  try {
    const { data } = await api.get('/profile')
    user.value = data
    const statsRes = await api.get('/user/dashboard-stats')
    const payload = statsRes.data || {}
    stats.value = {
      total_points: Number(payload.stats?.total_points || data.total_points || 0),
      completed_courses: Number(payload.stats?.completed_courses || payload.courses?.completed || 0),
      total_badges: Number(payload.stats?.total_badges || payload.achievements?.total_badges || 0),
      total_certificates: Number(payload.stats?.total_certificates || payload.achievements?.total_certificates || 0),
    }
  } catch (error) {
    console.error('Error cargando perfil:', error)
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const { data } = await api.put('/profile', user.value)
    user.value = data
    await auth.fetchProfile()
    $q.notify({ type: 'positive', message: 'Perfil actualizado correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.response?.data?.message || 'No se pudo guardar el perfil.' })
  } finally {
    saving.value = false
  }
}

function changePassword() {
  passwordForm.value = {
    current_password: '',
    password: '',
    password_confirmation: '',
  }
  passwordDialog.value = true
}

async function uploadAvatar() {
  if (!avatarCandidate.value) return

  avatarSaving.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', avatarCandidate.value, avatarCandidate.value.name || 'avatar')
    const { data } = await api.post('/profile/avatar', formData)
    auth.setSession(auth.token, data.user, { bustAvatar: true })
    auth.refreshAvatar(data.user?.avatar, data.user)
    user.value = {
      ...data.user,
      avatar: auth.user?.avatar || data.user?.avatar,
    }
    avatarFile.value = null
    $q.notify({ type: 'positive', message: data.message || 'Foto actualizada correctamente.' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.response?.data?.message || 'No se pudo actualizar la foto.' })
  } finally {
    avatarSaving.value = false
  }
}

async function submitPasswordChange() {
  passwordSaving.value = true
  try {
    const { data } = await api.post('/profile/password', passwordForm.value)
    passwordDialog.value = false
    $q.notify({ type: 'positive', message: data.message || 'Contraseña actualizada correctamente.' })
  } catch (error) {
    const errors = error?.response?.data?.errors
    const firstKey = errors ? Object.keys(errors)[0] : null
    $q.notify({
      type: 'negative',
      message: firstKey ? errors[firstKey][0] : (error?.response?.data?.message || 'No se pudo cambiar la contraseña.'),
    })
  } finally {
    passwordSaving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style lang="scss" scoped>
.user-profile-page {
  .glass-card {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    }
  }
}

.password-card {
  width: min(460px, 92vw);
}

.profile-title-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.summary-row {
  gap: 12px;
}

.summary-label {
  color: #8b8ba7;
}

.summary-value {
  color: #f4f6fb;
  font-weight: 600;
  text-align: right;
  max-width: 60%;
}

</style>
