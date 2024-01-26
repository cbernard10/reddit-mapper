import { DataTypes, Model } from "sequelize";
import { sequelize } from "../util/db.js";

class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
  },
  { sequelize, modelName: "user", underscored: true, timestamps: false }
);

export default User;
