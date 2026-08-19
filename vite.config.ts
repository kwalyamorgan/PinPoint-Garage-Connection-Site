import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Keep local dev at root. GitHub Pages build should set VITE_BASE_PATH=/repo-name/
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,

    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'docs',
    },

    // File types to support raw imports
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})