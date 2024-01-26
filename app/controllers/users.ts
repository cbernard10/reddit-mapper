import express from "express";
import { User, UserSubreddit, Subreddit } from "../models/index";
import { UniqueConstraintError } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.findAll({
    include: {
      model: Subreddit,
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });
  res.json(users);
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
    res.json(user);
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      return res.status(400).json({
        error: `user ${name} already exists`,
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
    res.json({ message: "All users deleted" });
  } catch (e) {
    console.log("cannot delete users", e);
  }
});

export { router };
