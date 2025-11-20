import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5030,
    open: true,
    host: true,
    strictPort: false,
    allowedHosts: ['ima-alumni.echosphere.dpdns.org', 'ima-alumni.echosphere.systems'],
    cors: {
      origin: ['https://ima-alumni.echosphere.dpdns.org/', 'ima-alumni.echosphere.systems'],
      credentials: true
    }
  },
})
