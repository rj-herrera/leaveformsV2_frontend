import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/leaveforms/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Default API prefix — forwards /api/* to the Laravel backend.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Do not force Content-Type or Accept — multipart uploads and binary
        // downloads (attachment / med-cert) need the browser/Axios headers.
        // JSON requests already set Accept/Content-Type via Axios.
      },
    },
  },
})
