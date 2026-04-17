import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ローカル開発時に /api へのリクエストを 8080ポートのバックエンドへ転送する
    proxy: {
      '/api': {
        target: 'http://backend:8080', // バックエンドが動いているローカルのURL
        changeOrigin: true,
      }
    }
  }
});
