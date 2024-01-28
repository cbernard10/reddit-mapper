import puppeter from "puppeteer";
import cheerio from "cheerio";
import "dotenv/config";

const getHtml = async (url: string): Promise<string> => {
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
          headless: "new",
          args: ["--lang=en-US"],
        });

  await Promise.all((await browser.pages()).map((page) => page.close()));

  let html = "";
  try {
    let page = await browser.newPage();
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
    await page.setUserAgent(ua);
    await page.goto(url);

    html = await page.content();
    const $ = cheerio.load(html);
    if ($(".buttons").find('[name="over18"], [value="yes"]').length > 0) {
      try {
        await page.$eval('form>div>[value="yes]', (element) => {
          if (element instanceof HTMLElement) element.click();
        });

        await page.waitForNavigation();
        await page.waitForSelector(".thing", { timeout: 5000 });
        html = await page.content();
      } catch (e) {
        throw new Error(`could not find button: ${e} in page ${url}`);
      }
    }
  } catch (e) {
    throw new Error(`could not get html from ${url}: ${e}`);
  } finally {
    await browser.close();
  }

  return html;
};

export default getHtml;
