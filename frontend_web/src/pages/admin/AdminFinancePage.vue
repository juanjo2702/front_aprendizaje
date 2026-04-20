<template>
  <q-page class="admin-page q-pa-xl">
    <div class="page-wrap">
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-lg">
          <h2 class="q-mb-xs">The Vault</h2>
          <p class="q-mb-none text-grey-5">
            Valida pagos QR, revisa solicitudes de retiro y define la comisión global de la plataforma.
          </p>
        </div>
        <div class="col-12 col-lg-auto row q-gutter-sm">
          <q-btn flat no-caps color="secondary" icon="refresh" label="Recargar" @click="reloadAll" />
        </div>
      </div>

      <q-tabs v-model="tab" no-caps inline-label class="q-mb-lg admin-tabs" active-color="primary" indicator-color="primary">
        <q-tab name="payments" icon="qr_code_scanner" label="Pagos QR" />
        <q-tab name="payouts" icon="account_balance" label="Retiros" />
        <q-tab name="settings" icon="tune" label="Comisiones" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <q-tab-panel name="payments" class="q-pa-none">
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-sm-4">
              <q-card class="summary-card q-pa-md">
                <div class="text-caption text-grey-5">Pendientes</div>
                <div class="text-h4 text-weight-bold text-warning">{{ paymentSummary.pending_count || 0 }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="summary-card q-pa-md">
                <div class="text-caption text-grey-5">Ingresos plataforma mes</div>
                <div class="text-h5 text-weight-bold text-positive">{{ formatCurrency(paymentSummary.platform_revenue_this_month || 0) }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-4">
              <q-card class="summary-card q-pa-md">
                <div class="text-caption text-grey-5">Ingresos docente mes</div>
                <div class="text-h5 text-weight-bold text-info">{{ formatCurrency(paymentSummary.instructor_revenue_this_month || 0) }}</div>
              </q-card>
            </div>
          </div>

          <q-card class="panel-card">
            <q-card-section class="q-pa-none">
              <q-table
                :rows="payments"
                :columns="paymentColumns"
                row-key="id"
                flat
                dark
                :loading="paymentsLoading"
                :pagination="{ rowsPerPage: 15 }"
              >
                <template #body-cell-student="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">{{ props.row.user?.name || 'Sin estudiante' }}</div>
                    <div class="text-caption text-grey-5">{{ props.row.user?.email || '-' }}</div>
                  </q-td>
                </template>

                <template #body-cell-course="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">{{ props.row.course?.title || 'Sin curso' }}</div>
                    <div class="text-caption text-grey-5">{{ props.row.course?.instructor?.name || 'Sin docente' }}</div>
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge :color="paymentStatusColor(props.row.status)" rounded>
                      {{ props.row.status }}
                    </q-badge>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row justify-end q-gutter-xs">
                      <q-btn
                        flat
                        round
                        color="positive"
                        icon="check_circle"
                        :disable="props.row.status !== 'pending'"
                        @click="openPaymentDialog(props.row, 'confirm')"
                      />
                      <q-btn
                        flat
                        round
                        color="negative"
                        icon="cancel"
                        :disable="props.row.status !== 'pending'"
                        @click="openPaymentDialog(props.row, 'reject')"
                      />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="payouts" class="q-pa-none">
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-sm-6">
              <q-card class="summary-card q-pa-md">
                <div class="text-caption text-grey-5">Pendiente por pagar</div>
                <div class="text-h4 text-weight-bold text-warning">{{ formatCurrency(payoutSummary.pending_amount || 0) }}</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card class="summary-card q-pa-md">
                <div class="text-caption text-grey-5">Pagado este mes</div>
                <div class="text-h4 text-weight-bold text-positive">{{ formatCurrency(payoutSummary.paid_this_month || 0) }}</div>
              </q-card>
            </div>
          </div>

          <q-card class="panel-card">
            <q-card-section class="q-pa-none">
              <q-table
                :rows="payouts"
                :columns="payoutColumns"
                row-key="id"
                flat
                dark
                :loading="payoutsLoading"
                :pagination="{ rowsPerPage: 15 }"
              >
                <template #body-cell-instructor="props">
                  <q-td :props="props">
                    <div class="text-weight-medium">{{ props.row.instructor?.name || 'Sin docente' }}</div>
                    <div class="text-caption text-grey-5">{{ props.row.instructor?.email || '-' }}</div>
                  </q-td>
                </template>

                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge :color="payoutStatusColor(props.row.status)" rounded>
                      {{ props.row.status }}
                    </q-badge>
                  </q-td>
                </template>

                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row justify-end q-gutter-xs">
                      <q-btn flat round color="positive" icon="task_alt" @click="openPayoutDialog(props.row, 'approved')" />
                      <q-btn flat round color="info" icon="paid" @click="openPayoutDialog(props.row, 'paid')" />
                      <q-btn flat round color="negative" icon="do_not_disturb" @click="openPayoutDialog(props.row, 'rejected')" />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <q-tab-panel name="settings" class="q-pa-none">
          <q-card class="panel-card q-pa-lg">
            <div class="text-h6 text-weight-bold q-mb-sm">Configuración de comisiones</div>
            <div class="text-caption text-grey-5 q-mb-lg">
              Estos porcentajes se usan al confirmar cada pago para separar plataforma vs docente.
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="settings.finance.platform_commission_percentage"
                  type="number"
                  outlined
                  dense
                  min="0"
                  max="100"
                  label="Comisión plataforma (%)"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="settings.finance.currency"
                  outlined
                  dense
                  label="Moneda"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model.number="settings.finance.minimum_payout_amount"
                  type="number"
                  outlined
                  dense
                  min="0"
                  label="Monto mínimo de retiro"
                />
              </div>
            </div>

            <div class="row justify-end q-mt-lg">
              <q-btn color="primary" no-caps label="Guardar configuración" :loading="settingsSaving" @click="saveSettings" />
            </div>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>

      <q-dialog v-model="paymentDialog.open" persistent>
        <q-card style="width: min(560px, 92vw)">
          <q-card-section>
            <div class="text-h6">
              {{ paymentDialog.mode === 'confirm' ? 'Confirmar pago' : 'Rechazar pago' }}
            </div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ paymentDialog.payment?.transaction_id || 'Sin transacción' }}
            </div>
          </q-card-section>
          <q-card-section class="column q-gutter-md">
            <q-input v-model="paymentDialog.notes" type="textarea" outlined autogrow label="Notas de revisión" />
            <q-file
              v-if="paymentDialog.mode === 'confirm'"
              v-model="paymentDialog.receiptFile"
              outlined
              label="Comprobante / captura (opcional)"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn
              :color="paymentDialog.mode === 'confirm' ? 'positive' : 'negative'"
              no-caps
              :label="paymentDialog.mode === 'confirm' ? 'Confirmar recepción' : 'Rechazar pago'"
              :loading="paymentSaving"
              @click="submitPaymentReview"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="payoutDialog.open" persistent>
        <q-card style="width: min(520px, 92vw)">
          <q-card-section>
            <div class="text-h6">Actualizar retiro</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ payoutDialog.payout?.instructor?.name || 'Docente' }}
            </div>
          </q-card-section>
          <q-card-section class="column q-gutter-md">
            <q-input v-model="payoutDialog.notes" type="textarea" outlined autogrow label="Notas administrativas" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Cancelar" color="grey-5" v-close-popup />
            <q-btn color="primary" no-caps label="Guardar decisión" :loading="payoutSaving" @click="submitPayoutDecision" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'

const $q = useQuasar()
const tab = ref('payments')

const paymentsLoading = ref(false)
const payoutsLoading = ref(false)
const settingsSaving = ref(false)
const paymentSaving = ref(false)
const payoutSaving = ref(false)

const payments = ref([])
const payouts = ref([])
const paymentSummary = ref({})
const payoutSummary = ref({})
const settings = reactive({
  finance: {
    platform_commission_percentage: 20,
    currency: 'BOB',
    minimum_payout_amount: 0,
  },
  gamification: {
    levels: [],
  },
})

const paymentDialog = reactive({
  open: false,
  mode: 'confirm',
  payment: null,
  notes: '',
  receiptFile: null,
})

const payoutDialog = reactive({
  open: false,
  payout: null,
  status: 'approved',
  notes: '',
})

const paymentColumns = [
  { name: 'transaction_id', label: 'Transacción', field: 'transaction_id', align: 'left' },
  { name: 'student', label: 'Estudiante', field: 'user', align: 'left' },
  { name: 'course', label: 'Curso', field: 'course', align: 'left' },
  { name: 'amount', label: 'Monto', field: (row) => formatCurrency(row.amount), align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

const payoutColumns = [
  { name: 'instructor', label: 'Docente', field: 'instructor', align: 'left' },
  { name: 'gross_amount', label: 'Bruto', field: (row) => formatCurrency(row.gross_amount), align: 'center' },
  { name: 'net_amount', label: 'Neto', field: (row) => formatCurrency(row.net_amount), align: 'center' },
  { name: 'status', label: 'Estado', field: 'status', align: 'center' },
  { name: 'requested_at', label: 'Solicitado', field: (row) => formatDate(row.requested_at), align: 'center' },
  { name: 'actions', label: 'Acciones', align: 'right' },
]

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: settings.finance.currency || 'BOB',
  }).format(Number(amount || 0))
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function paymentStatusColor(status) {
  return ({ pending: 'warning', completed: 'positive', failed: 'negative' }[status] || 'grey-6')
}

function payoutStatusColor(status) {
  return ({ pending: 'warning', approved: 'info', rejected: 'negative', paid: 'positive' }[status] || 'grey-6')
}

async function loadPayments() {
  paymentsLoading.value = true
  try {
    const { data } = await api.get('/admin/finances/payments')
    payments.value = data.data || []
    paymentSummary.value = data.summary || {}
  } finally {
    paymentsLoading.value = false
  }
}

async function loadPayouts() {
  payoutsLoading.value = true
  try {
    const { data } = await api.get('/admin/finances/payouts')
    payouts.value = data.data || []
    payoutSummary.value = data.summary || {}
  } finally {
    payoutsLoading.value = false
  }
}

async function loadSettings() {
  const { data } = await api.get('/admin/settings')
  settings.finance = {
    ...settings.finance,
    ...(data.finance || {}),
  }
  settings.gamification = {
    ...settings.gamification,
    ...(data.gamification || {}),
  }
}

async function reloadAll() {
  await Promise.all([loadPayments(), loadPayouts(), loadSettings()])
}

function openPaymentDialog(payment, mode) {
  paymentDialog.open = true
  paymentDialog.mode = mode
  paymentDialog.payment = payment
  paymentDialog.notes = payment.review_notes || ''
  paymentDialog.receiptFile = null
}

function openPayoutDialog(payout, status) {
  payoutDialog.open = true
  payoutDialog.payout = payout
  payoutDialog.status = status
  payoutDialog.notes = payout.admin_notes || ''
}

async function submitPaymentReview() {
  if (!paymentDialog.payment?.id) return
  paymentSaving.value = true
  try {
    if (paymentDialog.mode === 'confirm') {
      const formData = new FormData()
      formData.append('review_notes', paymentDialog.notes || 'Pago QR confirmado manualmente.')
      if (paymentDialog.receiptFile) {
        formData.append('receipt_file', paymentDialog.receiptFile)
      }
      await api.post(`/admin/finances/payments/${paymentDialog.payment.id}/confirm`, formData)
    } else {
      await api.post(`/admin/finances/payments/${paymentDialog.payment.id}/reject`, {
        review_notes: paymentDialog.notes || 'Pago rechazado por administración.',
      })
    }

    $q.notify({
      type: 'positive',
      message: paymentDialog.mode === 'confirm'
        ? 'Pago confirmado correctamente.'
        : 'Pago rechazado correctamente.',
    })
    paymentDialog.open = false
    await loadPayments()
  } finally {
    paymentSaving.value = false
  }
}

async function submitPayoutDecision() {
  if (!payoutDialog.payout?.id) return
  payoutSaving.value = true
  try {
    await api.put(`/admin/finances/payouts/${payoutDialog.payout.id}`, {
      status: payoutDialog.status,
      admin_notes: payoutDialog.notes || null,
    })
    $q.notify({
      type: 'positive',
      message: 'Retiro actualizado correctamente.',
    })
    payoutDialog.open = false
    await loadPayouts()
  } finally {
    payoutSaving.value = false
  }
}

async function saveSettings() {
  settingsSaving.value = true
  try {
    await api.put('/admin/settings', {
      finance: settings.finance,
      gamification: settings.gamification,
    })
    $q.notify({
      type: 'positive',
      message: 'Configuración financiera actualizada.',
    })
  } finally {
    settingsSaving.value = false
  }
}

onMounted(reloadAll)
</script>

<style scoped lang="scss">
.admin-page {
  background: transparent;
}

.page-wrap {
  max-width: 1340px;
  margin: 0 auto;
}

.summary-card,
.panel-card {
  border-radius: 24px;
  background: rgba(8, 18, 36, 0.88);
  border: 1px solid rgba(93, 122, 255, 0.16);
}

.admin-tabs {
  background: rgba(8, 18, 36, 0.72);
  border: 1px solid rgba(93, 122, 255, 0.12);
  border-radius: 18px;
}
</style>
