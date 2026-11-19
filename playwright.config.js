// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Las pruebas leen TEST_EMAIL y TEST_PASSWORD de .env.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables que ya tenga el sistema.
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Un solo usuario de prueba: las pruebas corren una por una.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // En Windows, si Playwright arranca el servidor, a veces no logra apagarlo
  // y la corrida no termina. Ahí conviene tener `npm start` en otra ventana:
  // con reuseExistingServer, Playwright usa ese servidor y no lo apaga.
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000/health',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
