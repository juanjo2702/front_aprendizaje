<template>
  <q-card flat bordered class="comment-shell" data-cy="comment-section">
    <div class="section-head">
      <div>
        <div class="text-h6 text-weight-bold">Comentarios y dudas</div>
        <div class="text-caption text-grey-5">
          Conversación del tema, estilo aula activa. Solo participan alumnos inscritos y docentes del curso.
        </div>
      </div>
      <q-btn flat round dense icon="refresh" color="grey-5" :loading="loading" @click="loadComments" />
    </div>

    <q-banner v-if="errorMessage" rounded class="bg-negative text-white q-mb-md">
      {{ errorMessage }}
    </q-banner>

    <div class="composer">
      <AvatarConMarco
        :src="auth.user?.avatar"
        :name="auth.user?.name"
        :size="44"
        :frame-class="auth.user?.equipped_avatar_frame?.frame_class"
        :frame-svg="auth.user?.equipped_avatar_frame?.frame_svg"
      />

      <div class="composer-body">
        <q-input
          v-model="draft"
          type="textarea"
          autogrow
          outlined
          dense
          dark
          label="Comparte una duda, comentario o feedback"
        />

        <div class="composer-actions">
          <q-toggle v-model="isQuestion" color="secondary" label="Marcar como pregunta" />
          <div class="row q-gutter-sm">
            <q-btn flat no-caps color="grey-5" label="Limpiar" @click="resetDraft" />
            <q-btn color="primary" no-caps label="Publicar" :loading="submitting" @click="submitComment" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="column q-gutter-sm">
      <q-skeleton v-for="n in 3" :key="n" dark type="rect" height="90px" />
    </div>

    <div v-else-if="!comments.length" class="empty-state">
      <q-icon name="forum" size="54px" color="grey-6" />
      <div class="text-subtitle1 text-weight-medium q-mt-sm">Todavía no hay conversación en este tema</div>
      <div class="text-caption text-grey-5 q-mt-xs">
        El primer comentario suele desbloquear dudas muy útiles para el resto del curso.
      </div>
    </div>

    <div v-else class="comment-list">
      <article v-for="comment in comments" :key="comment.id" class="comment-card" :data-cy="`comment-card-${comment.id}`">
        <div class="comment-row">
          <button class="avatar-button" type="button" :data-cy="`comment-avatar-btn-${comment.id}`" @click="openMiniProfile(comment.author?.id)">
            <AvatarConMarco
              :src="comment.author?.avatar"
              :name="comment.author?.name"
              :size="44"
              :frame-class="comment.author?.equipped_avatar_frame?.frame_class"
              :frame-svg="comment.author?.equipped_avatar_frame?.frame_svg"
              clickable
            />
          </button>

          <div class="comment-body">
            <div class="comment-meta">
              <span class="text-weight-bold">{{ comment.author?.name || 'Usuario' }}</span>
              <q-badge v-if="comment.author?.equipped_profile_title?.label" color="dark" text-color="warning">
                {{ comment.author.equipped_profile_title.label }}
              </q-badge>
              <q-badge
                v-if="comment.author?.level_title"
                outline
                :color="comment.author?.role === 'instructor' ? 'secondary' : 'warning'"
              >
                {{ comment.author.level_title }}
              </q-badge>
              <q-badge v-if="comment.is_question" color="info">Pregunta</q-badge>
              <q-badge v-if="comment.is_resolved" color="positive">Resuelta</q-badge>
              <span class="text-caption text-grey-5">{{ formatDate(comment.created_at) }}</span>
            </div>

            <div class="comment-text">{{ comment.body }}</div>

            <div class="comment-tools">
              <q-btn
                flat
                no-caps
                dense
                size="sm"
                color="secondary"
                icon="reply"
                label="Responder"
                @click="toggleReply(comment.id)"
              />
            </div>

            <transition name="fade-slide">
              <div v-if="activeReplyId === comment.id" class="reply-box">
                <q-input
                  v-model="replyDraft"
                  type="textarea"
                  autogrow
                  outlined
                  dense
                  dark
                  label="Escribe tu respuesta"
                />
                <div class="row justify-end q-gutter-sm q-mt-sm">
                  <q-btn flat no-caps color="grey-5" label="Cancelar" @click="cancelReply" />
                  <q-btn
                    color="primary"
                    no-caps
                    label="Enviar respuesta"
                    :loading="replySubmitting"
                    @click="submitReply(comment)"
                  />
                </div>
              </div>
            </transition>

            <div v-if="comment.replies?.length" class="reply-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-card">
                <button class="avatar-button" type="button" :data-cy="`reply-avatar-btn-${reply.id}`" @click="openMiniProfile(reply.author?.id)">
                  <AvatarConMarco
                    :src="reply.author?.avatar"
                    :name="reply.author?.name"
                    :size="36"
                    :frame-class="reply.author?.equipped_avatar_frame?.frame_class"
                    :frame-svg="reply.author?.equipped_avatar_frame?.frame_svg"
                    clickable
                  />
                </button>

                <div class="reply-content">
                  <div class="comment-meta">
                    <span class="text-weight-medium">{{ reply.author?.name || 'Usuario' }}</span>
                    <q-badge v-if="reply.author?.equipped_profile_title?.label" color="dark" text-color="warning">
                      {{ reply.author.equipped_profile_title.label }}
                    </q-badge>
                    <q-badge
                      v-if="reply.author?.level_title"
                      outline
                      :color="reply.author?.role === 'instructor' ? 'secondary' : 'warning'"
                    >
                      {{ reply.author.level_title }}
                    </q-badge>
                    <span class="text-caption text-grey-5">{{ formatDate(reply.created_at) }}</span>
                  </div>
                  <div class="comment-text">{{ reply.body }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <MiniProfileDialog v-model="miniProfileDialog" :user-id="activeMiniProfileId" />
  </q-card>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { api } from 'src/services/api'
import AvatarConMarco from 'src/components/shared/AvatarConMarco.vue'
import MiniProfileDialog from 'src/components/shared/MiniProfileDialog.vue'

const props = defineProps({
  commentTarget: {
    type: Object,
    default: null,
  },
})

const auth = useAuthStore()
const loading = ref(false)
const submitting = ref(false)
const replySubmitting = ref(false)
const draft = ref('')
const replyDraft = ref('')
const isQuestion = ref(true)
const comments = ref([])
const errorMessage = ref('')
const activeReplyId = ref(null)
const miniProfileDialog = ref(false)
const activeMiniProfileId = ref(null)

watch(
  () => props.commentTarget,
  (value) => {
    if (value?.type && value?.id) {
      loadComments()
    } else {
      comments.value = []
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.commentTarget?.type && props.commentTarget?.id) {
    loadComments()
  }
})

function formatDate(value) {
  if (!value) return ''

  return new Date(value).toLocaleString('es-BO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resetDraft() {
  draft.value = ''
  isQuestion.value = true
}

function toggleReply(commentId) {
  activeReplyId.value = activeReplyId.value === commentId ? null : commentId
  replyDraft.value = ''
}

function cancelReply() {
  activeReplyId.value = null
  replyDraft.value = ''
}

function openMiniProfile(userId) {
  if (!userId) return
  activeMiniProfileId.value = userId
  miniProfileDialog.value = true
}

async function loadComments() {
  if (!props.commentTarget?.type || !props.commentTarget?.id) return

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/comments', {
      params: {
        commentable_type: props.commentTarget.type,
        commentable_id: props.commentTarget.id,
      },
    })

    comments.value = data?.comments || []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'No se pudieron cargar los comentarios.'
  } finally {
    loading.value = false
  }
}

async function submitComment() {
  if (!draft.value.trim() || !props.commentTarget?.type || !props.commentTarget?.id) return

  submitting.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.post('/comments', {
      commentable_type: props.commentTarget.type,
      commentable_id: props.commentTarget.id,
      body: draft.value.trim(),
      is_question: isQuestion.value,
    })

    comments.value = [data.comment, ...comments.value]
    resetDraft()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'No se pudo publicar el comentario.'
  } finally {
    submitting.value = false
  }
}

async function submitReply(comment) {
  if (!replyDraft.value.trim()) return

  replySubmitting.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.post(`/comments/${comment.id}/reply`, {
      body: replyDraft.value.trim(),
    })

    comments.value = comments.value.map((item) => (item.id === comment.id ? data.comment : item))
    cancelReply()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'No se pudo enviar la respuesta.'
  } finally {
    replySubmitting.value = false
  }
}
</script>

<style scoped>
.comment-shell {
  border-radius: 28px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.composer {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.composer-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composer-actions,
.comment-tools,
.comment-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.composer-actions {
  justify-content: space-between;
}

.empty-state {
  padding: 28px;
  border-radius: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  border-radius: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.comment-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
}

.comment-body {
  min-width: 0;
}

.comment-text {
  color: #eef1ff;
  line-height: 1.6;
  margin: 8px 0 10px;
  white-space: pre-wrap;
}

.reply-box {
  margin-top: 10px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.reply-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(10, 14, 30, 0.58);
}

.avatar-button {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  display: inline-flex;
  align-items: flex-start;
  justify-content: center;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 700px) {
  .composer,
  .comment-row,
  .reply-card {
    grid-template-columns: 1fr;
  }

  .composer-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
