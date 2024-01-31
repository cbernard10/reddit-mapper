import { getThreads, getComments } from "../lib/getSubredditData";
import { start_browser, browser } from "../lib/browser";
import { sleep } from "../lib/utils";

describe("get subreddit", () => {
  beforeAll(async () => {
    await start_browser();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await sleep(1);
  });

  test("get threads if subreddit exists", async () => {
    const threads = await getThreads("r/all", 1050)!;
    expect(threads).toBeDefined();
    if (threads) expect(threads.length).toBeGreaterThan(0);
  });

  test("get nothing if subreddit doesn't exist", async () => {
    const threads = await getThreads("r/thissubredditdoesntexist", 1050);
    expect(threads).toBeNull();
  });

  test("return null if string is invalid", async () => {
    const threads = await getThreads("abcdefg", 1050);
    expect(threads).toBeNull();
  });

  test("get comments if thread exists", async () => {
    const threads = await getThreads("r/all", 1050)!;
    expect(threads).toBeDefined();
    if (threads) {
      expect(threads.length).toBeGreaterThan(0);
      const thread = threads[0];
      const comments = await getComments(thread.thread);
      expect(comments).toBeDefined();
      if (comments) expect(comments.length).toBeGreaterThan(0);
    }
  });

  test("get nothing if thread doesn't exist", async () => {
    const comments = await getComments(
      "https://old.reddit.com/r/all/comments/abcdefg"
    );
    expect(comments).toBeNull();
  });
});
