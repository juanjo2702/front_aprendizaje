<template>
  <q-page class="user-profile-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">Mi perfil</h2>
        <p class="q-mb-none">Administra tu información personal y preferencias</p>
      </div>
      <q-btn flat no-caps icon="arrow_back" label="Volver al dashboard" to="/dashboard" />
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
              <q-input v-model="user.phone" label="Teléfono" outlined dense />
            </div>
            <div class="col-6">
              <q-input v-model="user.country" label="País" outlined dense />
            </div>
          </div>

          <div class="q-mb-md">
            <q-input v-model="user.bio" label="Biografía" type="textarea" outlined dense rows="3" />
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
            <q-btn
              flat
              no-caps
              label="Ver dispositivos conectados"
              icon="mdi-devices"
              color="primary"
            />
          </div>
        </q-card>
      </div>

      <!-- Right Column: Stats & Avatar -->
      <div class="col-12 col-lg-4">
        <!-- Avatar -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <div class="text-center">
            <q-avatar size="120px" class="q-mb-md">
              <img :src="user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'" />
            </q-avatar>
            <q-btn flat no-caps label="Cambiar foto" color="primary" />
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

const auth = useAuthStore()
const user = ref({
  name: '',
  email: '',
  phone: '',
  country: '',
  bio: '',
  avatar: '',
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
    auth.user = user.value
    localStorage.setItem('user', JSON.stringify(user.value))
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
