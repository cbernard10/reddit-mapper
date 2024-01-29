import puppeter from "puppeteer";
import "dotenv/config";

const browser =
  process.env.NODE_ENV === "production"
    ? await puppeter.launch({
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
      })
    : await puppeter.launch({
        headless: false,
        args: ["--lang=en-US"],
      });

const page = await browser.newPage();

export { browser, page };
