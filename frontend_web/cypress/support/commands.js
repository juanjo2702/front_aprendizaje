/* global Cypress, cy, expect */
const API_URL = Cypress.env('apiUrl') || 'http://localhost:8000/api'

const demoUsers = {
  student: {
    id: 201,
    name: 'Estudiante QA',
    email: 'estudiante@plataforma.com',
    role: 'student',
    avatar: 'https://i.pravatar.cc/120?img=12',
    equipped_avatar_frame: null,
    equipped_profile_title: null,
  },
  instructor: {
    id: 101,
    name: 'Docente QA',
    email: 'profesor@plataforma.com',
    role: 'instructor',
    avatar: 'https://i.pravatar.cc/120?img=14',
  },
  admin: {
    id: 1,
    name: 'Admin QA',
    email: 'admin@plataforma.com',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/120?img=15',
  },
}

Cypress.Commands.add('login', (role = 'student') => {
  const normalizedRole = role === 'teacher' ? 'instructor' : role
  const user = demoUsers[normalizedRole]

  if (!user) {
    throw new Error(`Rol no soportado en cy.login(): ${role}`)
  }

  cy.session(
    `role:${normalizedRole}`,
    () => {
      cy.intercept('POST', `${API_URL}/login`, {
        statusCode: 200,
        body: {
          token: `fake-token-${normalizedRole}`,
          user,
        },
      }).as(`login${normalizedRole}`)

      cy.intercept('GET', `${API_URL}/profile`, {
        statusCode: 200,
        body: user,
      }).as(`profile${normalizedRole}`)

      cy.visit('/login')
      cy.window().then((win) => {
        win.localStorage.setItem('token', `fake-token-${normalizedRole}`)
        win.localStorage.setItem('user', JSON.stringify(user))
      })
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.window().then((win) => {
          expect(win.localStorage.getItem('token')).to.eq(`fake-token-${normalizedRole}`)
          expect(JSON.parse(win.localStorage.getItem('user') || '{}').role).to.eq(user.role)
        })
      },
    },
  )

})

Cypress.Commands.add('simulateVideoEnd', (selector = '[data-cy="student-video-element"]') => {
  cy.get(selector)
    .should('exist')
    .then(($video) => {
      const video = $video.get(0)
      video.dispatchEvent(new Event('ended', { bubbles: true }))
    })
})

Cypress.Commands.add('uploadChunkedFile', (options = {}) => {
  const {
    endpoint = '**/api/teacher/upload-video',
    selector = '[data-cy="chunked-uploader-input"] input[type=file]',
    fileName = 'video-demo.mp4',
    fileType = 'video/mp4',
    chunkCount = 3,
    uploadToken = 'upload-token-demo',
  } = options

  const totalChunks = Number(chunkCount || 1)
  let seenChunks = 0

  cy.intercept('POST', endpoint, (req) => {
    seenChunks += 1
    const currentChunkIndex = Number(req.body?.get?.('chunk_index') || seenChunks - 1)
    const declaredTotal = Number(req.body?.get?.('total_chunks') || totalChunks)

    req.reply({
      statusCode: 200,
      body: {
        status: currentChunkIndex + 1 >= declaredTotal ? 'completed' : 'partial',
        upload_token: uploadToken,
        file: {
          token: uploadToken,
          file_name: fileName,
        },
      },
    })
  }).as('chunkUpload')

  cy.window().then((win) => {
    const content = new Uint8Array(10 * 1024 * 1024 * totalChunks).fill(7)
    const blob = new win.Blob([content], { type: fileType })
    const testFile = new win.File([blob], fileName, { type: fileType })
    const dataTransfer = new win.DataTransfer()
    dataTransfer.items.add(testFile)

    cy.get(selector).selectFile(
      {
        contents: testFile,
        fileName,
        mimeType: fileType,
        lastModified: Date.now(),
      },
      { force: true },
  )

  cy.intercept('GET', `${API_URL}/user/dashboard-stats`, {
    statusCode: 200,
    body: {
      stats: {
        current_level: 5,
        total_points: 1250,
        available_coins: 330,
        earned_coins: 400,
        spent_coins: 70,
        current_streak: 4,
        level_title: 'Veterano',
      },
      courses: { recent: [] },
      activities: { recent_purchases: [] },
    },
  })
  cy.intercept('GET', `${API_URL}/user/recent-activity*`, {
    statusCode: 200,
    body: { activities: [] },
  })
  cy.intercept('GET', `${API_URL}/badges/my`, {
    statusCode: 200,
    body: { badges: [] },
  })
  cy.intercept('GET', `${API_URL}/badges/available`, {
    statusCode: 200,
    body: { badges: [] },
  })
  cy.intercept('GET', `${API_URL}/certificates*`, {
    statusCode: 200,
    body: { data: [] },
  })
  cy.intercept('GET', `${API_URL}/student/inventory`, {
    statusCode: 200,
    body: {
      equipped: { frame: null, title: null },
      mini_profile: null,
      locker: { frames: [], titles: [], extras: [], coupons: [] },
    },
  })
  cy.intercept('GET', `${API_URL}/shop/purchases*`, {
    statusCode: 200,
    body: { data: [], economy: { available_coins: 330 } },
  })
  cy.intercept('GET', `${API_URL}/shop/items*`, {
    statusCode: 200,
    body: {
      items: [],
      economy: {
        level: 5,
        total_xp: 1250,
        available_coins: 330,
        earned_coins: 400,
        spent_coins: 70,
        level_title: 'Veterano',
      },
    },
  })
  cy.intercept('GET', `${API_URL}/user/courses*`, {
    statusCode: 200,
    body: { data: [] },
  })
})

  cy.get('[data-cy="chunked-upload-submit-btn"]').click()
  cy.wait('@chunkUpload')
})

declareGlobalCommandTypes()

function declareGlobalCommandTypes() {
  // Hook vacío para mantener el archivo autoexplicativo en JS puro.
}
