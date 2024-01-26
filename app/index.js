import getHtml from "./lib/parseHtml.js";
import {
  getThreads,
  getComments,
  getSubredditUsers,
  overlappingUsers,
  crawlAndFillDatabase
} from "./lib/getSubredditData.js";
import { sleep } from "./lib/utils.js";

const URL = "https://old.reddit.com/r/all/";

(async () => {
  //   const threads = await getThreads("r/all", 0, "top", "all");
  //   await sleep(1);
  //   const data = await getComments("https://old.reddit.com/r/programming/comments/19f710s/my_journey_modifying_the_rust_compiler_to_target/");
  //   console.log(data.map(d => d.author))
//   await sleep(1);
//   console.log("fetching users");

//   const overlap = await overlappingUsers("r/destiny", "r/vaushv");
//   console.log(overlap)
    crawlAndFillDatabase("r/random", 0, "top", "all", 1);
})();
