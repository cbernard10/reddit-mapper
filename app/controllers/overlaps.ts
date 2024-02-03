import express from "express";
import { User, UserSubreddit, Subreddit } from "../models/index";
import { Op } from "sequelize";

const router = express.Router();

router.get("/:name", async (req, res) => {
  const { name } = req.params;

  const activeUsers = await User.findAll({
    attributes: ["name"],
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
      attributes: ["name"],
      through: {
        model: UserSubreddit,
        attributes: [],
      },
      where: {
        name: {
          [Op.in]: activeUsers.map((user) => user.get("name")),
        },
      },
    },
    where: {
      [Op.and]: [{ name: { [Op.ne]: name } }],
    },
  });

  res.json(
    overlapsWith.length === 0
      ? null
      : overlapsWith
          .map((o) => o.toJSON())
          .map((o) => {
            return {
              ...o,
              overlappingUsers: o.users.length,
              users: o.users
                .map((u: any) => u.name)
                .sort((a: string, b: string) => a.localeCompare(b)),
            };
          })
          .sort((a, b) => b.overlappingUsers - a.overlappingUsers)
  );
});

export { router };
