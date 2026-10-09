const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests',
  reporter: [['list'], ['json', { outputFile: 'results/results.json' }], ['html', { open: 'never', outputFolder: 'results/html' }]],
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4173', viewport: { width: 900, height: 900 } },
  webServer: process.env.BASE_URL ? undefined : { command: 'npx http-server -p 4173 -s .', port: 4173, reuseExistingServer: true },
});
