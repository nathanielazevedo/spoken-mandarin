import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandarinspoken.app',
  appName: 'Spoken Mandarin',
  webDir: 'out',
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
