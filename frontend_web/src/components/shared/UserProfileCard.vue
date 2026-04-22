<template>
  <div class="user-profile-card">
    <div class="user-profile-card__hero">
      <AvatarFrame
        :src="profile?.avatar"
        :name="profile?.name"
        :size="avatarSize"
        :frame-class="profile?.equipped_avatar_frame?.frame_class"
        :frame-svg="profile?.equipped_avatar_frame?.frame_svg"
      />

      <div class="user-profile-card__copy">
        <div class="text-h6 text-weight-bold">{{ profile?.name }}</div>
        <q-badge v-if="profile?.equipped_profile_title?.label" color="dark" text-color="warning" class="q-mt-xs">
          {{ profile.equipped_profile_title.label }}
        </q-badge>
        <div class="text-caption text-grey-5 q-mt-sm">
          Nivel {{ profile?.level || 1 }} · {{ profile?.level_title || 'Aprendiz' }}
        </div>
        <div v-if="profile?.headline" class="text-body2 q-mt-sm">
          {{ profile.headline }}
        </div>
        <div v-if="profile?.mini_bio" class="text-caption text-grey-5 q-mt-xs">
          {{ profile.mini_bio }}
        </div>
      </div>
    </div>

    <div class="user-profile-card__stats">
      <div class="mini-stat">
        <span>Racha</span>
        <strong>{{ profile?.streak || 0 }} días</strong>
      </div>
      <div class="mini-stat">
        <span>Marco</span>
        <strong>{{ profile?.equipped_avatar_frame?.name || 'Sin marco' }}</strong>
      </div>
      <div class="mini-stat">
        <span>Título</span>
        <strong>{{ profile?.equipped_profile_title?.label || 'Sin título' }}</strong>
      </div>
    </div>

    <div v-if="showBadges">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Medallas destacadas</div>
      <div v-if="profile?.top_badges?.length" class="badge-strip">
        <div v-for="badge in profile.top_badges" :key="badge.id" class="badge-card">
          <q-avatar size="52px">
            <img :src="badge.icon" :alt="badge.name" />
          </q-avatar>
          <div>
            <div class="text-weight-medium">{{ badge.name }}</div>
            <div class="text-caption text-grey-5">{{ badge.description }}</div>
          </div>
        </div>
      </div>
      <q-banner v-else rounded class="bg-dark text-grey-4">
        Este perfil todavía no muestra medallas destacadas.
      </q-banner>
    </div>
  </div>
</template>

<script setup>
import AvatarFrame from 'src/components/shared/AvatarFrame.vue'

defineProps({
  profile: {
    type: Object,
    default: null,
  },
  avatarSize: {
    type: Number,
    default: 84,
  },
  showBadges: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.user-profile-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.user-profile-card__hero {
  display: flex;
  gap: 18px;
  align-items: center;
}

.user-profile-card__copy {
  min-width: 0;
}

.user-profile-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.mini-stat,
.badge-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
}

.mini-stat {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-stat span {
  color: #97a0cc;
  font-size: 0.78rem;
}

.badge-strip {
  display: grid;
  gap: 12px;
}

.badge-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  align-items: center;
}

@media (max-width: 700px) {
  .user-profile-card__hero,
  .badge-card,
  .user-profile-card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
