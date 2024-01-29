import cheerio from "cheerio";
import { browser, page } from "./browser";
import "dotenv/config";

const getHtml = async (url: string): Promise<string> => {
  let html = "";
  try {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
    await page.setUserAgent(ua);
    await page.goto(url);

    html = await page.content();
    const $ = cheerio.load(html);
    if ($(".buttons").find('[name="over18"], [value="yes"]').length > 0) {
      try {
        await page.$eval('form>div>[value="yes"]', (element) => {
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
  }

  return html;
};

export default getHtml;
