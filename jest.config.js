module.exports = {
  testMatch: ["**/?(*.)+(spec|test).+(js)"],
  globalSetup: "./e2e/setup.js",
  globalTeardown: "./e2e/teardown.js",
  testEnvironment: "./e2e/puppeteer_environment.js",
};
