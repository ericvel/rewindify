import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// The Vite config is a function now — it reads the environment — so this one
// has to be too, and hand the same `configEnv` on.
export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: 'jsdom',
        // `styles/breakpoints.module.scss` only exports real values when Vitest
        // processes CSS; without this a lookup yields a scoped class name.
        css: true,
        exclude: [...configDefaults.exclude, 'e2e/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
      },
    }),
  ),
)
