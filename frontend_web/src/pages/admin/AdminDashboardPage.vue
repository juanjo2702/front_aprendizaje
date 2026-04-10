<template>
  <q-page class="q-pa-lg">
    <!-- Header con estadísticas principales -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="text-h4 text-weight-bold q-mb-md">Dashboard Administrativo</div>
        <div class="text-subtitle1 text-grey-7">
          Resumen general de la plataforma - {{ currentDate }}
        </div>
      </div>
    </div>

    <!-- Cards de estadísticas -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="row items-center">
              <div class="col-auto">
                <q-icon name="people" size="40px" />
              </div>
              <div class="col q-pl-md">
                <div class="text-h5 text-weight-bold">{{ stats.totalUsers || 0 }}</div>
                <div class="text-subtitle2">Usuarios totales</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Ver usuarios" to="/admin/users" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="row items-center">
              <div class="col-auto">
                <q-icon name="school" size="40px" />
              </div>
              <div class="col q-pl-md">
                <div class="text-h5 text-weight-bold">{{ stats.totalCourses || 0 }}</div>
                <div class="text-subtitle2">Cursos activos</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Ver cursos" to="/admin/courses" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="row items-center">
              <div class="col-auto">
                <q-icon name="payments" size="40px" />
              </div>
              <div class="col q-pl-md">
                <div class="text-h5 text-weight-bold">{{ formatCurrency(stats.totalRevenue || 0) }}</div>
                <div class="text-subtitle2">Ingresos totales</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Ver pagos" to="/admin/payments" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-info text-white">
          <q-card-section>
            <div class="row items-center">
              <div class="col-auto">
                <q-icon name="trending_up" size="40px" />
              </div>
              <div class="col q-pl-md">
                <div class="text-h5 text-weight-bold">{{ stats.activeUsers || 0 }}</div>
                <div class="text-subtitle2">Usuarios activos (7 días)</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Ver actividad" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Gráficos y tablas -->
    <div class="row q-col-gutter-lg">
      <!-- Gráfico de usuarios por mes -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h6">Crecimiento de usuarios</div>
            <div class="text-subtitle2 text-grey-7">Registro de usuarios en los últimos 6 meses</div>
          </q-card-section>
          <q-card-section>
            <div v-if="loading" class="text-center q-py-xl">
              <q-spinner size="50px" color="primary" />
            </div>
            <div v-else class="chart-placeholder">
              <!-- Aquí iría un gráfico real con Chart.js o similar -->
              <div class="text-center text-grey-7 q-py-xl">
                <q-icon name="bar_chart" size="60px" class="q-mb-md" />
                <div>Gráfico de crecimiento de usuarios</div>
                <div class="text-caption">(Integrar Chart.js para producción)</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Últimos usuarios registrados -->
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Usuarios recientes</div>
            <div class="text-subtitle2 text-grey-7">Últimos 5 registros</div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item v-for="user in recentUsers" :key="user.id" clickable>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ getUserInitials(user.name) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ user.name }}</q-item-label>
                  <q-item-label caption>{{ user.email }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="getRoleColor(user.role)" rounded>
                    {{ user.role }}
                  </q-badge>
                </q-item-section>
              </q-item>
              <q-item v-if="recentUsers.length === 0">
                <q-item-section class="text-center text-grey-7 q-py-md">
                  No hay usuarios registrados recientemente
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Ver todos" to="/admin/users" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Cursos más populares -->
    <div class="row q-mt-lg">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Cursos más populares</div>
            <div class="text-subtitle2 text-grey-7">Por número de inscripciones</div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-table
              :rows="popularCourses"
              :columns="courseColumns"
              row-key="id"
              flat
              bordered
              :loading="loading"
            >
              <template #body-cell-enrollments="props">
                <q-td :props="props">
                  <q-badge color="primary" rounded>
                    {{ props.row.enrollments }}
                  </q-badge>
                </q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props">
                  <q-btn flat dense icon="visibility" size="sm" :to="`/admin/courses/${props.row.id}`" />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Actividad reciente del sistema -->
    <div class="row q-mt-lg">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Actividad reciente</div>
            <div class="text-subtitle2 text-grey-7">Eventos importantes en la plataforma</div>
          </q-card-section>
          <q-card-section>
            <q-timeline color="secondary">
              <q-timeline-entry
                v-for="activity in recentActivity"
                :key="activity.id"
                :title="activity.title"
                :subtitle="formatDate(activity.created_at)"
                :icon="activity.icon"
                :color="activity.color"
              >
                {{ activity.description }}
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'

const auth = useAuthStore()
const loading = ref(true)
const stats = ref({})
const recentUsers = ref([])
const popularCourses = ref([])
const recentActivity = ref([])

const currentDate = new Date().toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const courseColumns = [
  { name: 'title', label: 'Curso', field: 'title', align: 'left', sortable: true },
  { name: 'instructor', label: 'Instructor', field: row => row.instructor?.name, align: 'left' },
  { name: 'enrollments', label: 'Inscripciones', field: 'enrollments', align: 'center' },
  { name: 'rating', label: 'Rating', field: 'rating', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' }
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getUserInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function getRoleColor(role) {
  const colors = {
    admin: 'negative',
    instructor: 'warning',
    student: 'positive'
  }
  return colors[role] || 'grey'
}

async function loadDashboardData() {
  try {
    loading.value = true
    // TODO: Implementar endpoints reales para dashboard admin
    // Por ahora usamos datos mock
    stats.value = {
      totalUsers: 1254,
      totalCourses: 42,
      totalRevenue: 12500,
      activeUsers: 342
    }
    
    recentUsers.value = [
      { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'student' },
      { id: 2, name: 'María López', email: 'maria@example.com', role: 'instructor' },
      { id: 3, name: 'Carlos Ruiz', email: 'carlos@example.com', role: 'student' },
      { id: 4, name: 'Ana García', email: 'ana@example.com', role: 'student' },
      { id: 5, name: 'Pedro Martínez', email: 'pedro@example.com', role: 'admin' }
    ]
    
    popularCourses.value = [
      { id: 1, title: 'Introducción a JavaScript', instructor: { name: 'María López' }, enrollments: 245, rating: 4.8 },
      { id: 2, title: 'Diseño UI/UX', instructor: { name: 'Carlos Ruiz' }, enrollments: 189, rating: 4.7 },
      { id: 3, title: 'React Avanzado', instructor: { name: 'Ana García' }, enrollments: 156, rating: 4.9 },
      { id: 4, title: 'Node.js Backend', instructor: { name: 'Pedro Martínez' }, enrollments: 123, rating: 4.6 },
      { id: 5, title: 'Base de Datos SQL', instructor: { name: 'Juan Pérez' }, enrollments: 98, rating: 4.5 }
    ]
    
    recentActivity.value = [
      { id: 1, title: 'Nuevo usuario registrado', description: 'Carlos Ruiz se registró en la plataforma', icon: 'person_add', color: 'primary', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, title: 'Curso publicado', description: 'Nuevo curso "Introducción a Python" publicado', icon: 'school', color: 'positive', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 3, title: 'Pago procesado', description: 'Transacción completada por €49.99', icon: 'payments', color: 'warning', created_at: new Date(Date.now() - 10800000).toISOString() },
      { id: 4, title: 'Certificado generado', description: 'Certificado completado para "Juan Pérez"', icon: 'verified', color: 'info', created_at: new Date(Date.now() - 14400000).toISOString() }
    ]
    
    // Intento cargar datos reales si los endpoints existen
    try {
      // const response = await api.get('/admin/dashboard-stats')
      // stats.value = response.data
    } catch (error) {
      console.log('Usando datos mock para dashboard:', error.message)
    }
  } catch (error) {
    console.error('Error cargando dashboard:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  border-radius: 8px;
  background: #f8f9fa;
}
</style>