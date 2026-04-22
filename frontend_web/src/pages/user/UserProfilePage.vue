<template>
  <q-page class="user-profile-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h4 class="q-my-none text-weight-bold">Configuración de la cuenta</h4>
        <p class="text-grey-5 q-mt-sm q-mb-none">Administra tu información personal, presencia pública y preferencias de seguridad.</p>
      </div>
    </div>

    <div class="row q-gutter-xl">
      <!-- Left Column: Personal Info -->
      <div class="col-12 col-lg-8">
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md">Información personal</h3>

          <div class="row q-gutter-md q-mb-md">
            <div class="col-6">
              <q-input v-model="user.name" label="Nombre completo" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="user.email" label="Correo electrónico" outlined dense readonly />
            </div>
          </div>

        <div class="row q-gutter-md q-mb-md">
          <div class="col-6">
              <q-input v-model="user.headline" label="Título público" outlined dense />
          </div>
          <div class="col-6">
              <q-input v-model="user.location" label="Ubicación" outlined dense />
          </div>
        </div>

          <div class="q-mb-md">
            <q-input v-model="user.bio" label="Biografía" type="textarea" outlined dense rows="3" />
          </div>

          <div class="q-mb-md">
            <q-input v-model="user.mini_bio" label="Mini-bio pública" type="textarea" outlined dense rows="2" />
          </div>

          <div class="row justify-end">
            <q-btn color="primary" label="Guardar cambios" :loading="saving" @click="saveProfile" />
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
          <div class="text-center">
            <AvatarFrame
              :src="user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'"
              :name="user.name"
              :size="108"
              :frame-class="user.equipped_avatar_frame?.frame_class"
              :frame-svg="user.equipped_avatar_frame?.frame_svg"
            />
            <q-badge v-if="user.equipped_profile_title?.label" color="dark" text-color="warning" class="q-mt-md">
              {{ user.equipped_profile_title.label }}
            </q-badge>
            <br>
            <q-btn flat no-caps label="Cambiar foto" color="primary" class="q-mt-md" />
          </div>
        </q-card>

        <!-- Stats -->
        <q-card class="glass-card q-pa-lg">
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
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'
import AvatarFrame from 'src/components/shared/AvatarFrame.vue'

const auth = useAuthStore()
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

async function loadProfile() {
  try {
    const { data } = await api.get('/profile')
    user.value = data
    // Cargar estadísticas
    const statsRes = await api.get('/user/dashboard-stats')
    stats.value = statsRes.data.stats || {}
  } catch (error) {
    console.error('Error cargando perfil:', error)
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await api.put('/profile', user.value)
    await auth.fetchProfile()
  } catch (error) {
    console.error('Error guardando perfil:', error)
  } finally {
    saving.value = false
  }
}

function changePassword() {
  // Implementar diálogo de cambio de contraseña
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
</style>
