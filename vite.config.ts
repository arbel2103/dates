import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/dates/' so the built site works when hosted at
// https://<user>.github.io/dates/
export default defineConfig({
  base: '/dates/',
  plugins: [react()],
})
