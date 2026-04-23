import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:9000',
    specPattern: 'e2e/**/*.cy.js',
    supportFile: 'support/e2e.js',
    video: false,
    viewportWidth: 1440,
    viewportHeight: 960,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:8000/api',
    },
  },
})
