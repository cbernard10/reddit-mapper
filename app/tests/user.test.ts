import { start_browser, browser } from "../lib/browser";
import { getCommentsFromUser } from "../lib/getSubredditData";
import { sleep } from "../lib/utils";

describe("get user", () => {
  beforeAll(async () => {
    await start_browser();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await sleep(1);
  });

  test("get user comments if user exists", async () => {
    const comments = await getCommentsFromUser("spez");
    expect(comments).toBeDefined();
    if (comments) expect(comments.length).toBeGreaterThan(0);
  });

  test("null if user doesn't exist", async () => {
    const comments = await getCommentsFromUser(
      "kazuhekajzrhkajzerhgkjzaerghakzrhekra"
    );
    expect(comments).toBeNull();
  });

  test("null if user is empty string or suspended", async () => {
    const comments = await getCommentsFromUser("");
    expect(comments).toBeNull();
  });
});
