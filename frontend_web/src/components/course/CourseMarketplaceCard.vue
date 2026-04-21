<template>
  <q-card flat bordered class="course-card">
    <div class="course-cover">
      <img v-if="course.thumbnail" :src="course.thumbnail" :alt="course.title" />
      <div v-else class="cover-fallback">
        <q-icon name="play_circle" size="50px" />
      </div>
    </div>

    <div class="course-card__body">
      <div class="row items-center justify-between q-mb-sm">
        <q-badge color="secondary" outline>
          {{ course.category?.name || 'General' }}
        </q-badge>

        <div class="row q-gutter-xs">
          <q-badge v-if="showGamificationBadge && course.has_interactive_activities" color="positive">
            Gamificado
          </q-badge>
          <q-badge v-if="course.is_level_locked" color="negative">
            Nivel {{ course.required_level }}
          </q-badge>
        </div>
      </div>

      <div class="text-h6 text-weight-bold title-clamp">
        {{ course.title }}
      </div>

      <div class="text-caption text-grey-5 q-mt-xs">
        {{ course.instructor?.name || 'Instructor' }} · {{ course.level || 'general' }}
      </div>

      <div class="text-body2 text-grey-5 q-mt-md card-summary">
        {{ course.short_description || course.description }}
      </div>

      <div class="row items-center justify-between q-mt-lg">
        <div class="text-h5 text-secondary text-weight-bold">
          {{ formatPrice(course.price) }}
        </div>

        <q-btn
          :color="course.is_level_locked ? 'negative' : buttonColor"
          no-caps
          :label="course.is_level_locked ? lockedLabel : actionLabel"
          @click.stop="$emit('open', course)"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup>
defineProps({
  course: {
    type: Object,
    required: true,
  },
  actionLabel: {
    type: String,
    default: 'Ver curso',
  },
  lockedLabel: {
    type: String,
    default: 'Ver requisitos',
  },
  buttonColor: {
    type: String,
    default: 'primary',
  },
  showGamificationBadge: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['open'])

function formatPrice(price) {
  return Number(price || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
</script>

<style scoped>
.course-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.2);
}

.course-cover {
  height: 220px;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  background: rgba(255, 255, 255, 0.04);
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  height: 100%;
  display: grid;
  place-items: center;
  color: #7f89c5;
  background: linear-gradient(135deg, rgba(88, 78, 182, 0.32), rgba(10, 222, 255, 0.12));
}

.course-card__body {
  padding: 18px 18px 20px;
}

.title-clamp {
  min-height: 78px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-summary {
  min-height: 76px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
