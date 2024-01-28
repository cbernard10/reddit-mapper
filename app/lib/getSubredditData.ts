import cheerio from "cheerio";
import getHtml from "./parseHtml";
import { sleep, userFrequencyMap } from "./utils";
import axios from "axios";
import { UserSubreddit } from "../models";

let DISPLAY_BUFFER = ["\r"];

const log = () => {
  console.clear();
  keepLastN(100);
  console.log(DISPLAY_BUFFER.join("\n"));
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

const deleteMessage = () => {
  DISPLAY_BUFFER.pop();
  log();
};

const appendToLast = (msg: string) => {
  DISPLAY_BUFFER[DISPLAY_BUFFER.length - 1] += msg;
  log();
};

const newAverage = (old_average: number, new_value: number, alpha = 0.3) => {
  // EMA
  return old_average + (new_value - old_average) * alpha;
};

interface Thread {
  author: string;
  data: string;
  title: string;
  upvotes: string;
  thread: string;
  date: string;
}

export const getThreads = async (
  from: string,
  deep: boolean,
  sortBy: string | null = null,
  time: string | null = null
): Promise<Thread[]> => {
  const [type, page] = from.split("/");

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

  while (next_page) {
    await sleep(1);
    const html = await getHtml(next_page);
    const $ = cheerio.load(html);

    const newThreads: Thread[] = [];

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

    next_page = !deep ? undefined : $(".next-button").find("a").attr("href");
  }
  return threads;
};

type ThreadComment = {
  first: string;
  author: string;
  upvotes: string;
};

export const getComments = async (url: string): Promise<ThreadComment[]> => {
  const html = await getHtml(url);
  const $ = cheerio.load(html);

  const comments: ThreadComment[] = [];

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

export const getSubredditUsers = async (subreddit: string) => {
  const allThreads = await getThreads(subreddit, true, "hot", "all");
  const threadUrls = allThreads.map((t) => t.thread);

  let users: string[] = [];

  for (let i = 0; i < threadUrls.length; i++) {
    console.log(`${i}/${threadUrls.length}`);
    const thread = threadUrls[i];
    await sleep(1);
    const comments = await getComments(thread);
    await sleep(1);
    const newUsers = comments.map((c) => c.author);
    users = [...users, ...newUsers];
  }

  return Object.keys(userFrequencyMap(users));
};

type UserComment = {
  inSubreddit: string;
  comment: string;
};

export const getCommentsFromUser = async (user: string) => {
  const html = await getHtml(`https://old.reddit.com/user/${user}/comments/`);
  const $ = cheerio.load(html);

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

const getRandomSubreddit = async (): Promise<string> => {
  const html = await getHtml("https://old.reddit.com/r/random/");
  const $ = cheerio.load(html);
  const subreddit = $(".redditname").first().find("a").text();
  return `r/${subreddit}`;
};

export const crawlAndFillDatabase = async (
  deep: boolean = false
): Promise<void> => {
  // steps:
  // 1 - start from random subreddit and add to db
  // 2 - get all recent threads from seed subreddit (sort by hot)
  // 3 - get all users from all threads, add them to db and link them to sub through userSubreddit
  // 4 - repeat

  while (true) {
    const seed = await getRandomSubreddit();

    // step 1

    const subredditName = seed.split("/")[1].toLowerCase();

    const allThreads = await getThreads(seed, deep, "hot", "all");

    // step 2

    newMessage(`New node: ${subredditName}`);
    const threadUrls = allThreads.map((t) => t.thread);

    // step 3

    let users: string[] = [];
    newMessage(`Fetching users ${threadUrls.length} threads`);
    for (let i = 0; i < threadUrls.length; i++) {
      replaceMessage(`${i + 1}/${threadUrls.length}`);
      const thread = threadUrls[i];
      await sleep(1);
      const comments = await getComments(thread);
      await sleep(1);
      const newUsers = comments.map((c) => c.author);
      users = [...users, ...newUsers];
    }

    const uniqueUsers = Object.keys(userFrequencyMap(users));

    try {
      await axios.post("http://localhost:3001/r", {
        name: subredditName,
      });
    } catch (e) {
      console.log("could not add subreddit:", e);
      continue;
    }

    newMessage(
      `Found ${uniqueUsers.length} active users in node ${subredditName}`
    );
    let n_users_already_saved = 0;

    for (let i = 0; i < uniqueUsers.length; i++) {
      const user = uniqueUsers[i];
      if (
        !user ||
        user === "[deleted]" ||
        user === "" ||
        user === "AutoModerator"
      )
        continue;

      try {
        // if user alredy exists, skip
        await axios.post("http://localhost:3001/u", {
          name: user,
        });
      } catch (error) {
        // console.log(error.response.data.error);
        n_users_already_saved++;
      }

      await axios.post("http://localhost:3001/connections", {
        user: user,
        subreddit: subredditName,
      });
    }

    newMessage(
      `Added ${
        uniqueUsers.length - n_users_already_saved
      } unique users to database for node ${subredditName}`
    );
  }
};

export const crawlAndFillDatabase2 = async (
  from: string = "r/all",
  deep: boolean = false
): Promise<void> => {
  // steps:
  // 1 - start from seed subreddit
  // 2 - get all recent threads from seed subreddit (sort by hot)
  // 3 - get all users from all threads, add them to db and link them to sub through userSubreddit
  // 4 - for each user, get all subreddits in which they have posted, add them to db with flag scraped=false and link them to user through userSubreddit
  // 5 - select random subreddit with scraped=false, set scraped to true and repeat from step 2

  let seed = null;
  let numberOfRequests = 0;

  let globalT0 = Date.now();
  let info = "";

  let scraper_retry_times = [1, 10, 60, 300, 1800];
  let scraper_retry_time_idx = 0;

  while (true) {
    try {
      scraper_retry_time_idx = 0;
      seed = seed ?? from;

      // step 1

      const displaySubredditName = seed.split("/")[1];
      const subredditName = displaySubredditName.toLowerCase(); // 1
      const allThreads = await getThreads(seed, deep, "hot", "all"); // 2

      numberOfRequests = deep
        ? numberOfRequests + allThreads.length
        : numberOfRequests + 1;

      newMessage(`\nNew node: ${subredditName}`);
      const threadUrls = allThreads.map((t) => t.thread);

      let users: string[] = [];
      newMessage(`Fetching ${threadUrls.length} threads`);
      newMessage("");

      let t0, t1;
      let avgTimePerLoop = 0;

      for (let i = 0; i < allThreads.length; i++) {
        // for each thread
        t0 = Date.now();

        const thread = allThreads[i];
        const comments = await getComments(thread.thread); // get comments
        numberOfRequests += 1;
        const newUsers = comments.map((c) => c.author); // get active users from current thread
        users = [...users, ...newUsers];
        t1 = Date.now();

        avgTimePerLoop = newAverage(avgTimePerLoop, t1 - t0);
        newMessage(
          `${displaySubredditName} | ${thread.title} by ${
            thread.author
          } \n - it ${i + 1}/${allThreads.length} | scraped in ${
            (t1 - t0) / 1000
          }s | ${(1000 / avgTimePerLoop).toFixed(2)} it/s | ${(
            (avgTimePerLoop * (allThreads.length - i)) /
            1000
          ).toFixed(2)}s left | ${numberOfRequests} reqs | ${(
            numberOfRequests /
            ((Date.now() - globalT0) / 1000)
          ).toFixed(2)} req/s`
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
        console.log("could not add subreddit:", e);
        continue;
      }

      let n_users_already_saved = 0;

      let uniqueUserSubreddits: string[] = [];

      newMessage("Adding users to database");
      newMessage("");

      avgTimePerLoop = 0;
      let timeLeft: number[] = [];

      for (let i = 0; i < uniqueUsers.length; i++) {
        t0 = Date.now();
        info = "";
        // for each user

        const user = uniqueUsers[i];

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
          const userSubreddits = userComments.map((c) => c.inSubreddit); // get all subreddits from user
          uniqueUserSubreddits = Object.keys(userFrequencyMap(userSubreddits)); // get unique subreddits in which user has posted
        } catch (e) {
          newMessage(`Could not get comments from user ${user}: ${e}`);
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

        try {
          await axios.post("http://localhost:3001/connections", {
            // link user to subreddit A (source node)
            user: user,
            subreddit: subredditName,
          });
        } catch (e) {
          newMessage("did not add connection ${subredditName} -> ${user}");
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
            newMessage(`did not add subreddit ${userSubreddit}`);
            continue;
          }

          try {
            await axios.post("http://localhost:3001/connections", {
              user: user,
              subreddit: userSubreddit,
            });
          } catch (e) {
            newMessage(`did not add connection ${userSubreddit} -> ${user}`);
          }
        }

        t1 = Date.now();
        avgTimePerLoop = newAverage(avgTimePerLoop, t1 - t0);

        const timeLeft = (avgTimePerLoop * (uniqueUsers.length - i)) / 1000;

        const minutesRemaining = Math.floor(timeLeft / 60);
        const secondsRemaining = Math.floor(timeLeft % 60);

        newMessage(
          `${user} connects ${displaySubredditName} to ${
            uniqueUserSubreddits.length
          } subreddits \n- it ${i + 1}/${uniqueUsers.length} | scraped in ${
            (t1 - t0) / 1000
          }s | ${(1000 / avgTimePerLoop).toFixed(
            2
          )} it/s | ${minutesRemaining}min ${secondsRemaining}s left | ${numberOfRequests} reqs | ${(
            numberOfRequests /
            ((Date.now() - globalT0) / 1000)
          ).toFixed(2)} req/s`
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
    } catch (e) {
      await sleep(scraper_retry_times[scraper_retry_time_idx]);

      scraper_retry_time_idx = Math.min(
        scraper_retry_time_idx + 1,
        scraper_retry_times.length - 1
      );

      newMessage(`Error: ${e}`);
    }
  }
};
