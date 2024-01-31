import { crawl } from "./lib/getSubredditData";
import config from "./config.json" assert { type: "json" };

(async () => {
  crawl(config);
})();
