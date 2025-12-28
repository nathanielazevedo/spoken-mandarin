import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mandarinspoken.app',
  appName: 'Spoken Mandarin',
  webDir: 'out',
  server: {
    url: 'https://language-livid.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
