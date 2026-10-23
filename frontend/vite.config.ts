/// <reference types="vitest/config" />
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const certPath = path.resolve(import.meta.dirname, ".certs/dev-cert.pem");
const keyPath = path.resolve(import.meta.dirname, ".certs/dev-key.pem");

// Enables HTTPS automatically when a local cert exists (see README: "Certificado
// HTTPS local con mkcert"). getUserMedia (cámara) requires a secure context on
// any origin other than localhost, so this is what makes the camera work when
// testing from a phone over the LAN.
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
    https: hasLocalCert
      ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon.svg"],
      manifest: {
        name: "Fashion AR Runway",
        short_name: "Fashion AR",
        description:
          "Experiencia de realidad aumentada para pasarelas de moda: apunta la cámara y descubre cada vestido.",
        theme_color: "#0b0b12",
        background_color: "#0b0b12",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,glb}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/dresses"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "dresses-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
