<template>
  <div class="login-page">
    <div class="glass-card q-pa-xl">
      <!-- Logo -->
      <div class="text-center q-mb-xl">
        <q-icon name="school" size="48px" color="primary" />
        <h4 class="q-mt-sm q-mb-xs text-gradient">Plataforma</h4>
        <p class="q-mb-none">Inicia sesión para continuar aprendiendo</p>
      </div>

      <!-- Form -->
      <q-form class="q-gutter-md" @submit.prevent="handleLogin">
        <q-input
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          outlined
          dark
          :rules="[(v) => !!v || 'Requerido', (v) => /.+@.+\..+/.test(v) || 'Email inválido']"
        >
          <template #prepend><q-icon name="email" /></template>
        </q-input>

        <q-input
          v-model="form.password"
          label="Contraseña"
          :type="showPass ? 'text' : 'password'"
          outlined
          dark
          :rules="[(v) => !!v || 'Requerido']"
        >
          <template #prepend><q-icon name="lock" /></template>
          <template #append>
            <q-icon
              :name="showPass ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPass = !showPass"
            />
          </template>
        </q-input>

        <q-btn
          type="submit"
          class="full-width btn-gradient q-mt-md"
          :loading="loading"
          no-caps
          size="lg"
          label="Iniciar sesión"
        />
      </q-form>

      <!-- SSO Divider -->
      <div class="row items-center q-my-lg">
        <q-separator dark class="col" />
        <span class="q-mx-md" style="color: #5a5a7a; font-size: 0.8rem">O CONTINÚA CON</span>
        <q-separator dark class="col" />
      </div>

      <!-- SSO Buttons -->
      <div class="row q-gutter-sm">
        <q-btn
          outline
          no-caps
          class="col"
          color="white"
          text-color="white"
          label="Google"
          icon="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          @click="handleSocialLogin('google')"
        />
        <q-btn
          outline
          no-caps
          class="col"
          color="white"
          text-color="white"
          label="GitHub"
          icon="mdi-github"
          @click="handleSocialLogin('github')"
        />
      </div>

      <q-separator dark class="q-my-md" />

      <div class="text-caption text-center q-mb-sm" style="color: #8b8ba7">Acceso rápido demo</div>
      <div class="row q-gutter-sm">
        <q-btn
          outline
          no-caps
          class="col"
          color="white"
          text-color="white"
          label="Estudiante"
          :loading="loadingDemo === 'student'"
          @click="loginAsDemo('student')"
        />
        <q-btn
          outline
          no-caps
          class="col"
          color="white"
          text-color="white"
          label="Docente"
          :loading="loadingDemo === 'instructor'"
          @click="loginAsDemo('instructor')"
        />
        <q-btn
          outline
          no-caps
          class="col"
          color="white"
          text-color="white"
          label="Admin"
          :loading="loadingDemo === 'admin'"
          @click="loginAsDemo('admin')"
        />
      </div>

      <!-- Register Link -->
      <div class="text-center q-mt-lg">
        <span style="color: #8b8ba7">¿No tienes cuenta?</span>
        <router-link to="/register" class="q-ml-xs text-weight-bold">Regístrate</router-link>
      </div>
    </div>

    <!-- Error notification -->
    <q-dialog v-model="showError">
      <q-card class="glass-card" style="min-width: 300px">
        <q-card-section class="row items-center">
          <q-icon name="error" color="negative" size="sm" class="q-mr-sm" />
          <span>{{ errorMsg }}</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cerrar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const showPass = ref(false)
const loading = ref(false)
const loadingDemo = ref('')
const showError = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const socialError = route.query.social_error
  const sessionExpired = route.query.session === 'expired'

  if (sessionExpired) {
    errorMsg.value = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'
    showError.value = true
    return
  }

  if (socialError) {
    errorMsg.value = String(socialError)
    showError.value = true
  }
})

async function handleLogin() {
  loading.value = true
  try {
    const result = await auth.login(form.email, form.password)
    router.push(resolveHomeRoute(result?.user?.role))
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || 'Error al iniciar sesión.'
    showError.value = true
  } finally {
    loading.value = false
  }
}

async function handleSocialLogin(provider) {
  try {
    const { data } = await api.get(`/auth/${provider}/redirect`)
    if (!data?.url) {
      throw new Error(data?.message || `No se recibió URL de autenticación para ${provider}.`)
    }
    window.location.href = data.url
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || e?.message || `Error al conectar con ${provider}.`
    showError.value = true
  }
}

async function loginAsDemo(role) {
  const credentials = {
    student: { email: 'estudiante@plataforma.com', password: 'password' },
    instructor: { email: 'profesor@plataforma.com', password: 'password' },
    admin: { email: 'admin@plataforma.com', password: 'password' },
  }

  const selected = credentials[role]
  if (!selected) return

  form.email = selected.email
  form.password = selected.password
  loadingDemo.value = role

  try {
    const result = await auth.login(selected.email, selected.password)
    router.push(resolveHomeRoute(result?.user?.role))
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || 'No se pudo iniciar sesión con cuenta demo.'
    showError.value = true
  } finally {
    loadingDemo.value = ''
  }
}

function resolveHomeRoute(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'instructor') return '/teacher/dashboard'
  return '/student/dashboard'
}
</script>

<style lang="scss" scoped>
.login-page {
  .glass-card {
    background: rgba(26, 26, 62, 0.5);
    border: 1px solid rgba(45, 45, 94, 0.5);
    border-radius: 20px;
  }
}
</style>
