const { setTimeout } = require("timers/promises");

jest.setTimeout(999999);
describe("webRTCのテスト", () => {
  const browser1 = globalThis.__BROWSER_GLOBAL1__;
  const browser2 = globalThis.__BROWSER_GLOBAL2__;
  const pages = [browser1.newPage(), browser2.newPage()];

  beforeEach(() =>
    eachPageRunner(pages, async ({ page }) => {
      await page.goto("http://localhost:8080");

      await setTimeout(1000);

      await page.type("#roomId", "1");
      await page.click("#joinBtn");

      await setTimeout(2000);
    })
  );

  afterEach(async () => {
    await eachPageRunner(pages, async ({ page }) => {
      await page.screenshot({ path: `./shots/${Math.random()}.png` });
      await screenshotElement(
        page,
        "#videos video",
        `./shots/${Math.random()}.png`
      );
    });
    await eachPageRunner(pages, async ({ page }) => {
      await page.click("#leaveBtn");
    });
  });

  test("sample", () => {
    expect(1 + 1).toBe(2);
  });

  // test("初期状態で音声・映像は有効化されている", async () => {
  //   const page = await browser1.newPage();
  //   await page.goto("http://localhost:8080");
  // });
});

async function eachPageRunner(pages, runner) {
  for await (let page of pages) {
    await runner({ page });
  }
}

/**
 * see: https://qiita.com/tamanugi/items/8cc1266265457f13b9ea
 */
async function screenshotElement(page, selector, filename) {
  const clip = await page.evaluate((s) => {
    const el = document.querySelector(s);
    const { width, height, top: y, left: x } = el.getBoundingClientRect();
    return { width, height, x, y };
  }, selector);
  await page.screenshot({ clip, path: filename });
}
