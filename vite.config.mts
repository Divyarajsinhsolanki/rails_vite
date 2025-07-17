// vite.config.mts
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [RubyPlugin(), nodePolyfills()],
  build: {
    rollupOptions: {
      input: {
        application: 'app/javascript/entrypoints/application.jsx'
      }
    }
  }
});
