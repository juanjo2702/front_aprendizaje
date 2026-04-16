<template>
  <div class="register-page">
    <div class="glass-card q-pa-xl">
      <div class="text-center q-mb-lg">
        <q-icon name="school" size="48px" color="primary" />
        <h4 class="q-mt-sm q-mb-xs text-gradient">Crear cuenta</h4>
        <p class="q-mb-none">Únete y accede a cientos de cursos</p>
      </div>

      <q-form class="q-gutter-md" @submit.prevent="handleRegister">
        <q-input
          v-model="form.name"
          label="Nombre completo"
          outlined
          dark
          :rules="[(v) => !!v || 'Requerido']"
        >
          <template #prepend><q-icon name="person" /></template>
        </q-input>

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
          :rules="[(v) => !!v || 'Requerido', (v) => v.length >= 8 || 'Mínimo 8 caracteres']"
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

        <q-input
          v-model="form.password_confirmation"
          label="Confirmar contraseña"
          :type="showPass ? 'text' : 'password'"
          outlined
          dark
          :rules="[
            (v) => !!v || 'Requerido',
            (v) => v === form.password || 'Las contraseñas no coinciden',
          ]"
        >
          <template #prepend><q-icon name="lock_outline" /></template>
        </q-input>

        <q-btn
          type="submit"
          class="full-width btn-gradient q-mt-md"
          :loading="loading"
          no-caps
          size="lg"
          label="Crear cuenta"
        />
      </q-form>

      <!-- SSO Divider -->
      <div class="row items-center q-my-lg">
        <q-separator dark class="col" />
        <span class="q-mx-md" style="color: #5a5a7a; font-size: 0.8rem">O REGÍSTRATE CON</span>
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

      <div class="text-center q-mt-lg">
        <span style="color: #8b8ba7">¿Ya tienes cuenta?</span>
        <router-link to="/login" class="q-ml-xs text-weight-bold">Inicia sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })
const showPass = ref(false)
const loading = ref(false)

async function handleRegister() {
  loading.value = true
  try {
    await auth.register(form.name, form.email, form.password, form.password_confirmation)
    $q.notify({ type: 'positive', message: '¡Bienvenido! Tu cuenta ha sido creada.' })
    router.push('/dashboard')
  } catch (e) {
    const errors = e?.response?.data?.errors
    const msg = errors ? Object.values(errors).flat().join('. ') : 'Error al registrarse.'
    $q.notify({ type: 'negative', message: msg })
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
    $q.notify({
      type: 'negative',
      message: e?.response?.data?.message || e?.message || `Error al conectar con ${provider}.`,
    })
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  .glass-card {
    background: rgba(26, 26, 62, 0.5);
    border: 1px solid rgba(45, 45, 94, 0.5);
    border-radius: 20px;
  }
}
</style>
