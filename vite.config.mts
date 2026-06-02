// vite.config.mts
import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';

export default defineConfig({
  plugins: [RubyPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  
  build: {
    minify: 'esbuild',
    sourcemap: false, // Disable in production for faster builds and smaller artifacts
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,
    
    rollupOptions: {
      input: {
        application: 'app/javascript/entrypoints/application.jsx'
      },
      output: {
        manualChunks: {
          // Core vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-hot-toast', 'react-helmet', '@headlessui/react', 'lucide-react', '@heroicons/react'],
          'vendor-animation': ['framer-motion'],
          'vendor-http': ['axios'],
          
          // Data visualization (separate to lazy-load)
          'charts': ['recharts'],
          
          // Heavy 3D library (will be lazy-loaded, but grouped if loaded)
          'three-bundle': ['three'],
          
          // Drag and drop (consolidated to single library)
          'dnd': ['@hello-pangea/dnd'],
          
          // PDF handling (will be lazy-loaded)
          'pdf': ['pdfjs-dist', 'react-pdf', '@react-pdf/renderer'],
          
          // Firebase modules used by firebaseConfig.js/AuthContext.jsx
          'firebase': ['firebase/app', 'firebase/auth'],
          
          // Utilities
          'utils': ['date-fns', 'jwt-decode', 'react-icons', 'react-draggable', 'react-dropzone', 'react-rnd']
        }
      }
    }
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'axios',
      'framer-motion',
      '@hello-pangea/dnd',
      'date-fns',
      'lucide-react'
    ],
    exclude: [
      'three', // Will be lazy-loaded
      'pdfjs-dist', // Will be lazy-loaded
      'react-pdf', // Will be lazy-loaded
      'firebase' // Consider lazy-loading in future
    ]
  },
  
  server: {
    // Use native file watchers instead of polling for better performance
    watch: {
      usePolling: false
    }
  }
});
