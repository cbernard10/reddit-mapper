import cheerio from "cheerio";
import getHtml from "../lib/parseHtml";
import { getThreads } from "../lib/getSubredditData";
import { start_browser, browser } from "../lib/browser";

describe("get subreddit", () => {
  beforeAll(async () => {
    await start_browser();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("should get subreddit posts", async () => {
    const html = await getHtml("https://old.reddit.com/r/programming/");
    const $ = cheerio.load(html);
    expect($(".thing")).toBeDefined();
  });

  test("should detect subreddits that do not exist", async () => {
    const html = await getHtml(
      "https://old.reddit.com/r/aerareazaeraerazrezrleauher/"
    );
    const $ = cheerio.load(html);
    expect(
      Math.max($("#classy-error").length, $("div>.searchpane>h4").length)
    ).toBe(1);
  });
});
