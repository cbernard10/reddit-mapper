import { DataTypes } from "sequelize";

const up = async ({ context: queryInterface }) => {
  await queryInterface.createTable("subreddits", {
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
  });
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });
  await queryInterface.addColumn("subreddits", "user_id", {
    type: DataTypes.INTEGER,
    references: { model: "users", key: "id" },
  });
  await queryInterface.addColumn("users", "subreddit_id", {
    type: DataTypes.INTEGER,
    references: { model: "subreddits", key: "id" },
  });
};

const down = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("subreddits");
  await queryInterface.dropTable("users");
};

export { up, down };
