import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    quasar({
      sassVariables: 'src/quasar-variables.sass',
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/quasar.config.js',
        '**/*.config.js',
        'src/router/index.js',
        'src/store/index.js',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
    exclude: ['node_modules', 'dist'],
    reporters: ['verbose'],
    outputFile: './test-results.xml',
    onConsoleLog: (log, type) => {
      if (type === 'stderr') return false
      return !log.includes('Generated')
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      src: '/src',
    },
  },
})
