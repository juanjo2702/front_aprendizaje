/* global describe, it, cy, expect */
const teacherCourse = {
  id: 501,
  title: 'Curso Cypress QA',
  slug: 'curso-cypress-qa',
  status: 'published',
  short_description: 'Curso para pruebas integrales.',
  modules_count: 2,
  lessons_count: 6,
  total_students: 18,
  active_students: 9,
  average_learning_score: 86,
  completed_sales_amount: 560,
  price: 70,
}

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

function mockTeacherWorkspace() {
  cy.intercept('GET', '**/api/instructor/courses*', {
    statusCode: 200,
    body: {
      data: [
        teacherCourse,
        {
          id: 502,
          title: 'Curso en borrador QA',
          slug: 'curso-borrador-qa',
          status: 'draft',
          modules_count: 0,
          lessons_count: 0,
          total_students: 0,
          active_students: 0,
          average_learning_score: 0,
          completed_sales_amount: 0,
          price: 40,
        },
      ],
    },
  }).as('teacherCourses')

  cy.intercept('GET', '**/api/interactive-configs*', {
    statusCode: 200,
    body: {
      data: [
        {
          id: 7001,
          course_id: 501,
          module_id: 9001,
          lesson_id: 9102,
          activity_type: 'trivia',
          authoring_mode: 'form',
          version: 1,
          is_active: true,
          max_attempts: 3,
          passing_score: 80,
          xp_reward: 100,
          coin_reward: 25,
          lesson: { id: 9102, title: 'Examen final QA' },
          module: { id: 9001, title: 'Módulo QA' },
          config_payload: { questions: [] },
        },
      ],
    },
  }).as('interactiveConfigs')

  cy.intercept('GET', '**/api/game-configurations*', {
    statusCode: 200,
    body: { data: [{ id: 1, name: 'Regla base', points: 100 }] },
  }).as('gameConfigurations')

  cy.intercept('GET', '**/api/instructor/alerts', {
    statusCode: 200,
    body: {
      summary: { open_questions: 2, risk_students: 1 },
      alerts: [
        {
          type: 'question',
          student_name: 'Estudiante QA',
          course_title: 'Curso Cypress QA',
          lesson_title: 'Examen final QA',
          message: 'No entiendo la pregunta 2.',
          reply_count: 0,
          created_at: '2026-04-22T10:00:00Z',
        },
      ],
    },
  }).as('teacherAlerts')
}

describe('Flujos docentes críticos', () => {
  it('muestra métricas reales, ingresos, cursos y alertas identificadas por curso', () => {
    cy.login('teacher')
    mockTeacherWorkspace()

    cy.visit('/teacher/dashboard')
    cy.wait(['@teacherCourses', '@interactiveConfigs', '@gameConfigurations', '@teacherAlerts'])

    cy.contains('Centro de control docente').should('be.visible')
    cy.contains('Curso Cypress QA').should('be.visible')
    cy.contains('Curso en borrador QA').should('be.visible')
    cy.contains('Ventas cerradas').should('be.visible')
    cy.contains('Examen final QA').should('be.visible')
    cy.contains('No entiendo la pregunta 2.').should('be.visible')
  })

  it('permite monitorear alumnos, avances, intentos fallidos y drill-down pedagógico', () => {
    cy.login('teacher')

    cy.intercept('GET', '**/api/instructor/courses*', {
      statusCode: 200,
      body: { data: [teacherCourse] },
    }).as('studentCourses')

    cy.intercept('GET', '**/api/instructor/courses/501/students*', {
      statusCode: 200,
      body: {
        students: [
          {
            id: 1,
            progress: 65,
            average_activity_score: 58,
            last_activity_at: '2026-04-22T09:00:00Z',
            student: {
              id: 201,
              name: 'Estudiante QA',
              avatar: 'https://i.pravatar.cc/120?img=12',
              level_title: 'Veterano',
            },
            alert_index: { severity: 'high' },
          },
        ],
      },
    }).as('studentRows')

    cy.intercept('GET', '**/api/instructor/alerts', {
      statusCode: 200,
      body: {
        summary: { open_questions: 1, risk_students: 1 },
        alerts: [
          {
            type: 'question',
            student_name: 'Estudiante QA',
            course_title: 'Curso Cypress QA',
            lesson_title: 'Video base',
            message: '¿Qué repaso antes del examen?',
            created_at: '2026-04-22T10:00:00Z',
          },
        ],
      },
    }).as('studentAlerts')

    cy.intercept('GET', '**/api/instructor/courses/501/students/201', {
      statusCode: 200,
      body: {
        student: { id: 201, name: 'Estudiante QA', level_title: 'Veterano' },
        videos_and_lessons: [
          { lesson_title: 'Video base', module_title: 'Módulo QA', lesson_type: 'video', watch_ratio: 100, is_completed: true },
        ],
        failed_questions: [
          { question: '¿Laravel es backend?', quiz_title: 'Examen final QA', attempt_percentage: 40 },
        ],
        failed_activities: [
          { lesson_title: 'Examen final QA', module_title: 'Módulo QA', score: 40, max_score: 100 },
        ],
        recent_questions: [
          { id: 1, body: '¿Qué repaso antes del examen?', reply_count: 0, resolved_at: null },
        ],
        activity_attempts: [
          { lesson_title: 'Examen final QA', module_title: 'Módulo QA', attempt_number: 1, score: 40, status: 'failed' },
        ],
      },
    }).as('studentDrilldown')

    cy.visit('/teacher/students')
    cy.wait(['@studentCourses', '@studentRows', '@studentAlerts'])

    cy.get('[data-cy="teacher-students-page"]').should('be.visible')
    cy.contains('Estudiante QA').should('be.visible')
    cy.contains('65%').should('be.visible')
    cy.contains('¿Qué repaso antes del examen?').should('be.visible')

    cy.get('[data-cy="student-drilldown-btn-201"]').click()
    cy.wait('@studentDrilldown')
    cy.get('[data-cy="student-drilldown-dialog"]').should('be.visible')
    cy.contains('Preguntas falladas').should('be.visible')
    cy.contains('¿Laravel es backend?').should('be.visible')
    cy.contains('failed').should('be.visible')
  })

  it('permite gestionar actividades con intentos, passing score, XP y monedas', () => {
    cy.login('teacher')

    cy.intercept('GET', '**/api/instructor/courses*', {
      statusCode: 200,
      body: { data: [teacherCourse] },
    }).as('activityCourses')

    cy.intercept('GET', '**/api/instructor/courses/501/structure', {
      statusCode: 200,
      body: {
        id: 501,
        title: 'Curso Cypress QA',
        modules: [
          {
            id: 9001,
            title: 'Módulo QA',
            lessons: [
              { id: 9102, title: 'Examen final QA', type: 'interactive' },
            ],
          },
        ],
      },
    }).as('activityStructure')

    cy.intercept('GET', '**/api/interactive-configs*', {
      statusCode: 200,
      body: { data: [] },
    }).as('activityConfigs')

    cy.intercept('POST', '**/api/interactive-configs', (req) => {
      expect(req.body.lesson_id).to.eq(9102)
      expect(req.body.max_attempts).to.eq(3)
      expect(req.body.passing_score).to.eq(80)
      expect(req.body.xp_reward).to.eq(120)
      expect(req.body.coin_reward).to.eq(30)
      expect(req.body.config_payload.questions.length).to.be.greaterThan(1)
      req.reply({ statusCode: 201, body: { id: 7002, ...req.body } })
    }).as('saveActivityConfig')

    cy.visit('/teacher/activities')
    cy.wait(['@activityCourses', '@activityStructure', '@activityConfigs'])

    cy.contains('Nueva actividad').click()
    cy.contains('.q-dialog', 'Nueva actividad').should('be.visible')
    cy.contains('.q-field', 'Módulo').click()
    cy.contains('.q-item', 'Módulo QA').click({ force: true })
    cy.contains('.q-field', 'Lección').click()
    cy.contains('.q-item', 'Examen final QA').click({ force: true })
    cy.contains('Cargar plantilla').click()
    setField('[data-cy="activity-max-attempts-input"]', 3)
    setField('[data-cy="activity-passing-score-input"]', 80)
    setField('[data-cy="activity-xp-reward-input"]', 120)
    setField('[data-cy="activity-coin-reward-input"]', 30)
    cy.contains('.q-card', 'Nueva actividad').contains('Guardar').click()
    cy.wait('@saveActivityConfig')
  })
})
