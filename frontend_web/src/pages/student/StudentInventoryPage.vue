<template>
  <q-page class="student-page">
    <section class="inventory-hero">
      <q-card flat bordered class="hero-panel">
        <div class="text-overline text-secondary">Inventario del estudiante</div>
        <div class="text-h4 text-weight-bold q-mt-sm">{{ auth.user?.name }}</div>
        <div class="text-caption text-grey-5 q-mt-sm">
          Perfil, medallas desbloqueadas y progreso de coleccion.
        </div>
        <div class="row q-gutter-sm q-mt-md">
          <q-chip outline color="secondary">Nivel {{ gamificationSummary.level }}</q-chip>
          <q-chip outline color="warning" text-color="warning">Monedas {{ gamificationSummary.coins }}</q-chip>
          <q-chip flat color="dark">{{ gamificationSummary.levelTitle }}</q-chip>
        </div>
      </q-card>
    </section>

    <section class="inventory-grid">
      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Cosméticos y títulos</div>
            <div class="text-caption text-grey-5">Recompensas activas compradas con monedas.</div>
          </div>
        </div>

        <div class="reward-grid">
          <q-card v-for="purchase in inventory.purchasedCosmetics" :key="purchase.id" flat bordered class="reward-card">
            <q-icon name="style" size="38px" color="secondary" />
            <div class="text-weight-bold q-mt-md">{{ purchase.shopItem?.name }}</div>
            <div class="text-caption text-grey-5">{{ purchase.metadata?.frame_style || 'Cosmético visual activo' }}</div>
          </q-card>

          <q-card v-for="purchase in inventory.ownedTitles" :key="purchase.id" flat bordered class="reward-card">
            <q-icon name="workspace_premium" size="38px" color="warning" />
            <div class="text-weight-bold q-mt-md">{{ purchase.metadata?.title || purchase.shopItem?.name }}</div>
            <div class="text-caption text-grey-5">Visible en perfil y comentarios.</div>
          </q-card>

          <q-card v-if="!inventory.purchasedCosmetics.length && !inventory.ownedTitles.length" flat bordered class="reward-card empty-card">
            <q-icon name="redeem" size="42px" color="grey-6" />
            <div class="text-weight-medium q-mt-md">Todavía no compraste recompensas</div>
            <div class="text-caption text-grey-5 q-mt-xs">La Coin Shop ya está lista para desbloquear cosméticos y perks.</div>
          </q-card>
        </div>
      </q-card>

      <q-card flat bordered class="inventory-card">
        <div class="section-head">
          <div>
            <div class="text-h6 text-weight-bold">Vitrina de medallas</div>
            <div class="text-caption text-grey-5">Tus logros activos y los que aun estan bloqueados.</div>
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
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import { useStudentStore } from 'src/stores/student'

const auth = useAuthStore()
const studentStore = useStudentStore()
const { badgesUnlocked, badgesLocked, inventoryLoading, inventory, gamificationSummary } = storeToRefs(studentStore)

onMounted(() => {
  studentStore.loadInventory()
})
</script>

<style scoped>
.student-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.hero-panel,
.inventory-card,
.badge-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.hero-panel,
.inventory-card {
  border-radius: 28px;
  padding: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.badge-card {
  border-radius: 24px;
  padding: 20px;
  text-align: center;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.reward-card {
  border-radius: 22px;
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.empty-card {
  grid-column: 1 / -1;
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

@media (max-width: 1000px) {
  .reward-grid,
  .badge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
