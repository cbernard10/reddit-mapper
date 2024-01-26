import express from "express";
import { User, UserSubreddit } from "../models/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  try {
    const user = await User.create({ name });
    res.json(user);
  } catch (e) {
    console.log("cannot add user", e);
    return res.status(400).json({ error: "User already exists" });
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

// router.delete("/:name", async (req, res) => {
//   const { name } = req.params;

//   const user = await User.findOne({
//     where: { name: name },
//   });

//   try {
//     await user.destroy();
//     res.json(user);
//   } catch (e) {
//     console.log("cannot delete user", e);
//   }
// });

export { router };
