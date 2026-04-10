<template>
  <q-page class="course-detail q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <div v-if="loading" class="q-py-xl">
      <q-skeleton type="rect" height="300px" dark style="border-radius: 16px" />
      <q-skeleton type="text" dark width="60%" class="q-mt-lg" style="height: 40px" />
      <q-skeleton type="text" dark width="40%" />
    </div>

    <div v-else-if="course" class="animate-fade-in-up">
      <!-- Hero Banner -->
      <div class="course-hero glass-card q-pa-xl q-mb-xl">
        <div class="row q-gutter-xl">
          <div class="col-12 col-md-7">
            <div class="row items-center q-gutter-sm q-mb-md">
              <span class="badge-premium badge-primary">{{ course.category?.name }}</span>
              <span class="badge-premium badge-success">{{ levelLabel(course.level) }}</span>
            </div>
            <h1 style="font-size: 2rem; line-height: 1.2" class="q-mb-md">{{ course.title }}</h1>
            <p style="font-size: 1rem; color: #eaeaf5">{{ course.short_description }}</p>

            <div class="row items-center q-gutter-md q-mt-lg">
              <q-avatar size="40px" color="primary" text-color="white">
                <span>{{ course.instructor?.name?.[0] }}</span>
              </q-avatar>
              <div>
                <div class="text-weight-bold">{{ course.instructor?.name }}</div>
                <div style="color: #8b8ba7; font-size: 0.8rem">Instructor</div>
              </div>
            </div>

            <div
              class="row items-center q-gutter-lg q-mt-lg"
              style="color: #8b8ba7; font-size: 0.85rem"
            >
              <div>
                <q-icon name="people" class="q-mr-xs" />{{ course.total_students }} estudiantes
              </div>
              <div>
                <q-icon name="language" class="q-mr-xs" />{{ course.language?.toUpperCase() }}
              </div>
            </div>
          </div>

          <div class="col-12 col-md-5">
            <q-card class="glass-card q-pa-lg text-center">
              <div class="text-h3 text-weight-bold q-mb-md" style="color: #00d2d3">
                ${{ course.price }}
              </div>
              <q-btn
                class="btn-gradient full-width q-mb-sm"
                no-caps
                size="lg"
                label="Inscribirme ahora"
                icon="shopping_cart"
                @click="$refs.checkoutModal.open()"
              />
              <q-btn
                outline
                color="white"
                text-color="white"
                class="full-width"
                no-caps
                label="Añadir a favoritos"
                icon="favorite_border"
              />
              <div class="q-mt-md" style="color: #5a5a7a; font-size: 0.8rem">
                Acceso de por vida · Certificado incluido
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Course Content -->
      <div class="row q-gutter-xl">
        <div class="col-12 col-md-8">
          <!-- What you'll learn -->
          <div v-if="course.what_you_learn?.length" class="glass-card q-pa-lg q-mb-lg">
            <h3 class="q-mb-md">Lo que aprenderás</h3>
            <div class="row q-gutter-sm">
              <div
                v-for="(item, i) in course.what_you_learn"
                :key="i"
                class="col-12 col-sm-6 row items-start q-gutter-sm"
              >
                <q-icon name="check_circle" color="positive" size="20px" class="q-mt-xs" />
                <span class="col" style="font-size: 0.9rem; color: #eaeaf5">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Curriculum -->
          <div class="q-mb-lg">
            <h3 class="q-mb-md">Contenido del curso</h3>
            <q-expansion-item
              v-for="mod in course.modules"
              :key="mod.id"
              class="glass-card q-mb-sm"
              style="border-radius: 12px; overflow: hidden"
              expand-icon-class="text-white"
              header-class="text-white"
            >
              <template #header>
                <q-item-section avatar>
                  <q-icon name="folder" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ mod.title }}</q-item-label>
                  <q-item-label caption>{{ mod.lessons?.length }} lecciones</q-item-label>
                </q-item-section>
              </template>
              <q-list separator dark>
                <q-item v-for="lesson in mod.lessons" :key="lesson.id" class="q-pl-xl">
                  <q-item-section avatar>
                    <q-icon
                      :name="lesson.type === 'video' ? 'play_circle' : 'article'"
                      :color="lesson.is_free ? 'positive' : 'grey-6'"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ lesson.title }}</q-item-label>
                    <q-item-label caption>{{ formatDuration(lesson.duration) }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="lesson.is_free" side>
                    <span class="badge-premium badge-success" style="font-size: 0.65rem"
                      >GRATIS</span
                    >
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </div>

          <!-- Requirements -->
          <div v-if="course.requirements?.length" class="glass-card q-pa-lg q-mb-lg">
            <h3 class="q-mb-md">Requisitos</h3>
            <ul style="color: #eaeaf5; padding-left: 20px">
              <li v-for="(req, i) in course.requirements" :key="i" class="q-mb-sm">{{ req }}</li>
            </ul>
          </div>

          <!-- Description -->
          <div class="glass-card q-pa-lg">
            <h3 class="q-mb-md">Descripción</h3>
            <p style="color: #eaeaf5; white-space: pre-line">{{ course.description }}</p>
          </div>
        </div>

        <!-- Sidebar: Instructor -->
        <div class="col-12 col-md-4">
          <div class="glass-card q-pa-lg text-center">
            <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
              <span class="text-h4">{{ course.instructor?.name?.[0] }}</span>
            </q-avatar>
            <h4 class="q-mb-xs">{{ course.instructor?.name }}</h4>
            <p style="font-size: 0.85rem">{{ course.instructor?.bio }}</p>
          </div>
        </div>
      </div>
    </div>

    <CheckoutModal ref="checkoutModal" :course="course" />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/services/api'
import CheckoutModal from 'src/components/CheckoutModal.vue'

const route = useRoute()
const course = ref(null)
const loading = ref(true)
const checkoutModal = ref(null)

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all_levels: 'Todos los niveles',
}

function levelLabel(l) {
  return levelLabels[l] || l
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min` : `${s} seg`
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/courses/${route.params.slug}`)
    course.value = data
  } catch (e) {
    console.error('Error loading course:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.course-hero {
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(26, 26, 62, 0.8), rgba(35, 35, 80, 0.6));
}
</style>
