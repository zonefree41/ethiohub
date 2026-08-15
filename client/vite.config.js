import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __IOS_BUILD__: JSON.stringify(process.env.IOS_BUILD === 'true'),
  },
})
