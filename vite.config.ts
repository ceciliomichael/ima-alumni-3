import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5030,
    open: true,
    host: true,
    strictPort: false,
    allowedHosts: ['devtest2.echosphere.dpdns.org'],
    cors: {
      origin: ['https://devtest2.echosphere.dpdns.org/'],
      credentials: true
    }
  },
})
