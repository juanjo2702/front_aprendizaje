/* global describe, it, cy, expect */
describe('Viaje del estudiante y gamificación', () => {
  it('respeta progreso, actividades, XP y certificación automática', () => {
    cy.login('student')

    cy.intercept('GET', '**/api/courses/curso-fullstack-qa', {
      statusCode: 200,
      body: {
        id: 801,
        slug: 'curso-fullstack-qa',
        title: 'Curso Fullstack QA',
        price: 70,
        is_enrolled: false,
        has_certificate: true,
        certificate_requires_final_exam: true,
        certificate_min_score: 80,
        certificate_final_lesson: { id: 4003, title: 'Examen final' },
        has_interactive_activities: true,
        category: { name: 'QA' },
        modules: [],
      },
    }).as('courseDetailBeforePurchase')

    cy.visit('/student/marketplace/curso-fullstack-qa')
    cy.wait('@courseDetailBeforePurchase')

    cy.intercept('POST', '**/api/payments/intent', {
      statusCode: 200,
      body: {
        status: 'pending',
        amount: 70,
        original_amount: 70,
        qr_code: 'data:image/png;base64,AAAA',
        transaction_id: 'txn-qa-001',
      },
    }).as('createPaymentIntent')

    cy.intercept('POST', '**/api/payments/webhook', {
      statusCode: 200,
      body: { ok: true },
    }).as('simulateQrWebhook')

    cy.intercept('GET', '**/api/payments/txn-qa-001', {
      statusCode: 200,
      body: { status: 'completed' },
    }).as('paymentStatus')

    cy.intercept('GET', '**/api/student/inventory', {
      statusCode: 200,
      body: {
        equipped: { frame: null, title: null },
        mini_profile: null,
        locker: { frames: [], titles: [], extras: [], coupons: [] },
      },
    }).as('inventoryRefresh')

    cy.intercept('GET', '**/api/courses/curso-fullstack-qa', {
      times: 1,
      statusCode: 200,
      body: {
        id: 801,
        slug: 'curso-fullstack-qa',
        title: 'Curso Fullstack QA',
        price: 70,
        is_enrolled: true,
        has_certificate: true,
        certificate_requires_final_exam: true,
        certificate_min_score: 80,
        certificate_final_lesson: { id: 4003, title: 'Examen final' },
        has_interactive_activities: true,
        category: { name: 'QA' },
        modules: [
          {
            id: 1,
            title: 'Módulo principal',
            lessons: [
              { id: 4001, title: 'Video base', normalized_type: 'video', type: 'video', duration: 120 },
              { id: 4002, title: 'PDF guía', normalized_type: 'resource', type: 'resource', duration: 0 },
              { id: 4003, title: 'Examen final', normalized_type: 'interactive', type: 'interactive', duration: 60 },
            ],
          },
        ],
      },
    }).as('courseDetailAfterPurchase')

    cy.get('[data-cy="buy-course-qr-btn"]').click()
    cy.get('[data-cy="checkout-dialog"]').should('be.visible')
    cy.get('[data-cy="generate-qr-btn"]').click()
    cy.wait('@createPaymentIntent')
    cy.get('[data-cy="simulate-payment-btn"]').click()
    cy.wait('@simulateQrWebhook')
    cy.wait('@courseDetailAfterPurchase')
    cy.get('[data-cy="continue-course-btn"]').should('be.visible')

    cy.intercept('GET', '**/api/lessons/4002', {
      statusCode: 200,
      body: {
        course: { id: 801, title: 'Curso Fullstack QA', progress: { overall_progress: 0 } },
        lesson: {
          id: 4002,
          title: 'PDF guía',
          type: 'resource',
          duration: 0,
          content: {
            kind: 'resource',
            payload: {
              file_url: 'https://example.com/guia.pdf',
              file_name: 'guia.pdf',
              description: 'Documento complementario',
            },
          },
        },
        sidebar: { modules: [{ id: 1, title: 'Módulo principal', lessons: [{ id: 4002, title: 'PDF guía', type: 'resource', is_completed: false }] }] },
        navigation: { next_lesson: { id: 4003, title: 'Examen final' } },
        comment_target: null,
      },
    }).as('resourceLesson')

    cy.visit('/student/learn/4002')
    cy.wait('@resourceLesson')
    cy.contains('0% completado').should('be.visible')

    cy.intercept('GET', '**/api/lessons/4001', {
      statusCode: 200,
      body: {
        course: { id: 801, title: 'Curso Fullstack QA', progress: { overall_progress: 50 } },
        lesson: {
          id: 4001,
          title: 'Video base',
          type: 'video',
          duration: 120,
          content: {
            kind: 'video',
            payload: {
              video_url: 'https://example.com/video.mp4',
            },
          },
        },
        sidebar: { modules: [{ id: 1, title: 'Módulo principal', lessons: [{ id: 4001, title: 'Video base', type: 'video', is_completed: false }] }] },
        navigation: { next_lesson: { id: 4003, title: 'Examen final' } },
        comment_target: null,
      },
    }).as('videoLesson')

    cy.intercept('POST', '**/api/lessons/4001/complete', {
      statusCode: 200,
      body: {
        progress: { overall_progress: { percentage: 50 } },
      },
    }).as('completeVideoLesson')

    cy.visit('/student/learn/4001')
    cy.wait('@videoLesson')
    cy.simulateVideoEnd()
    cy.wait('@completeVideoLesson')

    cy.intercept('GET', '**/api/lessons/4003', {
      statusCode: 200,
      body: {
        course: { id: 801, title: 'Curso Fullstack QA', progress: { overall_progress: 50 } },
        lesson: {
          id: 4003,
          title: 'Examen final',
          type: 'interactive',
          duration: 60,
          content: { kind: 'interactive', payload: {} },
        },
        interactive_config: {
          activity_type: 'trivia',
          max_attempts: 3,
          passing_score: 80,
          xp_reward: 100,
          questions: [
            {
              id: 1,
              prompt: '¿Laravel es backend?',
              choices: [
                { id: 'a', text: 'Sí' },
                { id: 'b', text: 'No' },
              ],
              correct_choice_id: 'a',
            },
          ],
        },
        sidebar: { modules: [{ id: 1, title: 'Módulo principal', lessons: [{ id: 4003, title: 'Examen final', type: 'interactive', is_completed: false }] }] },
        navigation: {},
        comment_target: null,
      },
    }).as('interactiveLesson')

    let attempt = 0
    cy.intercept('POST', '**/api/lessons/4003/interactive-complete', (req) => {
      attempt += 1
      if (attempt === 1) {
        expect(req.body.score).to.be.lessThan(80)
        req.reply({
          statusCode: 200,
          body: {
            passed: false,
            xp_awarded: 0,
            progress: { overall_progress: { percentage: 50 } },
          },
        })
        return
      }

      expect(req.body.score).to.be.gte(80)
      req.reply({
        statusCode: 200,
        body: {
          passed: true,
          xp_awarded: 70,
          progress: { overall_progress: { percentage: 100 } },
          certificate: {
            id: 9901,
            certificate_code: 'CERT-QA-001',
            course: { title: 'Curso Fullstack QA' },
          },
        },
      })
    }).as('interactiveCompletion')

    cy.visit('/student/learn/4003')
    cy.wait('@interactiveLesson')

    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent('qa:interactive-completed', {
          detail: { score: 40, max_score: 100 },
        }),
      )
    })
    cy.wait('@interactiveCompletion')
    cy.contains('Ganaste 0 XP').should('be.visible')

    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent('qa:interactive-completed', {
          detail: { score: 90, max_score: 100 },
        }),
      )
    })
    cy.wait('@interactiveCompletion')
    cy.contains('Ganaste 70 XP').should('be.visible')

    cy.intercept('GET', '**/api/certificates*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 9901,
            certificate_code: 'CERT-QA-001',
            issued_at: '2026-04-22T12:00:00Z',
            course: { title: 'Curso Fullstack QA' },
          },
        ],
      },
    }).as('certificatesVault')

    cy.visit('/student/certificates')
    cy.wait('@certificatesVault')
    cy.get('[data-cy="certificate-download-btn-9901"]').should('be.visible')
  })
})
