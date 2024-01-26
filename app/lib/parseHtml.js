import puppeter from "puppeteer";
import cheerio from "cheerio";

const getHtml = async (url, headless) => {
  const browser = await puppeter.launch({
    executablePath: '/usr/bin/google-chrome',
    headless:"new",
    args: ["--lang=en-US"],
  });
  let page = await browser.newPage();
  const ua =

    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
  await page.setUserAgent(ua);
  await page.goto(url);

  let html = await page.content();
  const $ = cheerio.load(html);
  if ($(".buttons").find('[name="over18"], [value="yes"]').length > 0) {
    console.log("ok");
    try {
      await page.$eval('form>div>[value="yes', (element) => {
        element.click();
      });

      await page.waitForNavigation();
      await page.waitForSelector(".thing");
      html = await page.content();
    } catch (e) {
      console.log(`error loading page: ${e}`);
    }
  }
  await browser.close();
  return html;
};

export default getHtml;
