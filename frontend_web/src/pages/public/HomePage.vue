<template>
  <q-page class="home-page">
    <!-- ─── Hero Section ────────────────────────────────────── -->
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div
        class="hero-content q-pa-xl animate-fade-in-up"
        style="max-width: 1200px; margin: 0 auto"
      >
        <div class="row items-center q-col-gutter-xl">
          <div class="col-12 col-md-7">
            <div class="badge-premium badge-primary q-mb-md">🚀 Plataforma de aprendizaje</div>
            <h1 class="hero-title q-mb-md">
              Aprende sin límites,<br />
              <span class="text-gradient">crece sin fronteras</span>
            </h1>
            <p class="hero-subtitle q-mb-xl" style="font-size: 1.1rem; max-width: 500px">
              Accede a cursos profesionales creados por expertos. Desde desarrollo de software hasta
              diseño y negocios.
            </p>
            <div class="row q-gutter-md">
              <q-btn
                class="btn-gradient"
                no-caps
                size="lg"
                label="Explorar cursos"
                icon-right="arrow_forward"
                to="/catalog"
              />
              <q-btn
                outline
                no-caps
                size="lg"
                label="Ver planes"
                color="white"
                text-color="white"
              />
            </div>

            <!-- Stats -->
            <div class="row q-gutter-xl q-mt-xl">
              <div v-for="stat in stats" :key="stat.label">
                <div class="text-h5 text-weight-bold text-gradient">{{ stat.value }}</div>
                <div style="color: #8b8ba7; font-size: 0.85rem">{{ stat.label }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-5 gt-sm">
            <div class="hero-visual">
              <div class="hero-card glass-card q-pa-lg">
                <q-icon name="play_circle" size="64px" color="primary" />
                <h4 class="q-mt-md q-mb-xs">Comienza hoy</h4>
                <p>Miles de horas de contenido te esperan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Featured Courses ────────────────────────────────── -->
    <section class="q-pa-xl" style="max-width: 1200px; margin: 0 auto">
      <div class="row items-center q-mb-lg">
        <div class="col">
          <h2 class="q-mb-xs">Cursos destacados</h2>
          <p>Los cursos más populares de nuestra plataforma</p>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            no-caps
            label="Ver todos"
            icon-right="arrow_forward"
            color="primary"
            to="/catalog"
          />
        </div>
      </div>

      <div v-if="loadingCourses" class="row q-gutter-lg">
        <div v-for="n in 3" :key="n" class="col-12 col-sm-6 col-md-4">
          <q-skeleton type="rect" height="200px" class="q-mb-sm" style="border-radius: 12px" dark />
          <q-skeleton type="text" dark />
          <q-skeleton type="text" width="60%" dark />
        </div>
      </div>

      <div v-else class="row q-gutter-lg">
        <div
          v-for="(course, i) in courses"
          :key="course.id"
          class="col-12 col-sm-6 col-md-4 animate-fade-in-up"
          :class="'animate-delay-' + (i + 1)"
        >
          <q-card
            class="course-card glass-card cursor-pointer"
            @click="$router.push('/courses/' + course.slug)"
          >
            <!-- Thumbnail -->
            <div class="course-thumb">
              <div class="course-thumb-placeholder">
                <q-icon name="play_circle_outline" size="48px" color="white" />
              </div>
              <div class="course-level badge-premium badge-primary">
                {{ levelLabel(course.level) }}
              </div>
            </div>

            <q-card-section>
              <div class="row items-center q-mb-sm">
                <q-avatar size="24px" color="primary" text-color="white" class="q-mr-sm">
                  <span style="font-size: 10px">{{ course.instructor?.name?.[0] }}</span>
                </q-avatar>
                <span style="color: #8b8ba7; font-size: 0.8rem">{{ course.instructor?.name }}</span>
              </div>

              <h4 class="course-title q-mb-sm" style="font-size: 1rem; line-height: 1.4">
                {{ course.title }}
              </h4>
              <p class="ellipsis-2-lines" style="font-size: 0.85rem">
                {{ course.short_description }}
              </p>

              <div class="row items-center justify-between q-mt-md">
                <div class="row items-center q-gutter-xs">
                  <q-icon name="people" color="grey-6" size="16px" />
                  <span style="color: #8b8ba7; font-size: 0.8rem"
                    >{{ course.total_students }} alumnos</span
                  >
                </div>
                <div class="text-h6 text-weight-bold" style="color: #00d2d3">
                  ${{ course.price }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <!-- ─── Categories ──────────────────────────────────────── -->
    <section class="q-pa-xl" style="max-width: 1200px; margin: 0 auto">
      <h2 class="q-mb-xs">Explora por categoría</h2>
      <p class="q-mb-lg">Encuentra cursos en el área que más te interese</p>

      <div class="row q-gutter-md">
        <div v-for="cat in categories" :key="cat.id" class="col-6 col-sm-4 col-md-2">
          <q-card
            class="category-card glass-card text-center cursor-pointer q-pa-md"
            @click="$router.push({ path: '/catalog', query: { category: cat.slug } })"
          >
            <q-icon :name="cat.icon || 'category'" size="36px" color="primary" />
            <div class="q-mt-sm text-weight-medium" style="font-size: 0.85rem">{{ cat.name }}</div>
            <div style="color: #5a5a7a; font-size: 0.75rem">{{ cat.courses_count }} cursos</div>
          </q-card>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'src/services/api'

const courses = ref([])
const categories = ref([])
const loadingCourses = ref(true)

const stats = [
  { value: '500+', label: 'Cursos' },
  { value: '50k+', label: 'Estudiantes' },
  { value: '100+', label: 'Instructores' },
]

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all_levels: 'Todos los niveles',
}

function levelLabel(level) {
  return levelLabels[level] || level
}

onMounted(async () => {
  try {
    const [coursesRes, catsRes] = await Promise.all([
      api.get('/courses', { params: { per_page: 6 } }),
      api.get('/categories'),
    ])
    courses.value = coursesRes.data.data
    categories.value = catsRes.data
  } catch (e) {
    console.error('Error loading home data:', e)
  } finally {
    loadingCourses.value = false
  }
})
</script>

<style lang="scss" scoped>
.hero-section {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0f0f23 0%, #1a1a3e 40%, #0f0f23 100%);

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%);
    top: -200px;
    right: -100px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(0, 210, 211, 0.1) 0%, transparent 70%);
    bottom: -100px;
    left: 10%;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;

  @media (max-width: 600px) {
    font-size: 2rem;
  }
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.hero-card {
  text-align: center;
  padding: 48px;
  animation: pulse-glow 3s infinite;
}

// Course cards
.course-card {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(108, 92, 231, 0.15);
  }
}

.course-thumb {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.course-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a3e 0%, #232350 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-level {
  position: absolute;
  top: 12px;
  left: 12px;
}

// Category cards
.category-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(108, 92, 231, 0.5);
  }
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
