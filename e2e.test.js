const { setTimeout } = require("timers/promises");
const { readQrCode } = require("./e2e/qrcode");

jest.setTimeout(999999);

describe("webRTCのテスト", () => {
  const browser1 = globalThis.__BROWSER_GLOBAL1__;
  const browser2 = globalThis.__BROWSER_GLOBAL2__;
  const pages = [browser1.newPage(), browser2.newPage()];
  let page1, page2;

  beforeEach(async () => {
    page1 = await pages[0];
    page2 = await pages[1];

    await eachPageRunner(pages, async ({ page }) => {
      await page.goto("http://localhost:8080");

      await setTimeout(1000);

      await page.type("#roomId", "1");
      await page.click("#joinBtn");

      await setTimeout(2000);
    });
  });

  afterEach(async () => {
    await eachPageRunner(pages, async ({ page }) => {
      await page.screenshot({ path: `./shots/${Math.random()}.png` });
    });

    await eachPageRunner(pages, async ({ page }) => {
      await page.click("#leaveBtn");
    });
  });

  test("１は２の映像を見ることができる", async () => {
    const user2VideoImage = await screenshotElement(page1, "#videos video");
    const qrContents = await readQrCode(user2VideoImage);

    expect(qrContents).toBe("https://lp.chatwork.com/product-day/2022/");
  });

  test("２がカメラを消したとき１は２の映像を見ることができない", async () => {
    page2.click("#hideCameraBtn");
    await setTimeout(500);

    const user2VideoImage = await screenshotElement(
      await pages[0],
      "#videos video"
    );
    await expect(readQrCode(user2VideoImage)).rejects.toBe(
      "Couldn't find enough finder patterns:0 patterns found"
    );
  });

  test("２の音声が１に届いている", async () => {
    await setTimeout(1000);

    let audioLevel = [];
    for (var i = 0; i < 10; i++) {
      audioLevel.push(await page1.$eval("#volume", (e) => e.value));
      await setTimeout(100);
    }

    expect(audioLevel.some((level) => level > 0)).toBe(true);
  });

  test.only("２がミュートすると２の音声が１に届かなくなる", async () => {
    await setTimeout(1000);

    await page2.click("#muteAudioBtn");

    await setTimeout(1000);

    let audioLevel = [];
    for (var i = 0; i < 10; i++) {
      audioLevel.push(await page1.$eval("#volume", (e) => e.value));
      await setTimeout(100);
    }

    expect(audioLevel.some((level) => level > 0)).toBe(true);
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
async function screenshotElement(page, selector) {
  const clip = await page.evaluate((s) => {
    const el = document.querySelector(s);
    const { width, height, top: y, left: x } = el.getBoundingClientRect();
    return { width, height, x, y };
  }, selector);
  return await page.screenshot({ clip });
}
