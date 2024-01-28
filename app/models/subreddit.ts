import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

import { sequelize } from "../util/db";

class Subreddit extends Model<
  InferAttributes<Subreddit>,
  InferCreationAttributes<Subreddit>
> {
  declare id: CreationOptional<number>;
  declare scraped: CreationOptional<boolean>;
  name!: string;
}
Subreddit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    scraped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "subreddit",
    underscored: true,
    timestamps: true,
  }
);

export default Subreddit;
