import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Default API prefix — forwards /api/* to the Laravel backend.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Do not force Content-Type — multipart uploads (e.g. med_cert) need
        // the browser/Axios boundary. JSON requests set Content-Type via Axios.
        headers: {
          Accept: 'application/json',
        },
      },
    },
  },
})
