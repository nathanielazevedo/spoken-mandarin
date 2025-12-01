import withPWA from '@ducanh2912/next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  turbopack: {
    resolveAlias: {
      canvas: ['./lib/canvas-shim.ts'],
    },
  },
  webpack: (config) => {
    // Fallback for Webpack-based builds (e.g., next build --webpack)
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) =>
          request.mode === 'navigate' ||
          url.pathname === '/' ||
          url.pathname.startsWith('/lesson/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 3,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'audio-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith('/api/') ||
          url.href.includes('/api/lessons') ||
          url.href.includes('/api/vocabulary') ||
          url.href.includes('/api/sentences'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5,
          cacheableResponse: {
            statuses: [0, 200],
          },
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
    ],
  },
})(nextConfig);
