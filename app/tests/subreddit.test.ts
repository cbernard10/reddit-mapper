import cheerio from "cheerio";
import getHtml from "../lib/parseHtml";

describe("get subreddit", () => {
  test("should get subreddit posts", async () => {
    const html = await getHtml("https://old.reddit.com/r/programming/");
    const $ = cheerio.load(html);
    expect($(".thing")).toBeDefined();
  });
});
