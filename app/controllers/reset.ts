import express from "express";
import { UserSubreddit, User, Subreddit } from "../models/index";

const router = express.Router();

router.delete("/", async (req, res) => {
  await UserSubreddit.destroy({
    where: {},
  });
  await User.destroy({
    where: {},
  });
  await Subreddit.destroy({
    where: {},
  });
  res.json({ message: "All data deleted" });
});

export { router };
