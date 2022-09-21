const { readFile } = require("fs").promises;
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer");
const NodeEnvironment = require("jest-environment-node").default;

const DIR = path.join(os.tmpdir(), "jest_puppeteer_global_setup");

class PuppeteerEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint1 = await readFile(path.join(DIR, "wsEndpoint1"), "utf8");
    const wsEndpoint2 = await readFile(path.join(DIR, "wsEndpoint2"), "utf8");
    if (!wsEndpoint1 && !wsEndpoint2) {
      throw new Error("wsEndpoint not found");
    }

    // connect to puppeteer
    this.global.__BROWSER_GLOBAL1__ = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint1,
    });
    this.global.__BROWSER_GLOBAL2__ = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint2,
    });
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = PuppeteerEnvironment;
