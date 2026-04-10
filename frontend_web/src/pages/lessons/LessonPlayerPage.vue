<template>
  <q-page class="lesson-player-page q-pa-xl" style="max-width: 1200px; margin: 0 auto">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <h2 class="q-mb-xs">{{ lesson.title }}</h2>
        <div class="row items-center q-gutter-md">
          <q-badge outline color="primary">
            <q-icon name="mdi-clock" size="14px" class="q-mr-xs" />
            {{ lesson.duration }} min
          </q-badge>
          <q-badge v-if="lesson.is_free" outline color="positive">Gratis</q-badge>
          <q-badge v-if="game" outline color="orange">Juego incluido</q-badge>
          <q-badge v-if="quiz" outline color="blue">Quiz incluido</q-badge>
        </div>
      </div>
      <div>
        <q-btn
          flat
          no-caps
          icon="arrow_back"
          label="Volver al curso"
          :to="`/courses/${course.slug}`"
        />
      </div>
    </div>

    <div class="row q-gutter-xl">
      <!-- Left Column: Content -->
      <div class="col-12 col-lg-8">
        <!-- Video/Content -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <div v-if="lesson.type === 'video' && lesson.content_url">
            <div class="video-container">
              <iframe
                v-if="isYouTubeUrl(lesson.content_url)"
                :src="getEmbedUrl(lesson.content_url)"
                frameborder="0"
                allowfullscreen
              ></iframe>
              <video
                v-else
                controls
                :src="lesson.content_url"
                style="width: 100%; border-radius: 8px"
              ></video>
            </div>
          </div>
          <div
            v-else-if="lesson.type === 'text' && lesson.content_text"
            v-html="lesson.content_text"
          ></div>
          <div v-else class="text-center q-py-xl">
            <q-icon name="mdi-book-open" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Contenido no disponible</h4>
          </div>
        </q-card>

        <!-- Game Section -->
        <q-card v-if="game" class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md">ðŸŽ® {{ game.title }}</h3>
          <p style="color: #8b8ba7">Completa el juego para ganar puntos y avanzar en el curso.</p>

          <div v-if="game.game_type === 'memory'" class="q-mt-lg">
            <memory-game
              :config="game.config"
              :max-score="game.max_score"
              @completed="onGameCompleted"
            />
          </div>
          <div v-else-if="game.game_type === 'quiz'" class="q-mt-lg">
            <quiz-game
              :config="game.config"
              :max-score="game.max_score"
              @completed="onGameCompleted"
            />
          </div>
          <div v-else-if="game.game_type === 'puzzle'" class="q-mt-lg">
            <puzzle-game
              :config="game.config"
              :max-score="game.max_score"
              @completed="onGameCompleted"
            />
          </div>
          <div v-else class="text-center q-py-lg">
            <q-icon name="mdi-gamepad" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">Tipo de juego no soportado</h4>
          </div>

          <div class="row items-center justify-between q-mt-md">
            <div style="color: #8b8ba7; font-size: 0.9rem">
              Puntaje mÃ¡ximo: {{ game.max_score }} puntos
              <span v-if="game.time_limit"> â€¢ Tiempo lÃ­mite: {{ game.time_limit }} seg</span>
            </div>
            <q-btn
              v-if="!gameStarted"
              color="primary"
              icon="mdi-play"
              label="Comenzar juego"
              @click="startGame"
            />
          </div>
        </q-card>

        <!-- Quiz Section -->
        <q-card v-if="quiz" class="glass-card q-pa-lg">
          <h3 class="q-mb-md">📝 {{ quiz.title }}</h3>
          <p style="color: #8b8ba7">{{ quiz.description }}</p>

          <div v-if="quiz.questions && quiz.questions.length > 0">
            <div v-for="(question, idx) in quiz.questions" :key="question.id" class="q-mb-lg">
              <div class="text-weight-medium q-mb-sm">
                Pregunta {{ idx + 1 }}: {{ question.text }}
              </div>
              <div v-if="question.type === 'multiple_choice'">
                <q-option-group
                  v-model="userAnswers[question.id]"
                  :options="question.options.map((opt) => ({ label: opt.text, value: opt.id }))"
                  type="radio"
                />
              </div>
              <div v-else-if="question.type === 'true_false'">
                <q-option-group
                  v-model="userAnswers[question.id]"
                  :options="[
                    { label: 'Verdadero', value: true },
                    { label: 'Falso', value: false },
                  ]"
                  type="radio"
                />
              </div>
            </div>

            <div class="row items-center justify-between">
              <div style="color: #8b8ba7; font-size: 0.9rem">
                {{ quiz.questions.length }} preguntas â€¢ PuntuaciÃ³n mÃ­nima:
                {{ quiz.passing_score }}%
                <span v-if="quiz.time_limit"> â€¢ Tiempo lÃ­mite: {{ quiz.time_limit }} min</span>
              </div>
              <q-btn color="positive" icon="mdi-send" label="Enviar quiz" @click="submitQuiz" />
            </div>
          </div>
          <div v-else class="text-center q-py-lg">
            <q-icon name="mdi-help-circle" size="64px" color="grey-7" />
            <h4 class="q-mt-md" style="color: #8b8ba7">No hay preguntas disponibles</h4>
          </div>
        </q-card>
      </div>

      <!-- Right Column: Info & Navigation -->
      <div class="col-12 col-lg-4">
        <!-- Course Info -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md">InformaciÃ³n del curso</h3>
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-avatar size="48px" rounded>
              <img
                :src="
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
                "
              />
            </q-avatar>
            <div>
              <div class="text-weight-medium">{{ course.title }}</div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Curso en progreso</div>
            </div>
          </div>
          <q-linear-progress
            :value="courseProgress / 100"
            color="primary"
            track-color="dark"
            rounded
            size="8px"
          />
          <div class="row justify-between q-mt-xs" style="color: #8b8ba7; font-size: 0.8rem">
            <span>Progreso</span>
            <span>{{ courseProgress }}%</span>
          </div>
        </q-card>

        <!-- Navigation -->
        <q-card class="glass-card q-pa-lg q-mb-lg">
          <h3 class="q-mb-md">NavegaciÃ³n</h3>
          <div class="q-gutter-y-md">
            <q-btn
              v-if="navigation.previous_lesson"
              flat
              no-caps
              icon="chevron_left"
              :label="navigation.previous_lesson.title"
              :to="`/lessons/${navigation.previous_lesson.id}`"
              class="full-width text-left justify-start"
            />
            <div v-else class="text-center q-py-sm" style="color: #8b8ba7">
              Esta es la primera lecciÃ³n
            </div>

            <q-separator />

            <q-btn
              v-if="navigation.next_lesson"
              flat
              no-caps
              icon-right="chevron_right"
              :label="navigation.next_lesson.title"
              :to="`/lessons/${navigation.next_lesson.id}`"
              class="full-width text-left justify-end"
            />
            <div v-else class="text-center q-py-sm" style="color: #8b8ba7">
              Â¡Ãšltima lecciÃ³n del mÃ³dulo!
            </div>
          </div>
        </q-card>

        <!-- Points & Stats -->
        <q-card class="glass-card q-pa-lg">
          <h3 class="q-mb-md">Puntos disponibles</h3>
          <div class="row items-center q-gutter-md q-mb-sm">
            <q-avatar size="40px" color="primary" text-color="white">
              <q-icon name="mdi-star" size="20px" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ availablePoints }}</div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Puntos por completar</div>
            </div>
          </div>
          <div v-if="game" class="row items-center q-gutter-md q-mb-sm">
            <q-avatar size="40px" color="orange" text-color="white">
              <q-icon name="mdi-gamepad" size="20px" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ game.max_score }}</div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Puntos del juego</div>
            </div>
          </div>
          <div v-if="quiz" class="row items-center q-gutter-md">
            <q-avatar size="40px" color="blue" text-color="white">
              <q-icon name="mdi-format-list-checks" size="20px" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ quiz.passing_score }}</div>
              <div style="color: #8b8ba7; font-size: 0.85rem">Puntos del quiz</div>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/services/api'
import { useAuthStore } from 'src/stores/auth'
import MemoryGame from 'src/components/games/MemoryGame.vue'
import QuizGame from 'src/components/games/QuizGame.vue'
import PuzzleGame from 'src/components/games/PuzzleGame.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const lesson = ref({})
const course = ref({})
const game = ref(null)
const quiz = ref(null)
const navigation = ref({})
const courseProgress = ref(0)
const availablePoints = ref(0)
const gameStarted = ref(false)
const userAnswers = reactive({})

const loading = ref(true)

function isYouTubeUrl(url) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function getEmbedUrl(url) {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop()
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
}

function startGame() {
  gameStarted.value = true
}

function onGameCompleted(score) {
  // Los componentes de juego ya enviaron los resultados a la API
  // Aquí solo podemos mostrar un mensaje o actualizar la UI
}

async function submitQuiz() {
  try {
    // 1. Iniciar intento de quiz
    const startRes = await api.post(`/quizzes/${quiz.value.id}/start`)
    const attempt = startRes.data.attempt

    // 2. Preparar respuestas en el formato esperado por submitAttempt
    const answers = Object.entries(userAnswers).map(([questionId, answerValue]) => {
      // answerValue puede ser un ID, true/false, o array de IDs
      let answer
      if (Array.isArray(answerValue)) {
        answer = answerValue.map((id) => parseInt(id))
      } else if (typeof answerValue === 'boolean') {
        answer = answerValue ? 'true' : 'false'
      } else {
        answer = answerValue.toString()
      }
      return {
        question_id: parseInt(questionId),
        answer: answer,
      }
    })

    // 3. Calcular tiempo transcurrido (simulado: 60 segundos por ahora)
    const timeSpent = 60

    // 4. Enviar respuestas
    const submitRes = await api.post(`/quiz-attempts/${attempt.id}/submit`, {
      answers: answers,
      time_spent: timeSpent,
    })

    // 5. Manejar éxito
  } catch (error) {
    console.error('Error enviando quiz:', error)
  }
}
onMounted(async () => {
  const lessonId = route.params.lessonId
  try {
    const { data } = await api.get(`/lessons/${lessonId}`)
    lesson.value = data.lesson
    course.value = data.course
    game.value = data.game
    quiz.value = data.quiz
    navigation.value = data.navigation

    // Fetch course progress
    const progressRes = await api.get(`/user/courses/${course.value.id}/progress`)
    courseProgress.value = progressRes.data.overall_progress.percentage

    // Calculate available points
    availablePoints.value = (game.value?.max_score || 0) + (quiz.value ? 50 : 0)
  } catch (error) {
    console.error('Error loading lesson:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.lesson-player-page {
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 */
    height: 0;
    overflow: hidden;

    iframe,
    video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  }
}
</style>
