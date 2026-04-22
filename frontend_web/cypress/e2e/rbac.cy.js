/* global describe, it, cy */
describe('RBAC y seguridad de rutas', () => {
  it('redirige a un estudiante si intenta entrar al dashboard docente', () => {
    cy.login('student')
    cy.visit('/teacher/dashboard')

    cy.location('pathname').should('eq', '/student/dashboard')
    cy.get('[data-cy="student-layout"]').should('exist')
    cy.get('[data-cy="teacher-layout"]').should('not.exist')
  })

  it('redirige a un estudiante si intenta entrar a cursos admin', () => {
    cy.login('student')
    cy.visit('/admin/courses')

    cy.location('pathname').should('eq', '/student/dashboard')
    cy.get('[data-cy="student-sidebar"]').should('exist')
  })

  it('renderiza el layout correcto según el rol autenticado', () => {
    cy.login('student')
    cy.visit('/student/dashboard')
    cy.get('[data-cy="student-layout"]').should('exist')
    cy.get('[data-cy="student-sidebar"]').should('exist')

    cy.login('teacher')
    cy.visit('/teacher/dashboard')
    cy.get('[data-cy="teacher-layout"]').should('exist')
    cy.get('[data-cy="teacher-sidebar"]').should('exist')

    cy.login('admin')
    cy.visit('/admin/dashboard')
    cy.get('[data-cy="admin-layout"]').should('exist')
    cy.get('[data-cy="admin-sidebar"]').should('exist')
  })
})
