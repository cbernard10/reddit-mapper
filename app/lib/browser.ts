import puppeter, { PuppeteerLaunchOptions } from "puppeteer";
import { Browser, Page } from "puppeteer";
import "dotenv/config";

const config: PuppeteerLaunchOptions =
  process.env.NODE_ENV === "production"
    ? {
        executablePath:
          process.env.ARCH === "arm"
            ? "/usr/bin/chromium"
            : "/usr/bin/google-chrome",
        headless: "new",
        args: [
          "--lang=en-US",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--single-process",
          "--disable-dev-shm-usage",
          "--no-zygote",
        ],
      }
    : {
        headless: false,
        args: ["--lang=en-US"],
      };

let browser: Browser;
let page: Page | undefined;

const start_browser = async () => {
  browser = await puppeter.launch(config);
  page = await browser.newPage();

  const uas = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
  ];

  await page.setUserAgent(uas[1]);
};

// await start_browser();

export { browser, page, start_browser };
