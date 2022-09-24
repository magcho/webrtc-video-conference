const { mkdir, writeFile } = require("fs").promises;
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer");

const DIR = path.join(os.tmpdir(), "jest_puppeteer_global_setup");

module.exports = async function () {
  const commonBrowserOptions = [
    "--window-size=1280,720",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--no-sandbox",
    "--window-size=960,1200",
  ];
  const browser1 = await puppeteer.launch({
    headless: false,
    args: [
      ...commonBrowserOptions,
      "--use-file-for-fake-video-capture=./e2e/fixtures/mock1.y4m",
      "--use-file-for-fake-audio-capture=./e2e/fixtures/mock1.wav",
      "--window-position=0,0",
    ],
  });
  const browser2 = await puppeteer.launch({
    headless: false,
    args: [
      ...commonBrowserOptions,
      "--use-file-for-fake-video-capture=./e2e/fixtures/mock2.y4m",
      "--use-file-for-fake-audio-capture=./e2e/fixtures/mock2.wav",
      "--window-position=960,0",
    ],
  });
  // store the browser instance so we can teardown it later
  // this global is only available in the teardown but not in TestEnvironments
  globalThis.__BROWSER_GLOBAL1__ = browser1;
  globalThis.__BROWSER_GLOBAL2__ = browser2;

  // use the file system to expose the wsEndpoint for TestEnvironments
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, "wsEndpoint1"), browser1.wsEndpoint());
  await writeFile(path.join(DIR, "wsEndpoint2"), browser2.wsEndpoint());
};
