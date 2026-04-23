/* global describe, it, cy */
describe('Economía del estudiante e inventario', () => {
  it('compra un marco, lo equipa y lo refleja en el mini-perfil público', () => {
    cy.login('student')

    cy.intercept('GET', '**/api/shop/items*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: 701,
            name: 'Marco Neon',
            description: 'Marco cosmético para comentarios.',
            type: 'avatar_frame',
            cost_coins: 80,
            minimum_level_required: 1,
            already_owned: false,
            locked_by_level: false,
            can_afford: true,
            owned_count: 0,
          },
        ],
        economy: {
          level: 5,
          total_xp: 1250,
          available_coins: 330,
          earned_coins: 400,
          spent_coins: 70,
          level_title: 'Veterano',
        },
      },
    }).as('shopItems')

    cy.intercept('GET', '**/api/shop/purchases*', {
      statusCode: 200,
      body: { data: [], economy: { available_coins: 330 } },
    }).as('shopPurchases')

    cy.intercept('POST', '**/api/shop/items/701/purchase', {
      statusCode: 200,
      body: {
        message: 'Marco comprado correctamente.',
        economy: { available_coins: 250 },
      },
    }).as('purchaseFrame')

    cy.visit('/student/shop')
    cy.wait(['@shopItems', '@shopPurchases'])
    cy.get('[data-cy="shop-item-buy-btn-701"]').click()
    cy.wait('@purchaseFrame')

    cy.intercept('GET', '**/api/student/inventory', {
      statusCode: 200,
      body: {
        equipped: {
          frame: null,
          title: null,
        },
        mini_profile: null,
        locker: {
          frames: [
            {
              id: 8801,
              is_equipped: false,
              shop_item: {
                id: 701,
                name: 'Marco Neon',
                description: 'Marco cosmético para comentarios.',
              },
              frame: {
                name: 'Marco Neon',
                frame_class: 'frame-neon',
                frame_svg: null,
              },
            },
          ],
          titles: [],
          extras: [],
          coupons: [],
        },
      },
    }).as('inventoryLocker')

    cy.visit('/student/inventory')
    cy.wait('@inventoryLocker')
    cy.intercept('POST', '**/api/student/inventory/equip', {
      statusCode: 200,
      body: {
        message: 'Marco equipado.',
        auth_user: {
          id: 201,
          name: 'Estudiante QA',
          email: 'estudiante@plataforma.com',
          role: 'student',
          avatar: 'https://i.pravatar.cc/120?img=12',
          equipped_avatar_frame: { frame_class: 'frame-neon', frame_svg: null },
          equipped_profile_title: null,
        },
      },
    }).as('equipFrame')

    cy.get('[data-cy="inventory-frame-equip-btn-8801"]').click()
    cy.wait('@equipFrame')

    cy.intercept('GET', '**/api/comments*', {
      statusCode: 200,
      body: {
        comments: [
          {
            id: 3001,
            body: 'Excelente curso.',
            created_at: '2026-04-22T12:00:00Z',
            is_question: false,
            is_resolved: false,
            author: {
              id: 201,
              name: 'Estudiante QA',
              avatar: 'https://i.pravatar.cc/120?img=12',
              equipped_avatar_frame: { frame_class: 'frame-neon', frame_svg: null },
              equipped_profile_title: { label: 'Veterano' },
            },
            replies: [],
          },
        ],
      },
    }).as('comments')

    cy.intercept('GET', '**/api/users/201/mini-profile', {
      statusCode: 200,
      body: {
        profile: {
          id: 201,
          name: 'Estudiante QA',
          avatar: 'https://i.pravatar.cc/120?img=12',
          level: 5,
          level_title: 'Veterano',
          streak: 4,
          mini_bio: 'QA gamer',
          equipped_avatar_frame: {
            name: 'Marco Neon',
            frame_class: 'frame-neon',
            frame_svg: null,
          },
          equipped_profile_title: {
            label: 'Veterano',
          },
          top_badges: [
            { id: 1, name: 'Constante', description: '7 días', icon: 'https://example.com/badge-1.png' },
          ],
        },
      },
    }).as('miniProfile')

    cy.intercept('GET', '**/api/lessons/4003', {
      statusCode: 200,
      body: {
        course: { id: 801, title: 'Curso Fullstack QA', progress: { overall_progress: 100 } },
        lesson: {
          id: 4003,
          title: 'Lección con comentarios',
          type: 'resource',
          duration: 0,
          content: {
            kind: 'resource',
            payload: {
              file_url: 'https://example.com/guia.pdf',
              file_name: 'guia.pdf',
              description: 'Recurso con hilo de comentarios',
            },
          },
        },
        interactive_config: null,
        sidebar: { modules: [] },
        navigation: {},
        comment_target: { type: 'lesson', id: 4003 },
      },
    }).as('lessonWithComments')

    cy.intercept('POST', '**/api/lessons/4003/complete', {
      statusCode: 200,
      body: {
        message: 'Recurso marcado como visto.',
        progress: { overall_progress: 100 },
      },
    }).as('supportLessonSeen')

    cy.visit('/student/learn/4003')
    cy.wait('@lessonWithComments')
    cy.wait('@supportLessonSeen')
    cy.wait('@comments')
    cy.get('[data-cy="comment-avatar-btn-3001"]').should('be.visible').click({ force: true })
    cy.wait('@miniProfile')
    cy.get('[data-cy="mini-profile-dialog"]').should('be.visible')
    cy.get('[data-cy="frame-neon"]').should('exist')
  })
})
