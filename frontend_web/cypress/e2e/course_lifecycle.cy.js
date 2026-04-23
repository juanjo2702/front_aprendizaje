/* global describe, it, cy, expect */
const teacherCourse = {
  id: 501,
  title: 'Curso Cypress QA',
  slug: 'curso-cypress-qa',
  status: 'draft',
  price: 49,
  has_certificate: true,
  certificate_requires_final_exam: false,
  category: { id: 7, name: 'QA' },
  modules_count: 0,
  lessons_count: 0,
  total_students: 0,
  active_students: 0,
}

function setNativeFieldValue(input, value) {
  const prototype = Object.getPrototypeOf(input)
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  if (valueSetter) {
    valueSetter.call(input, value)
  } else {
    input.value = value
  }

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function typeIntoField(selector, value, options = {}) {
  const { clear = false } = options

  cy.get(selector).then(($el) => {
    const isNativeField = $el.is('input, textarea')
    const target = isNativeField
      ? cy.wrap($el)
      : cy.wrap($el).find('input, textarea').first()

    target.then(($input) => {
      const input = $input.get(0)
      const inputType = input?.getAttribute('type')

      cy.wrap($input).click({ force: true })

      if (clear || inputType === 'number') {
        setNativeFieldValue(input, '')
      }

      if (inputType === 'number') {
        setNativeFieldValue(input, String(value))
        cy.wrap($input).blur({ force: true })
        return
      }

      cy.wrap($input).type(String(value), { force: true })
    })
  })
}

function selectQuasarOption(triggerSelector, optionLabel) {
  cy.get(triggerSelector).click()
  cy.get('.q-menu:visible, .q-dialog__inner:visible')
    .last()
    .contains('.q-item, [role="option"]', optionLabel)
    .click({ force: true })
}

describe('Ciclo de vida del curso', () => {
  it('permite al docente crear estructura y enviar el curso a pending', () => {
    let createdCourseId = teacherCourse.id
    let createdModuleId = 9001

    cy.login('teacher')

    cy.intercept('GET', '**/api/categories', {
      statusCode: 200,
      body: [{ id: 7, name: 'QA', children: [] }],
    }).as('getCategories')

    cy.intercept('GET', '**/api/instructor/courses*', {
      statusCode: 200,
      body: { data: [teacherCourse] },
    }).as('getTeacherCourses')

    cy.intercept('POST', '**/api/courses', (req) => {
      expect(req.body.title).to.eq('Curso Cypress QA')
      req.reply({
        statusCode: 201,
        body: {
          ...teacherCourse,
          id: createdCourseId,
          title: req.body.title,
          short_description: req.body.short_description,
          description: req.body.description,
        },
      })
    }).as('createCourse')

    cy.visit('/teacher/courses')
    cy.wait(['@getCategories', '@getTeacherCourses'])

    cy.get('[data-cy="create-course-btn"]').click()
    cy.get('[data-cy="teacher-course-dialog"]').should('be.visible')
    typeIntoField('[data-cy="course-title-input"]', 'Curso Cypress QA')
    typeIntoField('[data-cy="course-short-description-input"]', 'Curso generado desde QA')
    typeIntoField('[data-cy="course-description-input"]', 'Validación del flujo Course > Module > Lesson.')
    typeIntoField('[data-cy="course-price-input"]', '49', { clear: true })
    cy.get('[data-cy="course-save-btn"]').click()
    cy.wait('@createCourse')

    cy.intercept('GET', `**/api/instructor/courses/${createdCourseId}/structure`, {
      statusCode: 200,
      body: {
        id: createdCourseId,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'draft',
        has_certificate: true,
        certificate_requires_final_exam: false,
        certificate_min_score: 70,
        certificate_final_lesson_id: null,
        modules: [],
      },
    }).as('getStructureEmpty')

    cy.visit(`/teacher/courses/${createdCourseId}/builder?courseTitle=Curso Cypress QA`)
    cy.wait('@getStructureEmpty')

    cy.intercept('POST', '**/api/courses/501/modules', (req) => {
      expect(req.body.title).to.eq('Módulo QA')
      req.reply({
        statusCode: 201,
        body: { id: createdModuleId, title: req.body.title, description: req.body.description, sort_order: 1 },
      })
    }).as('createModule')

    cy.intercept('GET', `**/api/instructor/courses/${createdCourseId}/structure`, {
      times: 1,
      statusCode: 200,
      body: {
        id: createdCourseId,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'draft',
        has_certificate: true,
        certificate_requires_final_exam: false,
        certificate_min_score: 70,
        certificate_final_lesson_id: null,
        modules: [
          {
            id: createdModuleId,
            title: 'Módulo QA',
            description: 'Módulo de pruebas funcionales',
            sort_order: 1,
            lessons: [],
          },
        ],
      },
    }).as('getStructureWithModule')

    cy.get('[data-cy="new-module-btn"]').click()
    cy.get('[data-cy="module-dialog"]').should('be.visible')
    typeIntoField('[data-cy="module-title-input"]', 'Módulo QA')
    cy.get('[data-cy="save-module-btn"]').click()
    cy.wait('@createModule')
    cy.wait('@getStructureWithModule')

    cy.intercept('POST', '**/api/modules/9001/lessons', (req) => {
      expect(req.body.type).to.eq('video')
      req.reply({
        statusCode: 201,
        body: { id: 9101, title: req.body.title, type: 'video', sort_order: 1 },
      })
    }).as('createVideoLesson')

    cy.intercept('POST', '**/api/teacher/upload-video', {
      statusCode: 200,
      body: {
        status: 'completed',
        upload_token: 'video-token-cypress',
        file: { token: 'video-token-cypress', file_name: 'curso-cypress.mp4' },
      },
    }).as('uploadVideoChunk')

    cy.intercept('GET', `**/api/instructor/courses/${createdCourseId}/structure`, {
      times: 1,
      statusCode: 200,
      body: {
        id: createdCourseId,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'draft',
        has_certificate: true,
        certificate_requires_final_exam: false,
        certificate_min_score: 70,
        certificate_final_lesson_id: null,
        modules: [
          {
            id: createdModuleId,
            title: 'Módulo QA',
            description: 'Módulo de pruebas funcionales',
            sort_order: 1,
            lessons: [
              { id: 9101, title: 'Lección video', type: 'video', duration: 120, sort_order: 1, is_free: false, contentable: { provider: 'local' } },
            ],
          },
        ],
      },
    }).as('getStructureWithVideoLesson')

    cy.get(`[data-cy="add-lesson-btn-${createdModuleId}"]`).click()
    cy.get('[data-cy="lesson-dialog"]').should('be.visible')
    typeIntoField('[data-cy="lesson-title-input"]', 'Lección video')
    selectQuasarOption('[data-cy="lesson-source-mode-select"]', 'Archivo local')
    cy.uploadChunkedFile({
      fileName: 'curso-cypress.mp4',
      uploadToken: 'video-token-cypress',
      chunkCount: 3,
    })
    cy.get('[data-cy="save-lesson-btn"]').click()
    cy.wait('@createVideoLesson')
    cy.wait('@getStructureWithVideoLesson')

    cy.intercept('POST', '**/api/modules/9001/lessons', (req) => {
      expect(req.body.type).to.eq('interactive')
      expect(req.body.max_attempts).to.eq(3)
      expect(req.body.passing_score).to.eq(80)
      req.reply({
        statusCode: 201,
        body: { id: 9102, title: req.body.title, type: 'interactive', sort_order: 2 },
      })
    }).as('createActivityLesson')

    cy.intercept('GET', `**/api/instructor/courses/${createdCourseId}/structure`, {
      times: 1,
      statusCode: 200,
      body: {
        id: createdCourseId,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'draft',
        has_certificate: true,
        certificate_requires_final_exam: false,
        certificate_min_score: 70,
        certificate_final_lesson_id: null,
        modules: [
          {
            id: createdModuleId,
            title: 'Módulo QA',
            description: 'Módulo de pruebas funcionales',
            sort_order: 1,
            lessons: [
              { id: 9101, title: 'Lección video', type: 'video', duration: 120, sort_order: 1, is_free: false, contentable: { provider: 'local' } },
              { id: 9102, title: 'Lección actividad', type: 'interactive', duration: 60, sort_order: 2, is_free: false, interactiveConfig: { activity_type: 'trivia', max_attempts: 3, passing_score: 80, xp_reward: 100 } },
            ],
          },
        ],
      },
    }).as('getStructureWithActivityLesson')

    cy.get(`[data-cy="add-lesson-btn-${createdModuleId}"]`).click()
    typeIntoField('[data-cy="lesson-title-input"]', 'Lección actividad')
    selectQuasarOption('[data-cy="lesson-type-select"]', 'Actividad')
    selectQuasarOption('[data-cy="activity-type-select"]', 'Trivia')
    cy.get('[data-cy="load-activity-template-btn"]').click()
    typeIntoField('[data-cy="activity-max-attempts-input"]', '3', { clear: true })
    typeIntoField('[data-cy="activity-passing-score-input"]', '80', { clear: true })
    cy.get('[data-cy="save-lesson-btn"]').click()
    cy.wait('@createActivityLesson')
    cy.wait('@getStructureWithActivityLesson')

    cy.intercept('PUT', '**/api/courses/501/status', (req) => {
      expect(req.body.status).to.eq('pending')
      req.reply({ statusCode: 200, body: { message: 'Curso enviado a revisión.' } })
    }).as('setPendingStatus')

    cy.intercept('GET', `**/api/instructor/courses/${createdCourseId}/structure`, {
      times: 1,
      statusCode: 200,
      body: {
        id: createdCourseId,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'pending',
        has_certificate: true,
        certificate_requires_final_exam: false,
        certificate_min_score: 70,
        certificate_final_lesson_id: null,
        modules: [
          {
            id: createdModuleId,
            title: 'Módulo QA',
            description: 'Módulo de pruebas funcionales',
            sort_order: 1,
            lessons: [
              { id: 9101, title: 'Lección video', type: 'video', duration: 120, sort_order: 1, is_free: false, contentable: { provider: 'local' } },
              { id: 9102, title: 'Lección actividad', type: 'interactive', duration: 60, sort_order: 2, is_free: false, interactiveConfig: { activity_type: 'trivia', max_attempts: 3, passing_score: 80, xp_reward: 100 } },
            ],
          },
        ],
      },
    }).as('getStructurePending')

    cy.get('[data-cy="send-course-review-btn"]').click()
    cy.wait('@setPendingStatus')
    cy.wait('@getStructurePending')
  })

  it('permite al admin publicar y ver el curso en el marketplace público', () => {
    cy.login('admin')

    cy.intercept('GET', '**/api/admin/courses/review-inbox*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 501,
            title: 'Curso Cypress QA',
            slug: 'curso-cypress-qa',
            status: 'pending',
            modules_count: 1,
            lessons_count: 2,
            instructor: { name: 'Docente QA', email: 'profesor@plataforma.com' },
            category: { name: 'QA' },
            total_students: 0,
            created_at: '2026-04-22T10:00:00Z',
          },
        ],
      },
    }).as('reviewInbox')

    cy.intercept('GET', '**/api/admin/courses/501/review', {
      statusCode: 200,
      body: {
        id: 501,
        title: 'Curso Cypress QA',
        slug: 'curso-cypress-qa',
        status: 'pending',
        review_notes: null,
        instructor: { name: 'Docente QA', email: 'profesor@plataforma.com' },
        modules: [
          {
            id: 9001,
            title: 'Módulo QA',
            description: 'Módulo de pruebas funcionales',
            lessons: [
              { id: 9101, title: 'Lección video', type: 'video', is_free: false },
              { id: 9102, title: 'Lección actividad', type: 'interactive', is_free: false },
            ],
          },
        ],
        payments: [],
      },
    }).as('adminReviewCourse')

    cy.intercept('PUT', '**/api/admin/courses/501/approval-status', (req) => {
      expect(req.body.status).to.eq('published')
      req.reply({
        statusCode: 200,
        body: { message: 'Curso aprobado y publicado.' },
      })
    }).as('publishCourse')

    cy.visit('/admin/courses')
    cy.wait('@reviewInbox')
    cy.get('[data-cy="review-course-btn-501"]').click()
    cy.wait('@adminReviewCourse')
    cy.get('[data-cy="course-publish-btn"]').click()
    cy.wait('@publishCourse')

    cy.intercept('GET', '**/api/courses*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 501,
            title: 'Curso Cypress QA',
            slug: 'curso-cypress-qa',
            price: 49,
            category: { name: 'QA' },
            instructor: { name: 'Docente QA' },
            short_description: 'Curso generado desde QA',
          },
        ],
        current_page: 1,
        last_page: 1,
        total: 1,
      },
    }).as('publicMarketplace')

    cy.visit('/catalog')
    cy.wait('@publicMarketplace')
    cy.contains('Curso Cypress QA').should('be.visible')
  })
})
