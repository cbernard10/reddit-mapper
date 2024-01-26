import cheerio from "cheerio";
import getHtml from "./parseHtml.js";
import { sleep, freqMap } from "./utils.js";
import axios from "axios";

export const getThreads = async (
  from,
  deep,
  sortBy = null,
  time = null,
  throttle = 1
) => {
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
  let result = [];

  console.log(next_page);

  while (next_page) {
    console.log(next_page);
    await sleep(1);
    let html = await getHtml(next_page);
    let $ = cheerio.load(html);
    let newResult = $(".thing")
      .map((_, thing) => {
        const $thing = $(thing);

        return {
          author: $thing.attr("data-author"),
          data: $thing.attr("data-url"),
          title: $thing
            .find(".entry")
            .find(".top-matter")
            .find(".title")
            .find(".title")
            .text(),
          upvotes: $thing.find(".unvoted").find(".unvoted").text(),
          thread: $thing.find(".bylink").attr("href"),
          date: $thing.find("time").attr("datetime"),
        };
      })
      .toArray()
      .filter((c) => c.thread);

    result = [...result, ...newResult];

    next_page = !deep ? undefined : $(".next-button").find("a").attr("href");
  }
  return result;
};

export const getComments = async (url) => {
  const html = await getHtml(url);
  const $ = cheerio.load(html);
  const comments = $(".comment")
    .map((_, comment) => {
      const $comment = $(comment);
      return {
        first: $comment.find("form").text(),
        author: $comment.find(".author").first().text(),
        upvotes: $comment.find(".unvoted").find(".unvoted").attr("title"),
      };
    })
    .toArray()
    .filter((c) => c.first);
  return comments;
};

export const getSubredditUsers = async (subreddit) => {
  const allThreads = await getThreads(subreddit, 1, "hot", "all");
  const threadUrls = allThreads.map((t) => t.thread);

  let users = [];

  for (let i = 0; i < threadUrls.length; i++) {
    console.log(`${i}/${threadUrls.length}`);
    const thread = threadUrls[i];
    await sleep(1);
    const comments = await getComments(thread);
    await sleep(1);
    const newUsers = comments.map((c) => c.author);
    users = [...users, ...newUsers];
  }

  return Object.keys(freqMap(users));
};

export const overlappingUsers = async (source, target) => {
  const sourceUsers = await getSubredditUsers(source);
  const targetUsers = await getSubredditUsers(target);
  const overlappingUsers = sourceUsers.filter((u) => targetUsers.includes(u));
  return overlappingUsers.length / targetUsers.length;
};

const getRandomSubreddit = async () => {
  const html = await getHtml("https://old.reddit.com/r/random/");
  const $ = cheerio.load(html);
  const subreddit = $(".redditname").first().find("a").text();
  return `r/${subreddit}`;
};

export const crawlAndFillDatabase = async () => {
  // steps:
  // 1 - start from random subreddit and add to db
  // 2 - get all recent threads from seed subreddit (sort by hot)
  // 3 - get all users from all threads, add them to db and link them to sub through userSubreddit
  // 4 - repeat

  while (true) {
    const seed = await getRandomSubreddit();
    console.log(seed);

    // step 1

    const subredditName = seed.split("/")[1];

    try {
      const res = await axios.post("http://localhost:3001/api/subreddits", {
        name: subredditName,
      });
    } catch (e) {
      console.log("could not add subreddit");
    }
    
    const allThreads = await getThreads(seed, 0, "hot", "all");

    // step 2

    console.log(`getting threads from ${subredditName}`);
    const threadUrls = allThreads.map((t) => t.thread);

    // step 3

    let users = [];
    for (let i = 0; i < threadUrls.length; i++) {
      console.log(`${i}/${threadUrls.length}`);
      const thread = threadUrls[i];
      await sleep(1);
      const comments = await getComments(thread);
      await sleep(1);
      const newUsers = comments.map((c) => c.author);
      users = [...users, ...newUsers];
    }

    const uniqueUsers = Object.keys(freqMap(users));

    console.log("adding users");
    for (let i = 0; i < uniqueUsers.length; i++) {
      const user = uniqueUsers[i];

      try {
        await axios.post("http://localhost:3001/api/users", {
          name: user,
        });
      } catch (e) {
        console.log("could not add users", e);
      }

      await axios.post("http://localhost:3001/api/connections", {
        user: user,
        subreddit: subredditName,
      });
    }
  }
};
