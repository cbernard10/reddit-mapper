import Subreddit from "./subreddit";
import User from "./user";
import UserSubreddit from "./userSubreddit";

User.belongsToMany(Subreddit, { through: UserSubreddit });
Subreddit.belongsToMany(User, { through: UserSubreddit });

export { Subreddit, User, UserSubreddit };
