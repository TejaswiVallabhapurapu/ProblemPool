import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const threeuiFloatingPlugin = () => ({
  name: 'threeui-floating-visual-fix',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('NeuformBatchEffects') || id.includes('neuform-isolated')) {
      let modified = code;
      // 1. Remove scrollbar from ThreeUI isolated UI container
      modified = modified.replace(/overflow:\s*auto\s*!important/g, 'overflow: hidden !important; scrollbar-width: none !important');
      // 2. Remove default opaque background from iframe body/html
      modified = modified.replace(/background:\s*\$\{o\}\s*!important/g, 'background: transparent !important');
      // 3. Make wireframeForms background transparent
      modified = modified.replace(/background:\s*\(e\)\s*=>\s*e\s*===\s*["']light["']\s*\?\s*d\s*:\s*["']#050505["']/g, 'background: () => "transparent"');
      // 4. Make iframe style background transparent
      modified = modified.replace(/background:\s*U,/g, 'background: "transparent",');
      // 5. Remove padding and set full responsive width in focusCss
      modified = modified.replace(/padding:\s*1\.5rem\s*!important/g, 'padding: 0 !important');
      modified = modified.replace(/width:\s*min\(72vw,\s*480px\)\s*!important/g, 'width: 100% !important');
      return {
        code: modified,
        map: null,
      };
    }
    if (id.includes('wireframe-forms.html')) {
      let modified = code;
      // Remove opaque dark background inside wireframe HTML source
      modified = modified.replace(/background-color:\s*#050505/g, 'background-color: transparent');
      modified = modified.replace(/bg-\[#050505\]/g, 'bg-transparent');
      modified = modified.replace(/#050505/g, 'transparent');
      return {
        code: modified,
        map: null,
      };
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    threeuiFloatingPlugin(),
    react(),
  ],
  optimizeDeps: {
    exclude: ['@designcodeio/threeui'],
  },
  server: {
    port: 5173,
  },
});

