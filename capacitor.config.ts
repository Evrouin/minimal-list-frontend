import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.evrouin.minimallist',
  appName: 'minimal list',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
