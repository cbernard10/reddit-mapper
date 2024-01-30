import cheerio from "cheerio";
import { browser, page } from "./browser";
import "dotenv/config";

const getHtml = async (url: string): Promise<string> => {
  let html = "";
  if (!page) {
    return "";
  }
  try {

    try {
      await page.goto(url, { timeout: 5000 });
    } catch (e) {
      throw new Error(`url unreachable ${url}: ${e}`);
    }

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
