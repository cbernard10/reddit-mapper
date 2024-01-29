import { crawl } from "./lib/getSubredditData";

(async () => {
  const subreddit: string = process.argv[2];
  crawl(subreddit, 1050);
})();
