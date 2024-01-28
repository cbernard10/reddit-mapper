import {
  crawlAndFillDatabase2,
  getCommentsFromUser,
} from "./lib/getSubredditData";

(async () => {
  const subreddit: string = process.argv[2];
  console.log("subreddit", subreddit)
  crawlAndFillDatabase2(subreddit);
})();
