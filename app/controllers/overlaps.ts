import express from "express";
import { User, UserSubreddit, Subreddit } from "../models/index";
import { Op } from "sequelize";

const router = express.Router();

router.get("/:name", async (req, res) => {
  const { name } = req.params;

  const activeUsers = await User.findAll({
    include: {
      model: Subreddit,
      attributes: ["name"],
      where: {
        name: name,
      },
      through: {
        model: UserSubreddit,
        attributes: [],
      },
    },
  });

  const overlapsWith: Subreddit[] = await Subreddit.findAll({
    attributes: ["name"],
    include: {
      model: User,
      attributes: [],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
      where: {
        name: {
          [Op.in]: activeUsers.map((user) => user.name),
        },
      },
    },
    where: {
      [Op.and]: [{ name: { [Op.ne]: name } }],
    },
  });

  res.json(overlapsWith);
});

export { router };
