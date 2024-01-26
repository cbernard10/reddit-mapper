import Subreddit from "./subreddit.js";
import User from "./user.js";
import UserSubreddit from "./userSubreddit.js";

User.belongsToMany(Subreddit, { through: UserSubreddit });
Subreddit.belongsToMany(User, { through: UserSubreddit });

export { Subreddit, User, UserSubreddit };
