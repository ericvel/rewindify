import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  /**
   * Spelled out as a literal so the fixture flag folds to a constant. Vite only
   * inlines env vars it can see, and inlines the whole `import.meta.env` object
   * for the ones it cannot — which would leave the branch live and drag
   * `src/fake/` into a production bundle that never runs it.
   */
  define: {
    'import.meta.env.VITE_FAKE_SPOTIFY': JSON.stringify(
      loadEnv(mode, process.cwd(), '').VITE_FAKE_SPOTIFY ?? '',
    ),
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
