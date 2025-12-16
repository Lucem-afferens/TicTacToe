import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname);

export default defineConfig({
  // Используем root: 'web' для правильной работы dev сервера
  // Но алиасы настроены относительно корня проекта
  root: 'web',
  build: {
    outDir: resolve(rootDir, 'dist/web'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'web/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  resolve: {
    // Алиасы настроены относительно корня проекта (rootDir)
    // Это позволяет импортировать из shared/ даже когда root = web
    alias: {
      '@shared': resolve(rootDir, 'shared'),
      '@web': resolve(rootDir, 'web'),
      '@bot': resolve(rootDir, 'bot'),
    },
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
});

