/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: For Capacitor builds, use `npm run cap:build` which sets output to 'export'
  // For web deployment with API routes, keep this commented out
  // output: 'export',
  // images: { unoptimized: true },
  transpilePackages: ['@mui/material', '@mui/system', '@mui/icons-material'],
  turbopack: {
    resolveAlias: {
      canvas: ['./lib/canvas-shim.ts'],
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
