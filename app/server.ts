import express from "express";
import { PORT } from "./util/config";
import { connectToDatabase } from "./util/db";
import { router as subredditRouter } from "./controllers/subreddits";
import { router as userRouter } from "./controllers/users";
import { router as connectRouter } from "./controllers/connect";
import { router as overlapRouter } from "./controllers/overlaps";
import { router as resetRouter } from "./controllers/reset";

const app = express();
app.use(express.json());

app.use("/r", subredditRouter);
app.use("/u", userRouter);
app.use("/connections", connectRouter);
app.use("/overlaps", overlapRouter);
app.use("/api/reset", resetRouter);

const start = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
