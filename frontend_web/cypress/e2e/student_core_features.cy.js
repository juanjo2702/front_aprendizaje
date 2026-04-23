/* global describe, it, cy, expect, Cypress */
function setField(selector, value) {
  cy.get(selector).then(($el) => {
    const target = $el.is('input, textarea') ? cy.wrap($el) : cy.wrap($el).find('input, textarea').first()
    target.clear({ force: true }).type(String(value), { force: true }).blur({ force: true })
  })
}

function mockInventoryWithCoupon() {
  cy.intercept('GET', '**/api/student/inventory*', {
    statusCode: 200,
    body: {
      equipped: {
        frame: { name: 'Marco Neon', frame_class: 'frame-neon', frame_svg: null },
        title: { label: 'Estudiante Veterano' },
      },
      mini_profile: { mini_bio: 'QA gamer' },
      locker: {
        frames: [
          {
            id: 8801,
            is_equipped: true,
            shop_item: { id: 701, name: 'Marco Neon', description: 'Marco social.' },
            frame: { name: 'Marco Neon', frame_class: 'frame-neon', frame_svg: null },
          },
        ],
        titles: [
          {
            id: 8802,
            is_equipped: true,
            shop_item: { id: 702, name: 'Veterano', description: 'Título público.' },
            title: { label: 'Estudiante Veterano' },
          },
        ],
        extras: [],
        coupons: [
          {
            id: 990,
            code: 'QA20',
            discount_percent: 20,
            is_used: false,
            shop_item: { name: 'Cupón QA 20%', description: 'Descuento para cursos.' },
          },
        ],
      },
      economy: {
        level: 5,
        total_xp: 1250,
        available_coins: 330,
        earned_coins: 400,
        spent_coins: 70,
        level_title: 'Veterano',
      },
    },
  }).as('inventoryWithCoupon')
}

describe('Funcionalidades centrales del estudiante', () => {
  it('muestra dashboard con radar, XP, monedas, cursos activos y certificados', () => {
    cy.login('student')

    cy.intercept('GET', '**/api/user/dashboard-stats*', {
      statusCode: 200,
      body: {
        stats: {
          current_level: 6,
          total_points: 1420,
          available_coins: 330,
          earned_coins: 500,
          spent_coins: 170,
          current_streak: 7,
          level_title: 'Veterano',
        },
        courses: {
          recent: [
            {
              progress: 75,
              course: {
                id: 801,
                slug: 'curso-fullstack-qa',
                title: 'Curso Fullstack QA',
                instructor: { name: 'Docente QA' },
                category: { name: 'QA' },
              },
            },
          ],
        },
        activities: {
          recent_purchases: [
            {
              id: 1,
              status: 'completed',
              cost_coins: 80,
              purchased_at: '2026-04-22T10:00:00Z',
              shop_item: { name: 'Marco Neon', type: 'avatar_frame' },
            },
          ],
        },
      },
    }).as('dashboardStats')

    cy.intercept('GET', '**/api/user/recent-activity*', {
      statusCode: 200,
      body: {
        activities: [
          {
            id: 77,
            type: 'certificate',
            title: 'Certificado emitido',
            certificate_code: 'CERT-QA-001',
            date: '2026-04-22T12:00:00Z',
          },
        ],
      },
    }).as('recentActivity')

    cy.visit('/student/dashboard')
    cy.wait(['@dashboardStats', '@recentActivity'])

    cy.contains('Sube de nivel').should('be.visible')
    cy.contains('330').should('be.visible')
    cy.contains('Curso Fullstack QA').should('be.visible')
    cy.contains('CERT-QA-001').should('be.visible')
    cy.contains('Marco Neon').should('be.visible')
  })

  it('permite editar perfil y mini-perfil público', () => {
    cy.login('student')

    cy.intercept('GET', '**/api/profile*', {
      statusCode: 200,
      body: {
        id: 201,
        name: 'Estudiante QA',
        email: 'estudiante@plataforma.com',
        headline: 'Aprendiz',
        location: 'La Paz',
        bio: 'Bio inicial',
        mini_bio: 'Mini inicial',
        avatar: 'https://i.pravatar.cc/120?img=12',
        equipped_avatar_frame: { frame_class: 'frame-neon', frame_svg: null },
        equipped_profile_title: { label: 'Estudiante Veterano' },
      },
    }).as('profile')

    cy.intercept('PUT', '**/api/profile', (req) => {
      expect(req.body.name).to.eq('Estudiante QA Editado')
      expect(req.body.mini_bio).to.eq('Mini perfil listo para comentarios.')
      req.reply({ statusCode: 200, body: { message: 'Perfil guardado.' } })
    }).as('saveProfile')

    cy.visit('/student/profile')
    cy.wait('@profile')

    setField('[data-cy="profile-name-input"]', 'Estudiante QA Editado')
    setField('[data-cy="profile-headline-input"]', 'QA Automation Learner')
    setField('[data-cy="profile-mini-bio-input"]', 'Mini perfil listo para comentarios.')
    cy.get('[data-cy="profile-save-btn"]').click()
    cy.wait('@saveProfile')
  })

  it('permite cambiar foto y contraseña desde configuración de cuenta', () => {
    cy.login('student')

    cy.intercept('GET', '**/api/profile*', {
      statusCode: 200,
      body: {
        id: 201,
        name: 'Estudiante QA',
        email: 'estudiante@plataforma.com',
        headline: 'Aprendiz',
        location: 'La Paz',
        bio: 'Bio inicial',
        mini_bio: 'Mini inicial',
        avatar: 'https://i.pravatar.cc/120?img=12',
      },
    }).as('profileForSecurity')

    cy.intercept('POST', '**/api/profile/avatar', (req) => {
      expect(req.headers['content-type']).to.include('multipart/form-data')
      req.reply({
        statusCode: 200,
        body: {
          message: 'Foto actualizada.',
          user: {
            id: 201,
            name: 'Estudiante QA',
            email: 'estudiante@plataforma.com',
            role: 'student',
            avatar: 'http://localhost:8000/storage/avatars/qa.png',
          },
        },
      })
    }).as('uploadAvatar')

    cy.intercept('POST', '**/api/profile/password', (req) => {
      expect(req.body.current_password).to.eq('password')
      expect(req.body.password).to.eq('password-nueva')
      expect(req.body.password_confirmation).to.eq('password-nueva')
      req.reply({ statusCode: 200, body: { message: 'Contraseña actualizada.' } })
    }).as('changePassword')

    cy.visit('/student/profile')
    cy.wait('@profileForSecurity')

    cy.get('[data-cy="profile-avatar-native-input"]')
      .selectFile(
      {
        contents: Cypress.Buffer.from('avatar-qa'),
        fileName: 'avatar-qa.png',
        mimeType: 'image/png',
      },
      { force: true },
      )
    cy.contains('button', 'Cambiar foto').click()
    cy.wait('@uploadAvatar')

    cy.contains('button', 'Cambiar contraseña').click()
    cy.get('[data-cy="change-password-dialog"]').should('be.visible')
    setField('[data-cy="current-password-input"]', 'password')
    setField('[data-cy="new-password-input"]', 'password-nueva')
    setField('[data-cy="confirm-password-input"]', 'password-nueva')
    cy.get('[data-cy="submit-password-change-btn"]').click()
    cy.wait('@changePassword')
  })

  it('lista certificados y permite preparar descarga', () => {
    cy.login('student')

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
    }).as('certificates')

    cy.intercept('GET', '**/api/certificates/9901/download', {
      statusCode: 200,
      body: { message: 'Descarga preparada.' },
    }).as('downloadCertificate')

    cy.visit('/student/certificates')
    cy.wait('@certificates')

    cy.contains('Curso Fullstack QA').should('be.visible')
    cy.contains('CERT-QA-001').should('be.visible')
    cy.get('[data-cy="certificate-download-btn-9901"]').click()
    cy.wait('@downloadCertificate')
  })

  it('canjea un cupón comprado en el checkout QR', () => {
    cy.login('student')
    mockInventoryWithCoupon()

    cy.intercept('GET', '**/api/courses/curso-cupon-qa', {
      statusCode: 200,
      body: {
        id: 802,
        slug: 'curso-cupon-qa',
        title: 'Curso con Cupón QA',
        price: 100,
        is_enrolled: false,
        has_certificate: true,
        category: { name: 'QA' },
        modules: [],
      },
    }).as('couponCourse')

    cy.intercept('POST', '**/api/payments/intent', (req) => {
      expect(req.body.course_id).to.eq(802)
      expect(req.body.coupon_code).to.eq('QA20')
      req.reply({
        statusCode: 200,
        body: {
          status: 'pending',
          amount: 80,
          original_amount: 100,
          discount_amount: 20,
          discount_percent: 20,
          qr_code: 'data:image/png;base64,AAAA',
          transaction_id: 'txn-coupon-qa',
        },
      })
    }).as('couponPaymentIntent')

    cy.intercept('GET', '**/api/payments/txn-coupon-qa', {
      statusCode: 200,
      body: { status: 'pending' },
    }).as('couponPaymentStatus')

    cy.visit('/student/inventory')
    cy.wait('@inventoryWithCoupon')
    cy.contains('QA20').should('be.visible')

    cy.visit('/student/marketplace/curso-cupon-qa')
    cy.wait('@couponCourse')
    cy.get('[data-cy="buy-course-qr-btn"]').click()
    cy.get('[data-cy="checkout-dialog"]').should('be.visible')
    cy.get('[data-cy="available-coupons-select"]').click()
    cy.contains('.q-item', 'QA20').click()
    cy.get('[data-cy="generate-qr-btn"]').click()
    cy.wait('@couponPaymentIntent').its('response.body').should((body) => {
      expect(body.original_amount).to.eq(100)
      expect(body.discount_amount).to.eq(20)
      expect(body.discount_percent).to.eq(20)
      expect(body.amount).to.eq(80)
    })
    cy.contains('Total a pagar').should('be.visible')
  })
})
