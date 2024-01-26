import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

import { sequelize } from "../util/db";

class UserSubreddit extends Model<
  InferAttributes<UserSubreddit>,
  InferCreationAttributes<UserSubreddit>
> {
  declare id: CreationOptional<number>;
  userId!: number;
  subredditId!: number;
}

UserSubreddit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    subredditId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "subreddits", key: "id" },
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: "user_subreddit",
  }
);

export default UserSubreddit;
