import {
  crawlAndFillDatabase2,
} from "./lib/getSubredditData";

(async () => {
  const subreddit: string = process.argv[2];
  crawlAndFillDatabase2(subreddit);
})();
