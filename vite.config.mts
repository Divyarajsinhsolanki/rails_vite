// vite.config.mts
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';

export default defineConfig({
  plugins: [RubyPlugin()],
  // Optionally, ensure .jsx imports are resolved:
  resolve: { extensions: ['.js', '.jsx'] }
});
