import express from "express";
import { UserSubreddit, User, Subreddit } from "../models/index";

const router = express.Router();

router.delete("/", async (req, res) => {
  const connections = await UserSubreddit.findAll({});

  for (const connection of connections) {
    await connection.destroy();
  }
  console.log("connections deleted");

  const users = await User.findAll({});
  for (const user of users) {
    await user.destroy();
  }
  console.log("users deleted");
  const subreddits = await Subreddit.findAll({});
  for (const subreddit of subreddits) {
    await subreddit.destroy();
  }

  console.log("subreddits deleted");
  res.json({ message: "All data deleted" });
});

export { router };
