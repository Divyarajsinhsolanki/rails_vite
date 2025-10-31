// vite.config.mts
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';

export default defineConfig({
  plugins: [RubyPlugin()],
  build: {
    rollupOptions: {
      input: {
        application: 'app/javascript/entrypoints/application.jsx'
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js'
  }
});
