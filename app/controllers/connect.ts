import express from "express";
import { Subreddit } from "../models/index";
import { UserSubreddit, User } from "../models/index";

const router = express.Router();

router.get("/", async (req, res) => {
  const connections = await UserSubreddit.findAll({});
  res.json(connections);
});

router.post("/", async (req, res) => {
  const { subreddit, user } = req.body;
  try {
    const subredditObj = await Subreddit.findOne({
      where: { name: subreddit },
    });
    const userObj = await User.findOne({
      where: { name: user },
    });

    await UserSubreddit.create({
      userId: userObj.id,
      subredditId: subredditObj.id,
    });
    res.json(subreddit);
  } catch (e) {
    console.log("cannot add connection", e);
  }
});

export { router };
