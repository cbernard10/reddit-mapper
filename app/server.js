import express from "express";
import { PORT } from "./util/config.js";
import { connectToDatabase } from "./util/db.js";
import { router as subredditRouter } from "./controllers/subreddits.js";
import { router as userRouter } from "./controllers/users.js";
import { router as connectRouter } from "./controllers/connect.js";

const app = express();
app.use(express.json());

app.use("/api/subreddits", subredditRouter);
app.use("/api/users", userRouter);
app.use("/api/connections", connectRouter);

const start = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
