import express from "express";
import { User, UserSubreddit, Subreddit } from "../models/index";
import { UniqueConstraintError } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.findAll({
    attributes: ["name"],
    include: {
      model: Subreddit,
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });
  res.json(
    !users
      ? null
      : users
          .map((u) => u.toJSON())
          .map((u) => {
            return {
              ...u,
              subredditCount: u.subreddits.length,
              subreddits: u.subreddits
                .map((s) => s.name)
                .sort((a: string, b: string) => a.localeCompare(b)),
            };
          })
          .sort((a, b) => b.subredditCount - a.subredditCount)
  );
});

router.get("/:name", async (req, res) => {
  const { name } = req.params;
  const user = await User.findOne({
    attributes: ["name"],
    where: { name },
    include: {
      model: Subreddit,
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });
  res.json(
    !user
      ? null
      : {
          ...user.toJSON(),
          subredditCount: user.subreddits.length,
          subreddits: user.subreddits
            .map((s) => s.get("name"))
            .sort((a: string, b: string) => a.localeCompare(b)),
        }
  );
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name || !(typeof name === "string")) {
    return res.status(400).json({
      error: "Please provide a valid name",
    });
  }
  try {
    const user = await User.create({ name });
    res.status(200).json(user);
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      return res.status(400).json({
        error: `user ${name} already exists`,
      });
    } else {
      return res.status(400).json({
        error: `could not create user ${name}, ${e}`,
      });
    }
  }
});

router.delete("/all", async (req, res) => {
  try {
    await UserSubreddit.destroy({
      where: {},
    });

    await User.destroy({
      where: {},
    });
    res.status(200).json({ message: "All users deleted" });
  } catch (e) {
    res.status(400).json({ error: "Cannot delete users" });
  }
});

export { router };
