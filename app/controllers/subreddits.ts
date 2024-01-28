import express from "express";
import { Subreddit } from "../models/index";
import { UserSubreddit, User } from "../models/index";
import { UniqueConstraintError } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  const subreddits = await Subreddit.findAll({
    attributes: ["name", "scraped"],
    include: {
      model: User,
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });
  res.json(subreddits);
});

router.get("/random", async (req, res) => {
  const subreddits = await Subreddit.findAll({
    attributes: ["name"],
    include: [
      {
        model: User,
        attributes: ["name"],
        through: {
          model: UserSubreddit,
          attributes: [],
        },
      },
    ],
  });
  const random = Math.floor(Math.random() * subreddits.length);
  res.json(subreddits[random]);
});

router.get("/:name", async (req, res) => {
  const { name } = req.params;
  const subreddit = await Subreddit.findOne({
    where: { name },
    attributes: ["name", "scraped"],
    include: {
      model: User,
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });
  res.json(subreddit);
});

router.post("/", async (req, res) => {
  const { name, scraped } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid name" });
  }
  try {
    const subreddit = await Subreddit.create({ name, scraped });
    res.json(subreddit);
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      return res.status(200).json({ message: "Subreddit already exists" });
    } else {
      return res.status(400).json({ error: "Cannot create subreddit" });
    }
  }
});

router.delete("/all", async (req, res) => {
  try {
    await UserSubreddit.destroy({
      where: {},
    });

    await Subreddit.destroy({
      where: {},
    });
    res.status(200).json({ message: "All subreddits deleted" });
  } catch (e) {
    res.status(400).json({ error: "Cannot delete subreddits" });
  }
});

router.delete("/name/:name", async (req, res) => {
  const { name } = req.params;
  let subreddit;
  let connection;

  try {
    subreddit = await Subreddit.findOne({
      where: { name: name },
    });
    if (!subreddit) {
      return res.status(200).json({ message: "Subreddit does not exist" });
    }
  } catch (e) {
    return res.status(200).json({ message: "Subreddit does not exist" });
  }

  try {
    connection = await UserSubreddit.findOne({
      where: { subredditId: subreddit.id },
    });
    if (!connection) {
      return res.status(200).json({ message: "Connection does not exist" });
    }
  } catch (e) {
    return res.status(200).json({ message: "Connection does not exist" });
  }

  try {
    await UserSubreddit.destroy({
      where: {
        subredditId: subreddit.id,
      },
    });

    await subreddit.destroy();

    await User.destroy({
      where: {
        id: connection.userId,
      },
    });
    res.status(204).end();
  } catch (e) {
    console.log("cannot delete subreddit", e);
  }
});

export { router };
