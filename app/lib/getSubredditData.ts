import cheerio from "cheerio";
import getHtml from "./parseHtml";
import { sleep, userFrequencyMap } from "./utils";
import axios from "axios";

let DISPLAY_BUFFER = ["\r"];

const log = () => {
  console.clear();
  keepLastN();
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

type Comment = {
  first: string;
  author: string;
  upvotes: string;
};

export const getComments = async (url: string): Promise<Comment[]> => {
  const html = await getHtml(url);
  const $ = cheerio.load(html);

  const comments: Comment[] = [];

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
      await axios.post("http://localhost:3001/api/subreddits", {
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
        await axios.post("http://localhost:3001/api/users", {
          name: user,
        });
      } catch (error) {
        // console.log(error.response.data.error);
        n_users_already_saved++;
      }

      await axios.post("http://localhost:3001/api/connections", {
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
