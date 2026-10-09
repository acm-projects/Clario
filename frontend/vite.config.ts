import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Forward code-execution requests to the FastAPI backend (Piston wrapper)
      '/run': 'http://localhost:8000',
      // Forward problem/session API requests to the same backend
      '/api': 'http://localhost:8000',
    },
  },
})