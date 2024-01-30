import cheerio from "cheerio";
import getHtml from "../lib/parseHtml";
import { start_browser, browser } from "../lib/browser";

describe("get user", () => {

  beforeAll(async () => {
    await start_browser();
  })

  afterAll(async () => {
    await browser.close();
  })

  test("should get user comments", async () => {
    const html = await getHtml("https://old.reddit.com/user/spez/");
    const $ = cheerio.load(html);
    expect($(".thing")).toBeDefined();
    expect(
      $(".thing")
        .map((_, thing) => {
          const $thing = $(thing);
          return {
            inSub: $thing.find(".subreddit").first().text(),
          };
        })
        .toArray().length
    ).toBeGreaterThan(0);
  });

  test("should get user comments if user is 18+", async () => {
    const html = await getHtml("https://old.reddit.com/user/decrpt/");
    const $ = cheerio.load(html);
    expect($(".thing")).toBeDefined();
  });

  test("should display 'page not found' if user does not exist", async () => {
    const html = await getHtml(
      "https://old.reddit.com/user/zaerazerdfgdfgfgtdstrtert/"
    );
    const $ = cheerio.load(html);
    expect($("#classy-error>div").attr("class")).toBe("errorpage-message");
  });

  test("should display 'This account has been suspended' if user has been suspended", async () => {
    const html = await getHtml("https://old.reddit.com/user/deleted/");
    const $ = cheerio.load(html);
    expect($(".interstitial-message>.md>h3>a").attr("href")).toBe(
      "https://www.reddithelp.com/en/categories/rules-reporting/account-and-community-restrictions/suspensions"
    );
  });
});
