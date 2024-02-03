import { crawl } from "./lib/getSubredditData";
import config from "./config.json" assert { type: "json" };

(async () => {
  const start: string = process.argv[2] ?? config.start;
  crawl({ ...config, start });
})();
