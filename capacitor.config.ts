import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandarinspoken.app',
  appName: 'Spoken Mandarin',
  webDir: '.next/static',
  // For development, use the local server
  // For production, deploy your Next.js app and update this URL
  server: {
    // Development: point to local Next.js dev server
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true, // Allow HTTP for local development
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Spoken Mandarin',
  },
};

export default config;
