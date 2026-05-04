import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'next.config.ts',
        'postcss.config.mjs',
        'public/**',
        'src/lib/supabase.ts',
        'src/lib/i18n.ts',
        'src/lib/types.ts',
        'src/core/domain/repositories/IEventRepository.ts',
        'src/app/layout.tsx', // mainly font config
        'src/app/PwaRegister.tsx', // mostly boilerplate
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
        '**/.next/**',
      ],
      thresholds: {
        lines: 95,
        functions: 75,
        branches: 80,
        statements: 95,
      }
    }
  }
})
