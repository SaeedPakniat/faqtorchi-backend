// eslint-disable-next-line no-undef
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_WEB_BASE_URL || "http://localhost:8081",
    trace: "on-first-retry",
  },
});
