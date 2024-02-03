import { Config, Thread, ThreadComment, UserComment } from "../types";
import cheerio from "cheerio";
import getHtml from "./parseHtml";
import { sleep, userFrequencyMap } from "./utils";
import axios from "axios";
import { start_browser, browser, page } from "./browser";
import "dotenv/config";

let DISPLAY_BUFFER = ["\r"];

const log = () => {
  if (process.env.NODE_ENV !== "test") {
    console.clear();
    keepLastN(100);
    console.log(DISPLAY_BUFFER.join("\n"));
  }
};

const keepLastN = (n = 30) => {
  DISPLAY_BUFFER = DISPLAY_BUFFER.slice(DISPLAY_BUFFER.length - n);
};

const newMessage = (msg: string) => {
  DISPLAY_BUFFER.push(msg);
  log();
};

const replaceMessage = (msg: string) => {
  DISPLAY_BUFFER[DISPLAY_BUFFER.length - 1] = msg;
  log();
};

const deleteLast = () => {
  DISPLAY_BUFFER.pop();
  log();
};

const newAverage = (old_average: number, new_value: number, alpha = 0.3) => {
  // EMA
  return old_average + (new_value - old_average) * alpha;
};

export const getThreads = async (
  from: string,
  sleep_request: number,
  deep: boolean = false,
  sortBy: string | null = null,
  time: string | null = null
): Promise<Thread[] | null> => {
  const [type, page] = from.split("/");

  if (type != "r" && type != "u") return null;

  let next_page;

  if (type === "r") {
    next_page = `https://old.reddit.com/r/${page}/`;
    if (sortBy) {
      next_page = `https://old.reddit.com/r/${page}/${sortBy}/`;
    }
  }

  if (type === "u") {
    next_page = `https://old.reddit.com/u/${page}/submitted/`;
  }

  if (time) next_page += `?sort=${sortBy}&t=${time}`;

  let threads: Thread[] = [];

  if (process.env.NODE_ENV === "development") {
    newMessage(`Fetching ${next_page}`);
  }

  let it = 0;

  newMessage("");
  while (next_page) {
    replaceMessage(`Fetching page ${it + 1}`);
    await sleep(sleep_request / 1000);
    const html = await getHtml(next_page);
    const $ = cheerio.load(html);

    const newThreads: Thread[] = [];

    if ($("#classy-error").length > 0 || $("div>.searchpane>h4").length > 0) {
      return null;
    }

    $(".thing")
      .not(".promoted")
      .each((_, thing) => {
        const $thing = $(thing);
        newThreads.push({
          author: $thing.attr("data-author")!,
          data: $thing.attr("data-url")!,
          title: $thing
            .find(".entry")
            .find(".top-matter")
            .find(".title")
            .find(".title")
            .text()!,
          upvotes: $thing.find(".unvoted").find(".unvoted").text()!,
          thread: $thing.find(".bylink").attr("href")!,
          date: $thing.find("time").attr("datetime")!,
        });
      });

    threads = [...threads, ...newThreads];

    next_page =
      !deep || it == 19 ? undefined : $(".next-button").find("a").attr("href");
    it++;
  }
  deleteLast();
  return threads;
};

export const getComments = async (
  url: string
): Promise<ThreadComment[] | null> => {
  if (process.env.NODE_ENV === "development") {
    newMessage(`Fetching comments in ${url}`);
  }

  const html = await getHtml(url);
  const $ = cheerio.load(html);

  const comments: ThreadComment[] = [];

  if ($("#classy-error").length > 0 || $("div>.searchpane>h4").length > 0) {
    return null;
  }

  $(".comment").each((_, comment) => {
    const $comment = $(comment);
    comments.push({
      first: $comment.find("form").text()!,
      author: $comment.find(".author").first().text()!,
      upvotes: $comment.find(".unvoted").find(".unvoted").attr("title")!,
    });
  });
  return comments;
};

export const getSubredditUsers = async (
  subreddit: string,
  sleep_request: number
) => {
  const allThreads = await getThreads(
    subreddit,
    sleep_request,
    true,
    "hot",
    "all"
  );

  if (!allThreads) return null;
  const threadUrls = allThreads.map((t) => t.thread);

  let users: string[] = [];

  for (let i = 0; i < threadUrls.length; i++) {
    const thread = threadUrls[i];
    await sleep(sleep_request);
    const comments = await getComments(thread);
    if (!comments) continue;
    await sleep(sleep_request);
    const newUsers = comments.map((c) => c.author);
    users = [...users, ...newUsers];
  }

  if (users.length === 0) return null;

  return Object.keys(userFrequencyMap(users));
};

export const getCommentsFromUser = async (user: string) => {
  if (user === "[deleted]" || user === "" || user === "AutoModerator")
    return null;

  const html = await getHtml(`https://old.reddit.com/user/${user}/comments/`);
  const $ = cheerio.load(html);

  if (
    $("#classy-error").length > 0 ||
    $("div>.searchpane>h4").length > 0 ||
    $("[src='//www.redditstatic.com/interstitial-image-banned.png']").length > 0
  ) {
    return null;
  }

  const comments: UserComment[] = [];

  $(".comment").each((_, comment) => {
    const $comment = $(comment);
    comments.push({
      inSubreddit: $comment.find(".subreddit").first().text()!,
      comment: $comment.find("form").text()!,
    });
  });
  return comments;
};

const restartBrowser = async () => {
  newMessage("Restarting browser");
  let pages = await browser.pages();
  await Promise.all(pages.map((p) => p.close()));
  await browser.close();
  await start_browser();
  const ua: string = (await page!.evaluate("navigator.userAgent")) as string;
  newMessage(`UA: ${ua}`);
};

const timestamp = (): string => {
  const d = new Date();
  return d.toTimeString().split(" ")[0];
};

const getRandomSubreddit = async () => {
  const randomSubreddit = await axios.get("http://localhost:3001/r/random");
  let seed;
  if (!randomSubreddit.data.name) {
    seed = "r/all";
  } else {
    seed = `r/${randomSubreddit.data.name}`;
  }
  return seed;
};

export const crawl = async (config: Config): Promise<void> => {
  // steps:
  // 1 - start from seed subreddit
  // 2 - get all recent threads from seed subreddit (sort by hot)
  // 3 - get all users from all threads, add them to db and link them to sub through userSubreddit
  // 4 - for each user, get all subreddits in which they have posted, add them to db with flag scraped=false and link them to user through userSubreddit
  // 5 - select random subreddit with scraped=false, set scraped to true and repeat from step 2

  const { start, sleep_request, restart_every, deep } = config;

  const from = start;

  if (!from.startsWith("r/"))
    throw new Error("from must be a subreddit (e.g. r/all)");

  let seed = "";
  if (!from) {
    seed = "r/all";
  } else {
    seed = from;
  }

  let numberOfRequests = 0;

  let scraper_retry_times = [1, 10, 60, 300, 1800];
  let scraper_retry_time_idx = 0;

  await start_browser();
  const ua: string = (await page!.evaluate("navigator.userAgent")) as string;
  newMessage(`UA: ${ua}`);

  while (true) {
    try {
      newMessage(seed);

      if (seed.split("/")[1] === "u") {
        newMessage("Seed is a user, skipping");
        seed = await getRandomSubreddit();
      }

      // step 1

      const displaySubredditName = seed.split("/")[1];
      const subredditName = displaySubredditName.toLowerCase(); // 1
      let allThreads: Thread[] | null = [];

      try {
        allThreads = await getThreads(seed, sleep_request, deep, "hot", "all"); // 2
        if (!allThreads) {
          newMessage(
            `No thread found in ${subredditName}, selecting new random subreddit`
          );
          seed = await getRandomSubreddit();
          continue;
        }
        if (process.env.NODE_ENV === "development") {
          newMessage(
            `Got ${
              allThreads.length
            } threads from ${subredditName}: ${JSON.stringify(
              allThreads.map((t) => t.thread),
              null,
              2
            )}`
          );
        }
      } catch (error) {
        const e = error as Error;

        if (e.message === "subreddit does not exist") {
          throw new Error(`subreddit ${subredditName} does not exist`);
        } else {
          newMessage(
            `Could not get threads from ${subredditName}: ${e}, restarting browser`
          );
          await restartBrowser();
          continue;
        }
      }

      numberOfRequests = deep
        ? numberOfRequests + allThreads.length
        : numberOfRequests + 1;
      if (numberOfRequests % restart_every === 0) {
        await restartBrowser();
      }

      newMessage(`\nNew node: ${subredditName}`);
      const threadUrls = allThreads.map((t) => t.thread);

      let users: string[] = [];
      newMessage(`Fetching ${threadUrls.length} threads`);
      newMessage("");

      let t0, t1;
      let avgTimePerLoop = 0;

      for (let i = 0; i < allThreads.length; i++) {
        t0 = Date.now();
        const thread = allThreads[i];
        let comments: ThreadComment[] = [];
        try {
          const res = await getComments(thread.thread); // get comments
          if (!res) {
            newMessage(`Could not get comments from ${thread.thread}`);
            continue;
          } else {
            comments = res;
          }
        } catch (e) {
          newMessage(`Could not get comments from ${thread.thread}: ${e}`);
          continue;
        }
        numberOfRequests += 1;
        if (numberOfRequests % restart_every === 0) {
          await restartBrowser();
        }
        const newUsers = comments.map((c) => c.author); // get active users from current thread
        users = [...users, ...newUsers];
        t1 = Date.now();
        if (t1 - t0 < sleep_request) {
          await sleep((sleep_request - (t1 - t0)) / 1000);
          t1 = Date.now();
        }

        avgTimePerLoop = newAverage(avgTimePerLoop, t1 - t0);
        let remaining = (avgTimePerLoop * (allThreads.length - i)) / 1000;

        newMessage(
          `${timestamp()} | ${displaySubredditName} | ${thread.thread} by ${
            thread.author
          } \n - ${i + 1}/${allThreads.length} | ${t1 - t0} ms | ${(
            1000 / avgTimePerLoop
          ).toFixed(2)} it/s | ${remaining.toFixed(0)}s left`
        );
      }

      const uniqueUsers = Object.keys(userFrequencyMap(users));

      // start saving to db

      try {
        await axios.post("http://localhost:3001/r", {
          name: subredditName,
          scraped: true,
        });
      } catch (e) {
        console.log("could not add subreddit:", e, "restarting browser");
        await restartBrowser();
        continue;
      }

      let n_users_already_saved = 0;
      let uniqueUserSubreddits: string[] = [];

      newMessage("Adding users to database");
      newMessage("");

      avgTimePerLoop = 0;

      for (let i = 0; i < uniqueUsers.length; i++) {
        t0 = Date.now();
        // for each user

        const user = uniqueUsers[i].toLowerCase();

        if (
          !user ||
          user === "[deleted]" ||
          user === "" ||
          user === "AutoModerator"
        )
          continue;

        try {
          const userComments = await getCommentsFromUser(user); // get all comments from user
          numberOfRequests += 1;
          if (numberOfRequests % restart_every === 0) {
            await restartBrowser();
          }
          if (!userComments) continue;
          const userSubreddits = userComments.map((c) => c.inSubreddit); // get all subreddits from user
          uniqueUserSubreddits = Object.keys(userFrequencyMap(userSubreddits)); // get unique subreddits in which user has posted
        } catch (e) {
          newMessage(
            `Could not get comments from user ${user}: ${e}, "restarting browser"`
          );
          await restartBrowser();
          continue;
        }

        try {
          // if user alredy exists, skip saving
          await axios.post("http://localhost:3001/u", {
            name: user,
          });
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            newMessage(
              `did not add user ${user}, ${error.response.data.error}`
            );
          } else {
            newMessage(`did not add user ${user}, ${error}`);
          }
          n_users_already_saved++;
        }

        if (subredditName !== "all") {
          try {
            await axios.post("http://localhost:3001/connections", {
              // link user to subreddit A (source node)
              user: user,
              subreddit: subredditName,
            });
          } catch (e) {
            newMessage(
              `did not add connection ${subredditName} -> ${user}, ${e}`
            );
          }
        }

        // for each subreddit in which user has posted, add to db with flag scraped=false and link to user

        for (let j = 0; j < uniqueUserSubreddits.length; j++) {
          const userSubreddit = uniqueUserSubreddits[j].toLowerCase();

          if (!userSubreddit || userSubreddit === "") continue;
          if (userSubreddit === subredditName) {
            continue;
          }

          try {
            await axios.post("http://localhost:3001/r", {
              // link user to subreddit B (target node)
              name: userSubreddit,
              scraped: userSubreddit === subredditName,
            });
          } catch (e) {
            newMessage(`did not add subreddit ${userSubreddit}, ${e}`);
            continue;
          }

          try {
            await axios.post("http://localhost:3001/connections", {
              user: user,
              subreddit: userSubreddit,
            });
          } catch (e) {
            newMessage(
              `did not add connection ${userSubreddit} -> ${user}, {e}`
            );
          }
        }

        t1 = Date.now();
        if (t1 - t0 < sleep_request) {
          await sleep((sleep_request - (t1 - t0)) / 1000);
          t1 = Date.now();
        }

        avgTimePerLoop = newAverage(avgTimePerLoop, t1 - t0);

        const timeLeft = (avgTimePerLoop * (uniqueUsers.length - i)) / 1000;

        const minutesRemaining = Math.floor(timeLeft / 60);
        const secondsRemaining = Math.floor(timeLeft % 60);

        const d = new Date();

        newMessage(
          `${
            d.toTimeString().split(" ")[0]
          } | ${displaySubredditName} --${user}--> (${
            uniqueUserSubreddits.length
          }) \n- ${i + 1}/${uniqueUsers.length} | ${t1 - t0} ms | ${(
            1000 / avgTimePerLoop
          ).toFixed(2)} it/s | ${minutesRemaining}:${secondsRemaining} left`
        );
      }

      newMessage(
        `Added ${
          uniqueUsers.length - n_users_already_saved
        } unique users to database for node ${subredditName}`
      );

      // select random subreddit with scraped=false, set scraped to true and repeat from step 2

      const randomSubreddit = await axios.get("http://localhost:3001/r/random");
      seed = `r/${randomSubreddit.data.name}`;
      await restartBrowser();
    } catch (e) {
      await sleep(scraper_retry_times[scraper_retry_time_idx]);

      scraper_retry_time_idx = Math.min(
        scraper_retry_time_idx + 1,
        scraper_retry_times.length - 1
      );

      newMessage(
        `Error: ${e}, retrying in ${scraper_retry_times[scraper_retry_time_idx]}s`
      );
    }
  }
};
