import { defineConfig, devices } from '@playwright/test';

// Eigener Port: 4321 ist der Astro-Standard und oft von anderen Projekten belegt – dann würden die Tests deren Server prüfen.
const PORT = Number(process.env.PW_PORT || 4391);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/ics-editor/`,
    trace: 'off',
    // Alle Tests starten mit „Messung abgelehnt“, damit das Einwilligungs-Banner nichts verdeckt; consent.spec.ts prüft das Banner selbst.
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'ics-editor-consent', value: JSON.stringify({ v: 'denied', t: '2026-01-01T00:00:00Z' }) }] }] }
  },
  webServer: { command: `npx astro preview --port ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
