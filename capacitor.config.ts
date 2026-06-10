import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:4173';

const config: CapacitorConfig = {
  appId: 'com.cvms.recruitment',
  appName: 'CVMS Recruitment',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://')
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
};

export default config;
