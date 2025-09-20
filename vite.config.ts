import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5030,
    open: true,
    host: true,
    strictPort: false,
    allowedHosts: ['test.echosphere.dpdns.org'],
    cors: {
      origin: ['https://test.echosphere.dpdns.org/'],
      credentials: true
    }
  },
})
