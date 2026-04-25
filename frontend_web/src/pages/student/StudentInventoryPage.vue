<template>
  <q-page class="student-page" data-cy="student-inventory-page">
    <section class="locker-grid">
      <q-card flat bordered class="locker-card locker-card--hero">
        <div class="text-overline text-secondary">My Locker</div>
        <div class="text-h4 text-weight-bold q-mt-sm">Cosméticos, títulos y cupones en un solo lugar</div>
        <div class="text-caption text-grey-5 q-mt-sm">
          Equipa tu estilo visual y usa tus cupones en el checkout cuando compres un curso.
        </div>

        <div class="locker-badges">
          <q-chip outline color="secondary">Nivel {{ gamificationSummary.level }}</q-chip>
          <q-chip outline color="warning" text-color="warning">Monedas {{ gamificationSummary.coins }}</q-chip>
          <q-chip flat color="dark">{{ gamificationSummary.levelTitle }}</q-chip>
        </div>
      </q-card>

      <q-card flat bordered class="locker-card profile-preview">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Mini-perfil público</div>
            <div class="text-caption text-grey-5">Así te verán en comentarios y ranking.</div>
          </div>
          <q-btn flat round dense icon="edit" color="secondary" :to="{ name: 'student-profile' }" />
        </div>

        <div class="profile-preview__body">
          <AvatarConMarco
            :src="auth.user?.avatar"
            :name="auth.user?.name"
            :size="96"
            :frame-class="previewFrame?.frame_class"
            :frame-svg="previewFrame?.frame_svg"
          />
          <div>
            <div class="text-h6 text-weight-bold">{{ auth.user?.name }}</div>
            <div v-if="previewTitles.length" class="title-chip-row q-mt-xs">
              <q-badge
                v-for="title in previewTitles"
                :key="title.user_item_id || title.label"
                color="dark"
                text-color="warning"
              >
                {{ title.label }}
              </q-badge>
            </div>
            <div class="text-caption text-secondary q-mt-sm">
              {{ activeFrameLabel }}
            </div>
            <div class="text-caption text-grey-5 q-mt-sm">
              Nivel {{ gamificationSummary.level }} · Racha {{ gamificationSummary.streak || 0 }} días
            </div>
          </div>
        </div>

        <q-banner rounded class="bg-dark text-grey-4 q-mt-md">
          La previsualización cambia al seleccionar un cosmético del vestidor. El cambio real se confirma con
          <strong>Equipar</strong> o <strong>Quitar</strong>.
        </q-banner>
      </q-card>
    </section>

    <section class="inventory-layout">
      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Vestidor de marcos</div>
            <div class="text-caption text-grey-5">Solo puedes tener un marco activo a la vez.</div>
          </div>
        </div>

        <div v-if="inventoryLoading" class="row q-col-gutter-md">
          <div v-for="n in 4" :key="`frame-skeleton-${n}`" class="col-12 col-md-6">
            <q-skeleton dark type="rect" height="180px" />
          </div>
        </div>

        <div v-else-if="!frames.length" class="empty-card">
          <q-icon name="style" size="42px" color="grey-6" />
          <div class="text-weight-medium q-mt-sm">Todavía no tienes marcos comprados</div>
          <div class="text-caption text-grey-5">Visita la Coin Shop para desbloquear nuevos estilos de avatar.</div>
        </div>

        <div v-else class="locker-items-grid">
          <q-card
            v-for="item in frames"
            :key="item.id"
            flat
            bordered
            class="locker-item"
            :data-cy="`inventory-frame-card-${item.id}`"
            :class="{ 'locker-item--selected': selectedFrameId === item.id }"
            @click="selectedFrameId = item.id"
          >
            <AvatarConMarco
              :src="auth.user?.avatar"
              :name="auth.user?.name"
              :size="72"
              :frame-class="item.frame?.frame_class"
              :frame-svg="item.frame?.frame_svg"
            />
            <div class="text-weight-bold q-mt-md">{{ item.shop_item?.name }}</div>
            <div class="text-caption text-grey-5 q-mt-xs">
              {{ item.shop_item?.description || 'Marco cosmético para tu mini-perfil.' }}
            </div>
            <div class="row q-gutter-sm q-mt-md justify-center">
              <q-badge v-if="item.is_equipped" color="positive">Equipado</q-badge>
              <q-badge v-else outline color="secondary">Disponible</q-badge>
            </div>
            <div class="row q-gutter-sm q-mt-md justify-center">
              <q-btn
                color="primary"
                no-caps
                :data-cy="`inventory-frame-equip-btn-${item.id}`"
                :loading="equipingItemId === item.id"
                :label="item.is_equipped ? 'Quitar' : 'Equipar'"
                @click.stop="toggleEquip(item)"
              />
            </div>
          </q-card>
        </div>
      </q-card>

      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Títulos comprados</div>
            <div class="text-caption text-grey-5">Puedes mostrar hasta 3 títulos al mismo tiempo en tu mini-perfil y presencia social.</div>
          </div>
          <q-badge color="secondary" outline>{{ equippedTitleCount }}/3 activos</q-badge>
        </div>

        <div v-if="inventoryLoading" class="row q-col-gutter-md">
          <div v-for="n in 4" :key="`title-skeleton-${n}`" class="col-12 col-md-6">
            <q-skeleton dark type="rect" height="160px" />
          </div>
        </div>

        <div v-else-if="!titles.length" class="empty-card">
          <q-icon name="workspace_premium" size="42px" color="grey-6" />
          <div class="text-weight-medium q-mt-sm">Aún no desbloqueaste títulos</div>
          <div class="text-caption text-grey-5">Los títulos aparecen junto a tu nombre en comentarios y leaderboards.</div>
        </div>

        <div v-else class="title-grid">
          <q-card
            v-for="item in titles"
            :key="item.id"
            flat
            bordered
            class="title-card"
            :data-cy="`inventory-title-card-${item.id}`"
            :class="{ 'locker-item--selected': selectedTitleId === item.id }"
            @click="selectedTitleId = item.id"
          >
            <q-badge color="dark" text-color="warning">{{ item.title?.label || item.shop_item?.name }}</q-badge>
            <div class="text-caption text-grey-5 q-mt-md">
              {{ item.shop_item?.description || 'Título cosmético visible en tu presencia social.' }}
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-badge v-if="item.is_equipped" color="positive">Activo</q-badge>
              <q-badge v-else outline color="secondary">Disponible</q-badge>
            </div>
            <q-btn
              class="q-mt-md"
              color="primary"
              no-caps
              :data-cy="`inventory-title-equip-btn-${item.id}`"
              :loading="equipingItemId === item.id"
              :disable="!item.is_equipped && equippedTitleCount >= 3"
              :label="item.is_equipped ? 'Quitar' : 'Equipar'"
              @click.stop="toggleEquip(item)"
            />
          </q-card>
        </div>
      </q-card>
    </section>

    <section class="inventory-layout">
      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Panel de cupones</div>
            <div class="text-caption text-grey-5">Copia el código y úsalo en el checkout de cursos.</div>
          </div>
        </div>

        <div v-if="inventoryLoading" class="row q-col-gutter-md">
          <div v-for="n in 3" :key="`coupon-skeleton-${n}`" class="col-12">
            <q-skeleton dark type="rect" height="94px" />
          </div>
        </div>

        <div v-else-if="!coupons.length" class="empty-card">
          <q-icon name="sell" size="42px" color="grey-6" />
          <div class="text-weight-medium q-mt-sm">No tienes cupones activos</div>
          <div class="text-caption text-grey-5">Los cupones que compres aparecerán aquí con su código listo para copiar.</div>
        </div>

        <div v-else class="coupon-list">
          <q-card v-for="coupon in coupons" :key="coupon.id" flat bordered class="coupon-card" :data-cy="`inventory-coupon-card-${coupon.id}`">
            <div>
              <div class="text-weight-bold">{{ coupon.shop_item?.name || 'Cupón' }}</div>
              <div class="text-caption text-grey-5 q-mt-xs">
                {{ coupon.discount_percent }}% de descuento · {{ coupon.shop_item?.description }}
              </div>
              <div class="coupon-code q-mt-md">{{ coupon.code }}</div>
            </div>

            <div class="coupon-actions">
              <q-badge v-if="coupon.is_used" color="negative">Ya utilizado</q-badge>
              <q-badge v-else color="positive">Disponible</q-badge>
              <q-btn
                v-if="!coupon.is_used"
                outline
                color="secondary"
                no-caps
                :data-cy="`coupon-copy-btn-${coupon.id}`"
                icon="content_copy"
                label="Copiar código"
                @click="copyCoupon(coupon.code)"
              />
            </div>
          </q-card>
        </div>
      </q-card>

      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Vitrina de medallas</div>
            <div class="text-caption text-grey-5">Tus logros activos y los que aún están bloqueados.</div>
          </div>
        </div>

        <div v-if="inventoryLoading" class="row q-col-gutter-md">
          <div v-for="n in 8" :key="n" class="col-6 col-md-3">
            <q-skeleton dark type="rect" height="150px" />
          </div>
        </div>

        <div v-else class="badge-grid">
          <q-card v-for="badge in badgesUnlocked" :key="`unlocked-${badge.id}`" flat bordered class="badge-card unlocked">
            <q-avatar size="72px" class="q-mb-md">
              <img :src="badge.icon" :alt="badge.name" />
            </q-avatar>
            <div class="text-weight-bold">{{ badge.name }}</div>
            <div class="text-caption text-grey-5">{{ badge.description }}</div>
          </q-card>

          <q-card v-for="badge in badgesLocked" :key="`locked-${badge.id}`" flat bordered class="badge-card locked">
            <q-avatar size="72px" class="q-mb-md locked-avatar">
              <img :src="badge.icon" :alt="badge.name" />
            </q-avatar>
            <div class="text-weight-bold">{{ badge.name }}</div>
            <div class="text-caption text-grey-5">{{ badge.progress || 0 }}% para desbloquear</div>
          </q-card>
        </div>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useStudentStore } from 'src/stores/student'
import AvatarConMarco from 'src/components/shared/AvatarConMarco.vue'

const $q = useQuasar()
const auth = useAuthStore()
const studentStore = useStudentStore()
const { badgesUnlocked, badgesLocked, inventoryLoading, inventory, gamificationSummary } = storeToRefs(studentStore)

const equipingItemId = ref(null)
const selectedFrameId = ref(null)
const selectedTitleId = ref(null)

const frames = computed(() => inventory.value?.locker?.frames || [])
const titles = computed(() => inventory.value?.locker?.titles || [])
const coupons = computed(() => inventory.value?.locker?.coupons || [])

const selectedFrame = computed(() => frames.value.find((item) => item.id === selectedFrameId.value) || null)
const selectedTitle = computed(() => titles.value.find((item) => item.id === selectedTitleId.value) || null)
const equippedTitles = computed(() => inventory.value?.equipped?.titles || auth.user?.equipped_profile_titles || [])
const equippedTitleCount = computed(() => titles.value.filter((item) => item.is_equipped).length)

const previewFrame = computed(() => (
  selectedFrameId.value
    ? (selectedFrame.value?.frame || null)
    : (inventory.value?.equipped?.frame || auth.user?.equipped_avatar_frame || null)
))
const previewTitles = computed(() => {
  if (selectedTitle.value?.is_equipped === false && equippedTitleCount.value < 3) {
    return [...equippedTitles.value, selectedTitle.value.title].slice(0, 3).filter(Boolean)
  }

  return equippedTitles.value.length
    ? equippedTitles.value
    : (inventory.value?.equipped?.title ? [inventory.value.equipped.title] : (auth.user?.equipped_profile_title ? [auth.user.equipped_profile_title] : []))
})
const activeFrameLabel = computed(() => {
  const frameName = selectedFrame.value?.shop_item?.name
    || frames.value.find((item) => item.is_equipped)?.shop_item?.name
    || inventory.value?.equipped?.frame?.name
    || auth.user?.equipped_avatar_frame?.name

  return frameName ? `Marco activo: ${frameName}` : 'No tienes un marco equipado todavía.'
})

watch(
  frames,
  (value) => {
    const equipped = value.find((item) => item.is_equipped)
    selectedFrameId.value = equipped?.id || null
  },
  { immediate: true },
)

watch(
  titles,
  (value) => {
    const equipped = value.find((item) => item.is_equipped)
    selectedTitleId.value = equipped?.id || null
  },
  { immediate: true },
)

onMounted(() => {
  studentStore.loadInventory()
})

async function toggleEquip(item) {
  equipingItemId.value = item.id
  try {
    const response = await studentStore.equipInventoryItem(item.id, !item.is_equipped)
    $q.notify({
      type: 'positive',
      message: response?.message || 'Inventario actualizado.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo actualizar el vestidor.',
    })
  } finally {
    equipingItemId.value = null
  }
}

async function copyCoupon(code) {
  try {
    await navigator.clipboard.writeText(code)
    $q.notify({
      type: 'positive',
      message: 'Código copiado al portapapeles.',
    })
  } catch {
    $q.notify({
      type: 'warning',
      message: `No se pudo copiar automáticamente. Código: ${code}`,
    })
  }
}
</script>

<style scoped>
.student-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.locker-grid,
.inventory-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.locker-card,
.inventory-card,
.badge-card,
.locker-item,
.title-card,
.coupon-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.locker-card,
.inventory-card {
  border-radius: 28px;
  padding: 22px;
}

.locker-card--hero {
  background:
    radial-gradient(circle at top left, rgba(94, 107, 255, 0.26), transparent 40%),
    linear-gradient(160deg, rgba(11, 16, 39, 0.98), rgba(17, 22, 48, 0.96));
}

.locker-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.profile-preview__body {
  display: flex;
  gap: 18px;
  align-items: center;
}

.title-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.locker-items-grid,
.title-grid,
.badge-grid {
  display: grid;
  gap: 16px;
}

.locker-items-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.title-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.locker-item,
.title-card,
.badge-card {
  border-radius: 22px;
  padding: 20px;
}

.locker-item {
  text-align: center;
  cursor: pointer;
}

.locker-item--selected {
  box-shadow: 0 0 0 1px rgba(32, 213, 236, 0.32);
}

.coupon-list {
  display: grid;
  gap: 14px;
}

.coupon-card {
  border-radius: 22px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.coupon-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.coupon-code {
  display: inline-flex;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #20d5ec;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.empty-card {
  min-height: 180px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.02);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 18px;
}

.badge-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.badge-card {
  text-align: center;
}

.badge-card.unlocked {
  box-shadow: 0 0 0 1px rgba(32, 213, 236, 0.18);
}

.badge-card.locked {
  opacity: 0.72;
}

.locked-avatar {
  filter: grayscale(1);
}

@media (max-width: 1100px) {
  .locker-grid,
  .inventory-layout,
  .locker-items-grid,
  .title-grid,
  .badge-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .student-page {
    padding: 18px;
  }

  .profile-preview__body,
  .coupon-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .coupon-actions {
    width: 100%;
    align-items: stretch;
  }
}
</style>
