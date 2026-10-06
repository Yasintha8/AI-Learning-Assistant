import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ['lodash', 'pptx-preview', 'docx-preview'],
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('docx-preview')) {
              return 'vendor-docx';
            }
            if (id.includes('pptx-preview')) {
              return 'vendor-pptx';
            }
            if (id.includes('jszip')) {
              return 'vendor-jszip';
            }
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('react-syntax-highlighter')) {
              return 'vendor-syntax-highlighter';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-router-dom') || id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react-core';
            }
          }
        }
      }
    }
  }
})
