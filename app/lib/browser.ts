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
};

await start_browser();

export { browser, page, start_browser };
