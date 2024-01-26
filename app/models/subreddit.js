import { DataTypes, Model } from "sequelize";
import { sequelize } from "../util/db.js";

class Subreddit extends Model {}
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
  },
  { sequelize, modelName: "subreddit", underscored: true, timestamps: false }
);

export default Subreddit;
