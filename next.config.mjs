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

export default nextConfig;
