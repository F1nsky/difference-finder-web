import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/difference-finder-web/',
  plugins: [react()],
});
