<template>
  <q-page class="student-page" data-cy="student-shop-page">
    <section class="hero-grid">
      <q-card flat bordered class="hero-card hero-card--primary">
        <div class="text-overline text-secondary">Coin Shop</div>
        <div class="text-h4 text-weight-bold q-mt-sm">Dale utilidad real a tus monedas</div>
        <div class="text-caption text-grey-5 q-mt-sm">
          Compra descuentos, cosméticos y contenido premium desbloqueable por nivel.
        </div>

        <div class="hero-stats">
          <div class="hero-stat">
            <span>Monedas disponibles</span>
            <strong>{{ gamificationSummary.coins }}</strong>
          </div>
          <div class="hero-stat">
            <span>Ganadas</span>
            <strong>{{ gamificationSummary.earnedCoins }}</strong>
          </div>
          <div class="hero-stat">
            <span>Gastadas</span>
            <strong>{{ gamificationSummary.spentCoins }}</strong>
          </div>
        </div>

        <q-linear-progress
          rounded
          size="10px"
          color="secondary"
          :value="gamificationSummary.progress"
        />
        <div class="text-caption text-grey-5 q-mt-sm">
          Nivel {{ gamificationSummary.level }} · {{ gamificationSummary.levelTitle }}
        </div>
      </q-card>

      <q-card flat bordered class="hero-card">
        <div class="text-h6 text-weight-bold">Lo que puedes desbloquear</div>
        <q-list dark separator class="q-mt-sm">
          <q-item>
            <q-item-section avatar><q-icon name="sell" color="warning" /></q-item-section>
            <q-item-section>
              <q-item-label>Cupones de descuento</q-item-label>
              <q-item-label caption>Reduce el precio de tu próxima compra.</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="auto_awesome" color="secondary" /></q-item-section>
            <q-item-section>
              <q-item-label>Cosméticos</q-item-label>
              <q-item-label caption>Marcos de avatar y títulos visibles en comentarios.</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="lock_open" color="positive" /></q-item-section>
            <q-item-section>
              <q-item-label>Contenido premium</q-item-label>
              <q-item-label caption>Accesos bonus, packs y recursos especiales.</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </section>

    <q-card flat bordered class="filter-card">
      <div class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-lg-8">
          <q-btn-toggle
            v-model="selectedType"
            no-caps
            unelevated
            toggle-color="primary"
            color="dark"
            text-color="grey-4"
            :options="typeOptions"
          />
        </div>
        <div class="col-12 col-lg-4 row justify-end">
          <q-btn flat no-caps color="grey-4" icon="refresh" label="Recargar tienda" @click="reloadShop" />
        </div>
      </div>
    </q-card>

    <div v-if="shopLoading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-xl-4">
        <q-skeleton dark type="rect" height="220px" />
      </div>
    </div>

    <div v-else class="shop-grid">
      <q-card v-for="item in shop.items" :key="item.id" flat bordered class="shop-card" :data-cy="`shop-item-card-${item.id}`">
        <div class="row items-start justify-between q-mb-md">
          <div>
            <q-badge outline color="secondary">{{ typeLabel(item.type) }}</q-badge>
            <div class="text-h6 text-weight-bold q-mt-sm">{{ item.name }}</div>
          </div>
          <q-chip color="warning" text-color="dark" icon="toll">
            {{ item.cost_coins }}
          </q-chip>
        </div>

        <div class="text-body2 text-grey-4">{{ item.description }}</div>

        <div class="meta-list q-mt-md">
          <div><q-icon name="military_tech" class="q-mr-sm" /> Nivel {{ item.minimum_level_required }}</div>
          <div v-if="item.course"><q-icon name="school" class="q-mr-sm" /> {{ item.course.title }}</div>
          <div v-if="item.lesson"><q-icon name="auto_stories" class="q-mr-sm" /> {{ item.lesson.title }}</div>
        </div>

        <div class="row q-gutter-sm q-mt-lg">
          <q-badge v-if="item.already_owned" color="positive">Ya lo tienes</q-badge>
          <q-badge v-else-if="item.locked_by_level" color="negative">Bloqueado por nivel</q-badge>
          <q-badge v-else-if="!item.can_afford" color="orange">Monedas insuficientes</q-badge>
        </div>

        <div class="row justify-between items-center q-mt-lg">
          <div class="text-caption text-grey-5">
            {{ item.owned_count ? `Comprado ${item.owned_count} vez/veces` : 'Aún no comprado' }}
          </div>
          <q-btn
            color="primary"
            no-caps
            :data-cy="`shop-item-buy-btn-${item.id}`"
            :disable="item.already_owned || item.locked_by_level || !item.can_afford"
            :loading="purchasingId === item.id"
            label="Comprar"
            @click="purchaseItem(item)"
          />
        </div>
      </q-card>
    </div>

    <q-card flat bordered class="purchase-card">
      <div class="section-head">
        <div>
          <div class="text-h6 text-weight-bold">Historial de canjes</div>
          <div class="text-caption text-grey-5">Tus últimas compras y recompensas activas.</div>
        </div>
      </div>

      <q-list v-if="shop.purchases.length" dark separator>
        <q-item v-for="purchase in shop.purchases.slice(0, 8)" :key="purchase.id">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              <q-icon :name="typeIcon(purchase.shopItem?.type)" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ purchase.shopItem?.name || 'Recompensa' }}</q-item-label>
            <q-item-label caption>
              {{ typeLabel(purchase.shopItem?.type) }} · {{ purchase.costCoins }} monedas
            </q-item-label>
          </q-item-section>
          <q-item-section side class="text-caption text-grey-6">
            {{ formatDate(purchase.purchasedAt) }}
          </q-item-section>
        </q-item>
      </q-list>
      <div v-else class="text-grey-5">Cuando compres algo con monedas, aparecerá aquí.</div>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useStudentStore } from 'src/stores/student'

const $q = useQuasar()
const studentStore = useStudentStore()
const { gamificationSummary, shop, shopLoading } = storeToRefs(studentStore)

const selectedType = ref(null)
const purchasingId = ref(null)

const typeOptions = [
  { label: 'Todos', value: null },
  { label: 'Descuentos', value: 'discount_coupon' },
  { label: 'Premium', value: 'premium_content' },
  { label: 'Cosméticos', value: 'avatar_frame' },
  { label: 'Títulos', value: 'profile_title' },
]

onMounted(async () => {
  await Promise.all([studentStore.loadShop(), studentStore.loadPurchases()])
})

watch(selectedType, (value) => {
  studentStore.loadShop({ type: value })
})

function typeLabel(type) {
  return (
    {
      discount_coupon: 'Cupón',
      premium_content: 'Premium',
      avatar_frame: 'Marco avatar',
      profile_title: 'Título',
    }[type] || 'Recompensa'
  )
}

function typeIcon(type) {
  return (
    {
      discount_coupon: 'sell',
      premium_content: 'lock_open',
      avatar_frame: 'style',
      profile_title: 'workspace_premium',
    }[type] || 'redeem'
  )
}

function formatDate(value) {
  if (!value) return ''

  return new Date(value).toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
  })
}

async function reloadShop() {
  await Promise.all([
    studentStore.loadShop({ type: selectedType.value }),
    studentStore.loadPurchases(),
    studentStore.loadDashboard(),
  ])
}

async function purchaseItem(item) {
  purchasingId.value = item.id

  try {
    const response = await studentStore.purchaseShopItem(item.id)
    $q.notify({
      type: 'positive',
      message: response?.message || 'Compra realizada correctamente.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.response?.data?.message || 'No se pudo completar la compra.',
    })
  } finally {
    purchasingId.value = null
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

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 22px;
}

.hero-card,
.filter-card,
.shop-card,
.purchase-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 28px;
}

.hero-card,
.purchase-card {
  padding: 22px;
}

.hero-card--primary {
  background:
    radial-gradient(circle at top right, rgba(255, 183, 77, 0.18), transparent 38%),
    linear-gradient(160deg, rgba(12, 18, 41, 0.98), rgba(18, 26, 58, 0.96));
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0;
}

.hero-stat {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-card {
  padding: 18px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.shop-card {
  padding: 20px;
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #9da6d7;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 14px;
}

@media (max-width: 1100px) {
  .hero-grid,
  .shop-grid {
    grid-template-columns: 1fr;
  }
}
</style>
