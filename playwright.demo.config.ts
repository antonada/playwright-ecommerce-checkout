import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

// Slowed-down run with video, used to record the walkthrough in docs/media.
// Not part of the regular suite: npm run demo:record
export default defineConfig({
  ...baseConfig,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: 'demo-results',
  grep: [
    /customer finds products/,
    /recovers after "Try again"/,
    /flags every required field/,
    /returns 503/,
  ],
  projects: [
    {
      name: 'demo',
      testIgnore: /api\//,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        video: { mode: 'on', size: { width: 1280, height: 720 } },
        launchOptions: { slowMo: 600 },
      },
    },
  ],
});
