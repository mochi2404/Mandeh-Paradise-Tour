import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        adminAnalytics: resolve(__dirname, 'admin/analytics/index.html'),
        adminPackages: resolve(__dirname, 'admin/packages/index.html'),
        adminOrders: resolve(__dirname, 'admin/orders/index.html'),
        adminOrderDetail: resolve(__dirname, 'admin/orders/detail/index.html'),
        adminSettings: resolve(__dirname, 'admin/settings/index.html'),
      },
    },
  },
})
