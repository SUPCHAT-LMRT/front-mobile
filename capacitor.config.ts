import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.supchatlmrt.frontmobile',
  appName: 'front-mobile',
  webDir: 'build',
  android: {
    // For development, to enable mixed content (HTTP and HTTPS)
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'http',
    allowNavigation: [
      'http://10.0.2.2:3000'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
