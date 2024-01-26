import { DataTypes } from "sequelize";

const up = async ({ context: queryInterface }: { context: any }) => {
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
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
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
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
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

const down = async ({ context: queryInterface }: { context: any }) => {
  await queryInterface.dropTable("subreddits");
  await queryInterface.dropTable("users");
};

export { up, down };
