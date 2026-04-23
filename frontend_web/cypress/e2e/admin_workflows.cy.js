/* global describe, it, cy, expect */
function setField(selector, value) {
  cy.get(selector).then(($el) => {
    const $input = $el.is('input, textarea') ? $el : $el.find('input, textarea').first()
    const input = $input.get(0)
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set

    cy.wrap($input).click({ force: true })
    if (setter) setter.call(input, '')
    else input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))

    if (setter) setter.call(input, String(value))
    else input.value = String(value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    cy.wrap($input).blur({ force: true })
  })
}

function mockAdminSettings() {
  cy.intercept('GET', '**/api/admin/settings', {
    statusCode: 200,
    body: {
      finance: {
        platform_commission_percentage: 20,
        currency: 'BOB',
        minimum_payout_amount: 100,
      },
      gamification: {
        levels: [
          { level: 1, xp_required: 0, title: 'Explorador' },
          { level: 2, xp_required: 250, title: 'Aprendiz' },
        ],
      },
    },
  }).as('adminSettings')
}

describe('Flujos administrativos críticos', () => {
  it('muestra analítica global, almacenamiento y auditoría pedagógica', () => {
    cy.login('admin')

    cy.intercept('GET', '**/api/admin/dashboard-stats', {
      statusCode: 200,
      body: {
        overview: {
          active_users: 132,
          monthly_revenue: 18420.5,
          dropout_rate: 8,
          published_courses: 12,
          pending_reviews: 3,
          pending_payments: 5,
          pending_payouts: 2,
        },
        popular_categories: [
          { id: 1, name: 'Desarrollo Full-stack', total_enrollments: 80 },
          { id: 2, name: 'Informática médica', total_enrollments: 45 },
        ],
        storage: {
          video_human: '1.8 GB',
          video_bytes: 1932735283,
          disk_used_percentage: 61,
          disk_used_bytes: 65498251264,
          disk_total_bytes: 107374182400,
        },
        bottlenecks_preview: [
          {
            interactive_config_id: 99,
            lesson_title: 'Examen final QA',
            course_title: 'Curso Cypress QA',
            failed_results: 14,
            average_attempts: 2.8,
          },
        ],
        recent_logs: [
          {
            id: 1,
            action: 'course.status_changed',
            actor: { name: 'Admin QA' },
            target_label: 'Curso Cypress QA',
            created_at: '2026-04-22T12:00:00Z',
          },
        ],
      },
    }).as('dashboardStats')

    cy.visit('/admin/dashboard')
    cy.wait('@dashboardStats')

    cy.contains('Supervisión global del LMS').should('be.visible')
    cy.contains('132').should('be.visible')
    cy.contains('Desarrollo Full-stack').should('be.visible')
    cy.contains('1.8 GB').should('be.visible')
    cy.contains('Examen final QA').should('be.visible')
    cy.contains('Curso Cypress QA').should('be.visible')
  })

  it('valida pagos QR, aprueba payouts y guarda comisiones globales', () => {
    cy.login('admin')
    mockAdminSettings()

    cy.intercept('GET', '**/api/admin/finances/payments', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 900,
            transaction_id: 'QR-BO-900',
            amount: 70,
            status: 'pending',
            user: { name: 'Estudiante QA', email: 'estudiante@plataforma.com' },
            course: {
              title: 'Curso Cypress QA',
              instructor: { name: 'Docente QA' },
            },
          },
        ],
        summary: {
          pending_count: 1,
          platform_revenue_this_month: 350,
          instructor_revenue_this_month: 1400,
        },
      },
    }).as('financePayments')

    cy.intercept('GET', '**/api/admin/finances/payouts', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 950,
            gross_amount: 1000,
            net_amount: 800,
            status: 'pending',
            requested_at: '2026-04-22T10:00:00Z',
            instructor: { name: 'Docente QA', email: 'profesor@plataforma.com' },
          },
        ],
        summary: {
          pending_amount: 800,
          paid_this_month: 2400,
        },
      },
    }).as('financePayouts')

    cy.intercept('POST', '**/api/admin/finances/payments/900/confirm', {
      statusCode: 200,
      body: { message: 'Pago confirmado.' },
    }).as('confirmPayment')

    cy.intercept('PUT', '**/api/admin/finances/payouts/950', (req) => {
      expect(req.body.status).to.eq('approved')
      expect(req.body.admin_notes).to.contain('Sin disputas')
      req.reply({ statusCode: 200, body: { message: 'Retiro aprobado.' } })
    }).as('approvePayout')

    cy.intercept('PUT', '**/api/admin/settings', (req) => {
      expect(req.body.finance.platform_commission_percentage).to.eq(18)
      expect(req.body.finance.minimum_payout_amount).to.eq(120)
      req.reply({ statusCode: 200, body: { message: 'Configuración guardada.' } })
    }).as('saveSettings')

    cy.visit('/admin/finances')
    cy.wait(['@financePayments', '@financePayouts', '@adminSettings'])

    cy.get('[data-cy="payment-confirm-btn-900"]').click()
    cy.get('[data-cy="payment-review-dialog"]').should('be.visible')
    setField('[data-cy="payment-review-notes-input"]', 'QR verificado contra comprobante.')
    cy.get('[data-cy="submit-payment-review-btn"]').click()
    cy.wait('@confirmPayment')

    cy.contains('.q-tab', 'Retiros').click()
    cy.get('[data-cy="payout-approve-btn-950"]').click()
    cy.get('[data-cy="payout-review-dialog"]').should('be.visible')
    setField('[data-cy="payout-review-notes-input"]', 'Sin disputas abiertas.')
    cy.get('[data-cy="submit-payout-decision-btn"]').click()
    cy.wait('@approvePayout')

    cy.contains('.q-tab', 'Comisiones').click()
    setField('[data-cy="platform-commission-input"]', 18)
    setField('[data-cy="minimum-payout-input"]', 120)
    cy.get('[data-cy="save-platform-settings-btn"]').click()
    cy.wait('@saveSettings')
  })

  it('administra badges, curva de niveles y recompensas de tienda', () => {
    cy.login('admin')
    mockAdminSettings()

    cy.intercept('GET', '**/api/admin/gamification/badges', {
      statusCode: 200,
      body: [
        { id: 10, name: 'Constancia QA', type: 'streak', description: 'Completa 7 días seguidos.' },
      ],
    }).as('badges')

    cy.intercept('GET', '**/api/admin/gamification/rewards', {
      statusCode: 200,
      body: [
        { id: 20, name: 'Marco Neon', type: 'avatar_frame', cost_coins: 80, minimum_level_required: 1, is_active: true },
      ],
    }).as('rewards')

    cy.intercept('POST', '**/api/admin/gamification/badges', (req) => {
      expect(req.body.name).to.eq('Maestro del Código')
      expect(req.body.criteria.course_completions).to.eq(3)
      req.reply({ statusCode: 201, body: { id: 11, ...req.body } })
    }).as('createBadge')

    cy.intercept('PUT', '**/api/admin/settings', (req) => {
      expect(req.body.gamification.levels.some((level) => level.title === 'Nivel QA')).to.eq(true)
      req.reply({ statusCode: 200, body: { message: 'Niveles actualizados.' } })
    }).as('saveLevels')

    cy.intercept('POST', '**/api/admin/gamification/rewards', (req) => {
      expect(req.body.name).to.eq('Cupón QA 20%')
      expect(req.body.cost_coins).to.eq(50)
      req.reply({ statusCode: 201, body: { id: 21, ...req.body } })
    }).as('createReward')

    cy.visit('/admin/gamification')
    cy.wait(['@badges', '@rewards', '@adminSettings'])

    cy.get('[data-cy="new-badge-btn"]').click()
    cy.get('[data-cy="badge-dialog"]').should('be.visible')
    setField('[data-cy="badge-name-input"]', 'Maestro del Código')
    setField('[data-cy="badge-description-input"]', 'Completa tres cursos técnicos.')
    setField('[data-cy="badge-icon-input"]', 'code')
    setField('[data-cy="badge-criteria-input"]', '{"course_completions":3}')
    cy.get('[data-cy="save-badge-btn"]').click()
    cy.wait('@createBadge')

    cy.get('[data-cy="gamification-levels-tab"]').click()
    cy.get('[data-cy="add-level-row-btn"]').click()
    setField('[data-cy="level-xp-input-2"]', 900)
    setField('[data-cy="level-title-input-2"]', 'Nivel QA')
    cy.get('[data-cy="save-levels-btn"]').click()
    cy.wait('@saveLevels')

    cy.get('[data-cy="gamification-rewards-tab"]').click()
    cy.get('[data-cy="new-reward-btn"]').click()
    cy.get('[data-cy="reward-dialog"]').should('be.visible')
    setField('[data-cy="reward-name-input"]', 'Cupón QA 20%')
    setField('[data-cy="reward-description-input"]', 'Descuento de presentación QA.')
    setField('[data-cy="reward-cost-input"]', 50)
    setField('[data-cy="reward-level-input"]', 1)
    setField('[data-cy="reward-stock-input"]', 25)
    cy.get('[data-cy="save-reward-btn"]').click()
    cy.wait('@createReward')
  })
})
