<template>
  <q-page class="student-page">
    <div class="section-head">
      <div>
        <div class="text-h4 text-weight-bold">Mi aprendizaje</div>
        <div class="text-caption text-grey-5">Tus cursos inscritos, ordenados para volver al flujo rapido.</div>
      </div>
    </div>

    <q-card flat bordered class="filter-card">
      <div class="filter-grid">
        <q-select v-model="status" outlined dense emit-value map-options label="Estado" :options="statusOptions" />
        <q-select v-model="sort" outlined dense emit-value map-options label="Orden" :options="sortOptions" />
      </div>
    </q-card>

    <div v-if="learningLoading" class="row q-col-gutter-md">
      <div v-for="n in 6" :key="n" class="col-12 col-lg-6">
        <q-skeleton dark type="rect" height="160px" />
      </div>
    </div>

    <div v-else class="learning-grid">
      <q-card v-for="entry in learningCourses" :key="entry.id" flat bordered class="learning-card">
        <div class="row items-center justify-between">
          <div>
            <div class="text-overline text-secondary">{{ entry.course.instructor || 'Instructor' }}</div>
            <div class="text-h6 text-weight-bold">{{ entry.course.title }}</div>
            <div class="text-caption text-grey-5">{{ entry.course.level }} · {{ entry.course.language || 'ES' }}</div>
          </div>
          <q-circular-progress
            show-value
            font-size="12px"
            color="secondary"
            track-color="rgba(255,255,255,0.08)"
            size="68px"
            :value="entry.progress"
          >
            {{ entry.progress }}%
          </q-circular-progress>
        </div>

        <q-linear-progress class="q-mt-md" rounded size="10px" color="primary" :value="entry.progress / 100" />

        <div class="row q-gutter-sm q-mt-lg">
          <q-btn color="primary" no-caps label="Abrir curso" @click="openDetail(entry.course.slug)" />
          <q-btn flat color="secondary" no-caps label="Detalle" @click="openDetail(entry.course.slug)" />
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudentStore } from 'src/stores/student'

const router = useRouter()
const studentStore = useStudentStore()
const { learningCourses, learningLoading } = storeToRefs(studentStore)

const status = ref(null)
const sort = ref('recent')

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completados', value: 'completed' },
  { label: 'Sin iniciar', value: 'not_started' },
]

const sortOptions = [
  { label: 'Mas recientes', value: 'recent' },
  { label: 'Por progreso', value: 'progress' },
  { label: 'Por titulo', value: 'title' },
]

onMounted(() => {
  studentStore.loadMyLearning({ status: status.value, sort: sort.value })
})

watch([status, sort], () => {
  studentStore.loadMyLearning({ status: status.value, sort: sort.value })
})

function openDetail(slug) {
  router.push({ name: 'student-course-detail', params: { slug } })
}
</script>

<style scoped>
.student-page {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.filter-card,
.learning-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}

.filter-card {
  padding: 18px;
}

.filter-grid,
.learning-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.learning-card {
  padding: 20px;
}

@media (max-width: 900px) {
  .filter-grid,
  .learning-grid {
    grid-template-columns: 1fr;
  }
}
</style>
