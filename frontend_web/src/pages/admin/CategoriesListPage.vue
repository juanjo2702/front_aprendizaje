<template>
  <q-page class="q-pa-lg">
    <!-- Header y acciones -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="text-h4 text-weight-bold">Gestión de Categorías</div>
        <div class="text-subtitle1 text-grey-7">
          Organiza los cursos por categorías
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add_circle"
          label="Nueva categoría"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Tabla de categorías -->
    <q-card>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="categories"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          bordered
        >
          <!-- Color -->
          <template #body-cell-color="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-icon
                  name="circle"
                  :color="props.row.color || 'primary'"
                  size="24px"
                  class="q-mr-sm"
                />
                <span>{{ props.row.color || 'default' }}</span>
              </div>
            </q-td>
          </template>

          <!-- Icono -->
          <template #body-cell-icon="props">
            <q-td :props="props">
              <q-icon :name="props.row.icon || 'category'" size="24px" />
            </q-td>
          </template>

          <!-- Cantidad de cursos -->
          <template #body-cell-courses_count="props">
            <q-td :props="props">
              <q-badge color="primary" rounded>
                {{ props.row.courses_count || 0 }}
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
                icon="edit"
                size="sm"
                @click="editCategory(props.row)"
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
                :disabled="(props.row.courses_count || 0) > 0"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Diálogo de creación/edición -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingCategory ? 'Editar categoría' : 'Nueva categoría' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveCategory">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="categoryForm.name"
                  label="Nombre de la categoría"
                  outlined
                  dense
                  :rules="[val => !!val || 'El nombre es requerido']"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="categoryForm.description"
                  label="Descripción"
                  outlined
                  dense
                  type="textarea"
                  rows="2"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="categoryForm.icon"
                  label="Icono"
                  outlined
                  dense
                  hint="Nombre del icono de Quasar (ej: school, code, design_services)"
                >
                  <template #append>
                    <q-icon :name="categoryForm.icon || 'help'" />
                  </template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input
                  v-model="categoryForm.color"
                  label="Color"
                  outlined
                  dense
                  hint="Color primario (ej: primary, secondary, red, green)"
                >
                  <template #append>
                    <q-icon
                      name="palette"
                      :color="categoryForm.color || 'primary'"
                    />
                  </template>
                </q-input>
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="categoryForm.is_active"
                  label="Categoría activa"
                  color="positive"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup @click="resetForm" />
          <q-btn flat label="Guardar" color="positive" @click="saveCategory" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo de confirmación de eliminación -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Eliminar categoría</div>
          <div class="text-subtitle2 q-mt-sm">
            ¿Estás seguro de eliminar la categoría <strong>{{ selectedCategory?.name }}</strong>?
            <span v-if="selectedCategory?.courses_count > 0" class="text-negative">
              <br />¡Advertencia! Esta categoría tiene {{ selectedCategory?.courses_count }} cursos asignados.
              No se puede eliminar hasta que muevas los cursos a otra categoría.
            </span>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            flat
            label="Eliminar"
            color="negative"
            @click="deleteCategory"
            v-close-popup
            :disabled="selectedCategory?.courses_count > 0"
          />
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
const showCreateDialog = ref(false)
const deleteDialog = ref(false)
const editingCategory = ref(null)
const selectedCategory = ref(null)

const categories = ref([])

const categoryForm = ref({
  name: '',
  description: '',
  icon: 'school',
  color: 'primary',
  is_active: true
})

const columns = [
  { name: 'icon', label: 'Icono', field: 'icon', align: 'center', style: 'width: 60px' },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'color', label: 'Color', field: 'color', align: 'left' },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'courses_count', label: 'Cursos', field: 'courses_count', align: 'center' },
  { name: 'is_active', label: 'Activa', field: 'is_active', align: 'center', format: (val) => val ? 'Sí' : 'No' },
  { name: 'created_at', label: 'Creada', field: 'created_at', align: 'center', format: (val) => formatDate(val) },
  { name: 'actions', label: 'Acciones', align: 'center', style: 'width: 100px' }
]

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}

async function loadCategories() {
  try {
    loading.value = true
    
    // Cargar categorías existentes
    const response = await api.get('/categories')
    categories.value = response.data.map(cat => ({
      ...cat,
      courses_count: cat.courses?.length || 0
    }))
  } catch (error) {
    console.error('Error cargando categorías:', error)
    $q.notify({
      type: 'negative',
      message: 'Error cargando la lista de categorías'
    })
  } finally {
    loading.value = false
  }
}

function editCategory(category) {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    icon: category.icon || 'school',
    color: category.color || 'primary',
    is_active: category.is_active !== false
  }
  showCreateDialog.value = true
}

async function saveCategory() {
  try {
    loading.value = true
    
    if (editingCategory.value) {
      // Actualizar categoría existente
      await api.put(`/categories/${editingCategory.value.id}`, categoryForm.value)
      $q.notify({
        type: 'positive',
        message: 'Categoría actualizada correctamente'
      })
    } else {
      // Crear nueva categoría
      await api.post('/categories', categoryForm.value)
      $q.notify({
        type: 'positive',
        message: 'Categoría creada correctamente'
      })
    }
    
    // Cerrar diálogo y recargar
    showCreateDialog.value = false
    resetForm()
    loadCategories()
  } catch (error) {
    console.error('Error guardando categoría:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error guardando la categoría'
    })
  } finally {
    loading.value = false
  }
}

function resetForm() {
  categoryForm.value = {
    name: '',
    description: '',
    icon: 'school',
    color: 'primary',
    is_active: true
  }
  editingCategory.value = null
}

function confirmDelete(category) {
  selectedCategory.value = category
  deleteDialog.value = true
}

async function deleteCategory() {
  if (!selectedCategory.value) return
  
  try {
    await api.delete(`/categories/${selectedCategory.value.id}`)
    
    $q.notify({
      type: 'positive',
      message: 'Categoría eliminada correctamente'
    })
    
    // Recargar lista
    loadCategories()
  } catch (error) {
    console.error('Error eliminando categoría:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error eliminando la categoría'
    })
  }
}

onMounted(() => {
  loadCategories()
})
</script>