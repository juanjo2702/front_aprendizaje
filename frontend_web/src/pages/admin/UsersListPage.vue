<template>
  <q-page class="q-pa-lg">
    <!-- Header y acciones -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Gestión de Usuarios</div>
        <div class="text-subtitle1 text-grey-7">
          Administra los usuarios de la plataforma
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="person_add"
          label="Nuevo usuario"
          :to="{ name: 'admin-users-create' }"
        />
        <q-btn
          outline
          color="primary"
          icon="filter_list"
          label="Filtros"
          class="q-ml-sm"
          @click="showFilters = !showFilters"
        />
      </div>
    </div>

    <!-- Filtros -->
    <q-slide-transition>
      <div v-show="showFilters" class="q-mb-lg">
        <q-card class="q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model="filters.search"
                label="Buscar por nombre o email"
                outlined
                dense
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.role"
                :options="roleOptions"
                label="Rol"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-select
                v-model="filters.status"
                :options="statusOptions"
                label="Estado"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <div class="row q-col-gutter-xs">
                <div class="col">
                  <q-btn
                    color="primary"
                    label="Aplicar"
                    @click="applyFilters"
                    class="full-width"
                  />
                </div>
                <div class="col">
                  <q-btn
                    outline
                    label="Limpiar"
                    @click="clearFilters"
                    class="full-width"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </q-slide-transition>

    <!-- Tabla de usuarios -->
    <q-card>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          @request="onRequest"
          flat
          bordered
        >
          <!-- Avatar y nombre -->
          <template #body-cell-avatar="props">
            <q-td :props="props">
              <q-avatar size="36px" :color="getAvatarColor(props.row.role)" text-color="white">
                <img v-if="props.row.avatar" :src="props.row.avatar" />
                <span v-else>{{ getUserInitials(props.row.name) }}</span>
              </q-avatar>
            </q-td>
          </template>

          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div class="text-caption text-grey-7">{{ props.row.email }}</div>
            </q-td>
          </template>

          <!-- Rol -->
          <template #body-cell-role="props">
            <q-td :props="props">
              <q-badge :color="getRoleColor(props.row.role)" rounded>
                {{ getRoleLabel(props.row.role) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Estado -->
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.email_verified_at ? 'positive' : 'warning'" rounded>
                {{ props.row.email_verified_at ? 'Verificado' : 'Pendiente' }}
              </q-badge>
            </q-td>
          </template>

          <!-- Acciones -->
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="visibility"
                size="sm"
                @click="viewUser(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="edit"
                size="sm"
                class="q-ml-xs"
                @click="editUser(props.row)"
              />
              <q-btn
                flat
                dense
                round
                icon="delete"
                size="sm"
                color="negative"
                class="q-ml-xs"
                @click="confirmDelete(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de confirmación de eliminación -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Eliminar usuario</div>
          <div class="text-subtitle2 q-mt-sm">
            ¿Estás seguro de eliminar al usuario <strong>{{ selectedUser?.name }}</strong>?
            Esta acción no se puede deshacer.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="deleteUser" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()

const loading = ref(false)
const showFilters = ref(false)
const deleteDialog = ref(false)
const selectedUser = ref(null)

const users = ref([])
const filters = ref({
  search: '',
  role: '',
  status: ''
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const roleOptions = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Estudiante', value: 'student' }
]

const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Verificado', value: 'verified' },
  { label: 'Pendiente', value: 'pending' }
]

const columns = [
  { name: 'avatar', label: '', field: 'avatar', align: 'center', style: 'width: 60px' },
  { name: 'name', label: 'Usuario', field: 'name', align: 'left', sortable: true },
  { name: 'role', label: 'Rol', field: 'role', align: 'center', sortable: true },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Registro', field: 'created_at', align: 'center', sortable: true, format: (val) => formatDate(val) },
  { name: 'last_login', label: 'Último acceso', field: 'last_login', align: 'center', format: (val) => formatDate(val) },
  { name: 'actions', label: 'Acciones', align: 'center', style: 'width: 120px' }
]

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function getRoleLabel(role) {
  const labels = {
    admin: 'Admin',
    instructor: 'Instructor',
    student: 'Estudiante'
  }
  return labels[role] || role
}

function getRoleColor(role) {
  const colors = {
    admin: 'negative',
    instructor: 'warning',
    student: 'positive'
  }
  return colors[role] || 'grey'
}

function getAvatarColor(role) {
  const colors = {
    admin: 'red-8',
    instructor: 'orange-8',
    student: 'green-8'
  }
  return colors[role] || 'primary'
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

async function loadUsers() {
  try {
    loading.value = true
    
    // TODO: Implementar endpoint real para listar usuarios
    // Por ahora usamos datos mock
    users.value = [
      { id: 1, name: 'Administrador Sistema', email: 'admin@plataforma.com', role: 'admin', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-01-15', last_login: new Date().toISOString() },
      { id: 2, name: 'María López', email: 'maria@example.com', role: 'instructor', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-02-20', last_login: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, name: 'Juan Pérez', email: 'juan@example.com', role: 'student', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-05', last_login: new Date(Date.now() - 172800000).toISOString() },
      { id: 4, name: 'Ana García', email: 'ana@example.com', role: 'student', avatar: null, email_verified_at: null, created_at: '2024-03-10', last_login: null },
      { id: 5, name: 'Carlos Ruiz', email: 'carlos@example.com', role: 'instructor', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-12', last_login: new Date(Date.now() - 259200000).toISOString() },
      { id: 6, name: 'Pedro Martínez', email: 'pedro@example.com', role: 'student', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-15', last_login: new Date(Date.now() - 345600000).toISOString() },
      { id: 7, name: 'Laura Fernández', email: 'laura@example.com', role: 'student', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-18', last_login: new Date(Date.now() - 432000000).toISOString() },
      { id: 8, name: 'Sofía Rodríguez', email: 'sofia@example.com', role: 'instructor', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-20', last_login: new Date(Date.now() - 518400000).toISOString() },
      { id: 9, name: 'Diego Sánchez', email: 'diego@example.com', role: 'student', avatar: null, email_verified_at: null, created_at: '2024-03-22', last_login: null },
      { id: 10, name: 'Elena Gómez', email: 'elena@example.com', role: 'student', avatar: null, email_verified_at: new Date().toISOString(), created_at: '2024-03-25', last_login: new Date(Date.now() - 604800000).toISOString() }
    ]
    
    pagination.value.rowsNumber = users.value.length
    
    // Intento cargar datos reales
    // try {
    //   const response = await api.get('/admin/users', { params: { ...filters.value, ...pagination.value } })
    //   users.value = response.data.data
    //   pagination.value = response.data.meta
    // } catch (error) {
    //   console.log('Usando datos mock para usuarios:', error.message)
    // }
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    $q.notify({
      type: 'negative',
      message: 'Error cargando la lista de usuarios'
    })
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pagination.value.page = 1
  loadUsers()
}

function clearFilters() {
  filters.value = {
    search: '',
    role: '',
    status: ''
  }
  applyFilters()
}

function onRequest(props) {
  const { page, rowsPerPage } = props.pagination
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  loadUsers()
}

function viewUser(user) {
  $q.notify({
    message: `Ver usuario: ${user.name}`,
    color: 'info'
  })
}

function editUser(user) {
  $q.notify({
    message: `Editar usuario: ${user.name}`,
    color: 'warning'
  })
}

function confirmDelete(user) {
  selectedUser.value = user
  deleteDialog.value = true
}

async function deleteUser() {
  if (!selectedUser.value) return
  
  try {
    // TODO: Implementar eliminación real
    // await api.delete(`/admin/users/${selectedUser.value.id}`)
    
    $q.notify({
      type: 'positive',
      message: `Usuario ${selectedUser.value.name} eliminado correctamente`
    })
    
    // Recargar lista
    loadUsers()
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    $q.notify({
      type: 'negative',
      message: 'Error eliminando el usuario'
    })
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.q-table {
  th {
    font-weight: 600;
  }
}
</style>