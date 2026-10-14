import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // ESTA LÍNEA SOLUCIONA LA PANTALLA EN BLANCO EN EL .EXE
  base: './', 
  
  // TU CONFIGURACIÓN ORIGINAL SE MANTIENE INTACTA
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true 
  }
})