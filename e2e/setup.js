const { mkdir, writeFile } = require("fs").promises;
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer");

const DIR = path.join(os.tmpdir(), "jest_puppeteer_global_setup");

module.exports = async function () {
  const browser1 = await puppeteer.launch();
  const browser2 = await puppeteer.launch();
  // store the browser instance so we can teardown it later
  // this global is only available in the teardown but not in TestEnvironments
  globalThis.__BROWSER_GLOBAL1__ = browser1;
  globalThis.__BROWSER_GLOBAL2__ = browser2;

  // use the file system to expose the wsEndpoint for TestEnvironments
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, "wsEndpoint1"), browser1.wsEndpoint());
  await writeFile(path.join(DIR, "wsEndpoint2"), browser2.wsEndpoint());
};
